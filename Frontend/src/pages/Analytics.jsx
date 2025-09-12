import React, { useEffect, useMemo, useState } from "react";
import config from "../config";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Loading } from "../components/Loading";
import {
  IconReportAnalytics,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "../theme/ThemeProvider";
import { IconMoon, IconSun } from "@tabler/icons-react";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#7c3aed"];

function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${config.API_BASE}/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dailySeries = useMemo(() => {
    if (!data?.processed_per_day) return [];
    return Object.entries(data.processed_per_day).map(([date, count]) => ({
      date,
      processed: count,
    }));
  }, [data]);

  const distribution = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Answered", value: data.answered || 0, color: "#16a34a" },
      { name: "Escalated", value: data.escalated || 0, color: "#ef4444" },
    ];
  }, [data]);

  const useChartPalette = () => {
    const get = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || undefined;
    const [palette, setPalette] = React.useState({
      line: 'var(--chart-1)',
      bar1: 'var(--chart-1)',
      bar2: 'var(--chart-2)',
      bar3: 'var(--chart-3)',
      pie: ['var(--chart-2)', 'var(--chart-4)'],
      grid: 'rgba(128,128,128,.2)',
      text: 'var(--text)',
    });
    React.useEffect(() => {
      const update = () => setPalette({
        line: get('--chart-1'),
        bar1: get('--chart-1'),
        bar2: get('--chart-2'),
        bar3: get('--chart-3'),
        pie: [get('--chart-2'), get('--chart-4')],
        grid: 'rgba(128,128,128,.2)',
        text: get('--text'),
      });
      update();
      const obs = new MutationObserver(update);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      return () => obs.disconnect();
    }, []);
    return palette;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="w-full">
          <div className="py-20">
            <Loading size="xl" text="Loading analytics..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6">
      {/* Use full width of the content area; no max-* constraints */}
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconReportAnalytics className="w-7 h-7 md:w-8 md:h-8 text-blue-600 shrink-0" />
              <span className="truncate">Analytics</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Performance overview of processed emails
            </p>
          </div>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <IconRefresh className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full mt-1">
                <IconAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Failed to load</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {data && (
          <>
            {/* KPIs - fluid grid; expands up to 12 columns on wide screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card hover={false} className="h-full">
                <CardHeader>
                  <p className="text-sm font-medium text-gray-600">Total Emails</p>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl md:text-4xl font-bold text-indigo-600">{data.total || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">All processed emails</p>
                </CardContent>
              </Card>

              <Card hover={false} className="h-full">
                <CardHeader>
                  <p className="text-sm font-medium text-gray-600">Answered</p>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl md:text-4xl font-bold text-green-600">{data.answered || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Successful auto-replies</p>
                </CardContent>
              </Card>

              <Card hover={false} className="h-full">
                <CardHeader>
                  <p className="text-sm font-medium text-gray-600">Escalated</p>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl md:text-4xl font-bold text-red-600">{data.escalated || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Needs manual attention</p>
                </CardContent>
              </Card>

              {/* Spacer or future KPI */}
              <div className="hidden xl:block" />
            </div>

            {/* Charts using 12-col layout for precise spanning */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              {/* Line: spans 8/12 on lg+ */}
              <Card className="lg:col-span-8">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Daily Processed Emails
                  </h2>
                </CardHeader>
                <CardContent>
                  {dailySeries.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No daily data available
                    </div>
                  ) : (
                    <div className="h-72 md:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="processed" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pie: spans 4/12 on lg+ */}
              <Card className="lg:col-span-4">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Distribution
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar: full width row */}
              <Card className="lg:col-span-12">
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Summary Comparison
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="h-72 md:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Total", value: data.total || 0 },
                        { name: "Answered", value: data.answered || 0 },
                        { name: "Escalated", value: data.escalated || 0 },
                      ]} barSize={48}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6,6,0,0]}>
                          {[0,1,2].map((i) => (
                            <Cell key={i} fill={COLORS[i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;