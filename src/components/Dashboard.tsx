import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  MapPin,
  Monitor,
  Keyboard,
  MousePointer2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLogins: 0,
    anomalies: 0,
    blocked: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/stats"),
      ]);
      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();
      setEvents(eventsData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const chartData = events
    .slice(0, 20)
    .reverse()
    .map((e) => ({
      time: format(new Date(e.timestamp), "HH:mm:ss"),
      risk: e.risk_score * 100,
      user: e.username,
    }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                UBPADS Control Center
              </h1>
              <p className="text-sm text-zinc-500">
                User Behavior Profiling & Anomaly Detection System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className={`p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors`}
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Logins (24h)"
            value={stats.totalLogins}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            trend="+12%"
          />
          <StatCard
            title="Anomalies Detected"
            value={stats.anomalies}
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            trend="+2%"
            trendColor="text-amber-400"
          />
          <StatCard
            title="Blocked Sessions"
            value={stats.blocked}
            icon={<XCircle className="w-5 h-5 text-red-400" />}
            trend="-5%"
            trendColor="text-emerald-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Real-Time Risk Analysis
              </h2>
              <span className="text-xs font-medium px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-full">
                Last 20 Events
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#27272a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#e4e4e7" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="risk"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                    activeDot={{
                      r: 6,
                      fill: "#10b981",
                      stroke: "#18181b",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Recent Anomalies
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {events
                .filter((e) => e.risk_score >= 0.5)
                .slice(0, 5)
                .map((event, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={event.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${event.status === "blocked" ? "bg-red-500" : "bg-amber-500"}`}
                        />
                        <span className="font-medium text-white text-sm">
                          {event.username}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {format(new Date(event.timestamp), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        Risk: {(event.risk_score * 100).toFixed(0)}%
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.ip_address}
                      </div>
                    </div>
                  </motion.div>
                ))}
              {events.filter((e) => e.risk_score >= 0.5).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                  <p className="text-sm">No recent anomalies detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Logs Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Authentication Logs
            </h2>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400">
                Showing last 100 events
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">
                    Biometrics (Type/Mouse)
                  </th>
                  <th className="px-6 py-4 font-medium">Context (IP/Device)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      {format(new Date(event.timestamp), "MMM dd, HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {event.username}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              event.risk_score > 0.8
                                ? "bg-red-500"
                                : event.risk_score > 0.5
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(event.risk_score * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                          {(event.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          event.status === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : event.status === "warning"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {event.status === "success" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {event.status === "warning" && (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {event.status === "blocked" && (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span
                          className="flex items-center gap-1"
                          title="Typing Speed (ms/key)"
                        >
                          <Keyboard className="w-3.5 h-3.5" />
                          {Math.round(event.typing_speed)}ms
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Mouse Speed (px/s)"
                        >
                          <MousePointer2 className="w-3.5 h-3.5" />
                          {Math.round(event.mouse_speed)}px/s
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.ip_address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5" />
                          {event.device_id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendColor = "text-emerald-400",
}: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon, { className: "w-16 h-16" })}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
            {icon}
          </div>
          <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-white tracking-tight">
            {value}
          </span>
          <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
        </div>
      </div>
    </div>
  );
}
