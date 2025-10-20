import { useState, useEffect } from 'react';
import {
  getBusinessMetrics,
  getAssistantStats,
  getPerformanceMetrics,
  getDailyRevenue, // Import the new function
  BusinessMetrics,
  AssistantStats,
  PerformanceMetrics,
} from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/atoms/Button';
import {
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// --- Helper Components (can be moved to separate files) ---

interface MetricCardProps {
  title: string;
  value?: string | number; // Make value optional
  description?: string;
  children?: React.ReactNode;
}

function MetricCard({ title, value, description, children }: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-1">
      <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
      {value && <p className="text-2xl font-bold text-gray-800">{value}</p>}
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      {children}
    </div>
  );
}

interface StatusBadgeProps {
    status: string;
    variant: 'success' | 'warning' | 'error' | 'info';
}

function StatusBadge({ status, variant }: StatusBadgeProps) {
    const variants = {
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {status}
        </span>
    );
}

// --- Chart Colors & Config ---
const PIE_CHART_COLORS = ['#0d9488', '#0891b2', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) return null; // Don't render labels for tiny slices

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// --- Main Dashboard Component ---

export function AdminDashboardPage() {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [assistantStats, setAssistantStats] = useState<AssistantStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<{date: string, revenue: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      // Create a date range for the last 30 days
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      
      const [bizData, assistData, perfData, revData] = await Promise.all([
        getBusinessMetrics(),
        getAssistantStats(),
        getPerformanceMetrics(),
        getDailyRevenue(from.toISOString().split('T')[0], to.toISOString().split('T')[0]),
      ]);
      setBusinessMetrics(bizData);
      setAssistantStats(assistData);
      setPerformanceMetrics(perfData);
      setRevenueData(revData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data. Please check the API connection.");
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

   if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="font-bold text-lg mb-2 text-red-600">Error Loading Dashboard</h2>
            <p>{error}</p>
            <Button onClick={fetchData} variant="danger" className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => num >= 1000 ? `${(num/1000).toFixed(1)}k` : num.toString();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                {lastUpdated && <p className="text-xs text-gray-500">Live | Last updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
        </div>

        {/* --- Business Metrics Section --- */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Business Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Revenue" value={formatCurrency(businessMetrics?.totalRevenue ?? 0)} />
            <MetricCard title="Total Orders" value={formatNumber(businessMetrics?.totalOrders ?? 0)} />
            <MetricCard title="Average Order Value" value={formatCurrency(businessMetrics?.avgOrderValue ?? 0)} />
            <MetricCard title="Orders By Status">
                 <div className="space-y-1 mt-2">
                    {businessMetrics?.ordersByStatus?.map(s => (
                        <div key={s.status} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 capitalize">{s.status.toLowerCase()}</span>
                            <span className="font-bold text-gray-800">{s.count}</span>
                        </div>
                    ))}
                 </div>
            </MetricCard>
          </div>
          <div className="mt-6 bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-md font-semibold text-gray-700 mb-4">Revenue (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis tickFormatter={(value) => `$${formatNumber(value as number)}`} tick={{fontSize: 12}} />
                <Tooltip contentStyle={{backgroundColor: '#fff', border: '1px solid #ccc'}} formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* --- Assistant & Performance Section --- */}
        <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Assistant Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">Assistant Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard title="Total Queries" value={formatNumber(assistantStats?.totalQueries ?? 0)} />
                        <div className="bg-white p-4 rounded-xl shadow-md md:col-span-2">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Intent Distribution</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                <Pie data={assistantStats?.intentDistribution} dataKey="count" nameKey="intent" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomizedLabel}>
                                    {assistantStats?.intentDistribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{fontSize: "12px"}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-xl shadow-md">
                        <h3 className="text-md font-semibold text-gray-700 mb-4">Function Calls Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={assistantStats?.functionCalls} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{fontSize: 12}} />
                            <YAxis type="category" dataKey="functionName" width={100} tick={{fontSize: 12}} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0891b2" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Health */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-700">System Health</h2>
                    <MetricCard title="Avg API Latency" value={`${performanceMetrics?.avgApiLatency ?? 'N/A'} ms`} />
                    <MetricCard title="Active SSE Connections" value={performanceMetrics?.sseConnections ?? 'N/A'} />
                    <MetricCard title="Failed Requests" value={performanceMetrics?.failedRequests ?? 'N/A'} description="In last poll cycle"/>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Service Status</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><span>Database</span> <StatusBadge status={performanceMetrics?.dbConnection === 'ok' ? 'Connected' : 'Error'} variant={performanceMetrics?.dbConnection === 'ok' ? 'success' : 'error'} /></div>
                            <div className="flex justify-between items-center"><span>LLM Service</span> <StatusBadge status={performanceMetrics?.llmService === 'ok' ? 'Online' : 'Offline'} variant={performanceMetrics?.llmService === 'ok' ? 'success' : 'error'} /></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
}

