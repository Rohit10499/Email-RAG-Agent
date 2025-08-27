// import React from 'react'

// function Dashboard() {
//   return (
//     <div>
//       <h1 className="text-3xl font-bold mb-4">📊 Dashboard</h1>
//       <div className="grid grid-cols-3 gap-4">
//         <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg">
//           <h3 className="text-lg font-semibold">Agent Status</h3>
//           <p className="text-green-600 font-bold">Idle</p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg">
//           <h3 className="text-lg font-semibold">Emails Processed</h3>
//           <p className="text-blue-600 font-bold">5</p>
//         </div>
//         <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg">
//           <h3 className="text-lg font-semibold">Pending Emails</h3>
//           <p className="text-orange-600 font-bold">2</p>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard


import React, { useEffect, useState } from "react";
import { CometCard } from "../components/comet-card";
import API_BASE from "../config";

function Dashboard() {
  const [status, setStatus] = useState({ status: "loading", metrics: {} });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/status`);
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        setError(String(e));
      }
    }
    load();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen">
      {/* Dashboard Heading */}
      <h1 className="text-3xl font-bold mb-12 text-indigo-700 flex items-center gap-2">
        📊 Dashboard
      </h1>

      {/* Cards Wrapper */}
      <div className="flex flex-wrap justify-center gap-12">
        {/* Agent Status */}
        <CometCard>
          <div className="bg-white rounded-2xl p-10 text-center w-80 h-48 flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-700">
              Agent Status
            </h3>
            <p className="text-green-600 font-bold text-2xl mt-2">
              {status.status === "ok" ? "Online" : status.status}
            </p>
          </div>
        </CometCard>

        {/* Emails Processed */}
        <CometCard>
          <div className="bg-white rounded-2xl p-10 text-center w-80 h-48 flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-700">
              Emails Processed
            </h3>
            <p className="text-blue-600 font-bold text-2xl mt-2">
              {status.metrics?.runs_sent ?? 0}
            </p>
          </div>
        </CometCard>

        {/* Pending Emails */}
        <CometCard>
          <div className="bg-white rounded-2xl p-10 text-center w-80 h-48 flex flex-col justify-center">
            <h3 className="text-xl font-semibold text-gray-700">
              Pending Emails
            </h3>
            <p className="text-orange-600 font-bold text-2xl mt-2">
              {status.metrics?.runs_started ?? 0}
            </p>
          </div>
        </CometCard>
      </div>
      {error && (
        <div className="text-red-600 mt-6 text-sm">{error}</div>
      )}
    </div>
  );
}

export default Dashboard;
