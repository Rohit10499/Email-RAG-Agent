import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Loading } from "../components/Loading";
import { 
  IconActivity, 
  IconMail, 
  IconClock, 
  IconRefresh,
  IconServer,
  IconTrendingUp,
  IconAlertCircle
} from "@tabler/icons-react";
import config from "../config";

function Dashboard() {
  const [status, setStatus] = useState({ status: "loading", metrics: {} });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(`${config.API_BASE}/status`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setStatus({
        status: data.state?.toLowerCase() || "unknown",
        metrics: {
          runs_sent: data.processed || 0,
          runs_started: data.pending || 0
        }
      });
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name === 'AbortError') {
        setError("Request timed out. Please check your connection.");
      } else {
        setError(e.message || "Failed to fetch status");
      }
      console.error('Dashboard fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRetry = () => {
    fetchStatus();
  };

  const getStatusColor = (status) => {
    return status === "running" ? "success" : status === "unknown" ? "danger" : "warning";
  };

  const getStatusText = (status) => {
    return status === "running" ? "Online" : status === "unknown" ? "Offline" : "Loading";
  };

  const getStatusIcon = (status) => {
    return status === "running" ? 
      <IconServer className="w-6 h-6 text-green-600" /> : 
      status === "unknown" ? 
      <IconAlertCircle className="w-6 h-6 text-red-600" /> : 
      <IconClock className="w-6 h-6 text-yellow-600" />;
  };

  if (isLoading && !lastUpdated) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Loading size="xl" text="Loading dashboard..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconActivity className="w-8 h-8 text-blue-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Monitor your email agent activity and performance</p>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            )}
            <Button
              onClick={handleRetry}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <IconRefresh className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Agent Status Card */}
          <Card hover={false} className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Agent Status</p>
                <p className={`text-3xl font-bold ${
                  status.status === "running" ? "text-green-600" : 
                  status.status === "unknown" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {getStatusText(status.status)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {status.status === "running" ? "All systems operational" : 
                   status.status === "unknown" ? "Connection failed" : "Initializing..."}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                status.status === "running" ? "bg-green-100" : 
                status.status === "unknown" ? "bg-red-100" : "bg-yellow-100"
              }`}>
                {getStatusIcon(status.status)}
              </div>
            </div>
            {status.status === "running" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
            )}
          </Card>

          {/* Emails Processed Card */}
          <Card hover={false} className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Emails Processed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {status.metrics?.runs_sent || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Successfully handled</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <IconMail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
          </Card>

          {/* Pending Emails Card */}
          <Card hover={false} className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Emails</p>
                <p className="text-3xl font-bold text-orange-600">
                  {status.metrics?.runs_started || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting processing</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <IconClock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-full mt-1">
                <IconAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Connection Error</h3>
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <Button
                  onClick={handleRetry}
                  variant="danger"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <IconRefresh className="w-4 h-4" />
                  Retry Connection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <IconTrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Activity feed coming soon</p>
                <p className="text-sm">Real-time email processing updates will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/logs'}
                >
                  <IconActivity className="w-4 h-4 mr-3" />
                  View Recent Logs
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/history'}
                >
                  <IconMail className="w-4 h-4 mr-3" />
                  Check Email History
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/escalations'}
                >
                  <IconAlertCircle className="w-4 h-4 mr-3" />
                  Review Escalations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">Backend API</p>
                <p className="text-xs text-gray-500">Connected</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">Database</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">Email Service</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard; 