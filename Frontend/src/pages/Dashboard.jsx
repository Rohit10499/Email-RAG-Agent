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

/*

Claude generated dashboard.
import React, { useState, useEffect } from 'react';
import { Activity, Mail, CheckCircle, AlertTriangle, Clock, Send } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProcessed: 0,
    sent: 0,
    escalated: 0,
    processing: 0,
    avgResponseTime: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [agentStatus, setAgentStatus] = useState('idle');

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, statusRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/recent-activity'),
          fetch('/api/status')
        ]);
        
        setStats(await statsRes.json());
        setRecentActivity(await activityRes.json());
        setAgentStatus(await statusRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerRun = async () => {
    try {
      await fetch('/api/trigger-run', { method: 'POST' });
      // Refresh data after trigger
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to trigger run:', error);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#ef4444' }}>
      <div className="flex items-center">
        <Icon className={`w-8 h-8 text-${color}-500`} />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'idle': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email RAG Agent Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor autonomous email processing activity</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agentStatus)}`}>
              {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
            </div>
            <button 
              onClick={triggerRun}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Trigger Run
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard 
            icon={Mail} 
            label="Total Processed" 
            value={stats.totalProcessed} 
            color="blue" 
          />
          <StatCard 
            icon={Send} 
            label="Sent" 
            value={stats.sent} 
            color="green" 
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Escalated" 
            value={stats.escalated} 
            color="yellow" 
          />
          <StatCard 
            icon={Clock} 
            label="Processing" 
            value={stats.processing} 
            color="blue" 
          />
          <StatCard 
            icon={CheckCircle} 
            label="Avg Response (min)" 
            value={stats.avgResponseTime} 
            color="green" 
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'sent' ? 'bg-green-500' :
                      activity.type === 'escalated' ? 'bg-yellow-500' :
                      activity.type === 'processing' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.email}</p>
                          {activity.reason && (
                            <p className="text-xs text-gray-500 mt-1">{activity.reason}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
*/ 