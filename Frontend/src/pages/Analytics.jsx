import React, { useEffect, useState } from "react";
import axios from "axios";

function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/analytics")
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!data) return <p>Loading analytics...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">📈 Analytics</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="font-semibold">Total Emails</h3>
          <p className="text-xl font-bold text-indigo-600">{data.total}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="font-semibold">Answered</h3>
          <p className="text-xl font-bold text-green-600">{data.answered}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="font-semibold">Escalated</h3>
          <p className="text-xl font-bold text-red-600">{data.escalated}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Daily Processed Emails</h2>
        <ul>
          {Object.entries(data.processed_per_day).map(([day, count]) => (
            <li key={day}>{day}: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Analytics;
