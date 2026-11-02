/**
 * pages/Analytics.jsx
 * ====================
 * Analytics dashboard with charts and statistics from real backend data.
 * Uses Recharts for visualization and the analytics API endpoints.
 */

import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { Skeleton } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import {
  BarChart2, Briefcase, Calendar, Trophy, XCircle,
  TrendingUp, Target, Clock
} from 'lucide-react';

const STATUS_COLORS = {
  applied: '#6366f1',
  shortlisted: '#f59e0b',
  interview_scheduled: '#8b5cf6',
  interview_completed: '#3b82f6',
  offer_received: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
};

const StatCard = ({ icon: Icon, label, value, subtitle, color, loading }) => (
  <div className="stat-card">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-14 mb-1" />
          <Skeleton className="h-4 w-20" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </>
      )}
    </div>
  </div>
);

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [statusDist, setStatusDist] = useState([]);
  const [monthlyApps, setMonthlyApps] = useState([]);
  const [monthlyInterviews, setMonthlyInterviews] = useState([]);
  const [combinedMonthly, setCombinedMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overviewRes, statusRes, monthlyRes] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getStatusStats(),
          analyticsService.getMonthlyStats(),
        ]);

        setOverview(overviewRes.data);

        setStatusDist(
          (statusRes.data.status_distribution || []).map((item) => ({
            name: item.label,
            value: item.count,
            key: item.status,
          }))
        );

        // Build combined monthly data for bar chart
        const monthMap = {};
        (monthlyRes.data.monthly_applications || []).forEach((item) => {
          monthMap[item.month] = {
            month: item.month,
            Applications: item.count,
            Interviews: 0,
          };
        });
        (monthlyRes.data.monthly_interviews || []).forEach((item) => {
          if (monthMap[item.month]) {
            monthMap[item.month].Interviews = item.count;
          } else {
            monthMap[item.month] = { month: item.month, Applications: 0, Interviews: item.count };
          }
        });
        setCombinedMonthly(Object.values(monthMap).slice(-12));

      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Success rate calculation
  const successRate = overview?.total_applications
    ? Math.round(((overview.total_offers || 0) / overview.total_applications) * 100)
    : 0;

  const interviewRate = overview?.total_applications
    ? Math.round(((overview.total_interviews || 0) / overview.total_applications) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your job search insights and trends</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Applications" value={overview?.total_applications} color="bg-indigo-500" loading={loading} />
        <StatCard icon={Calendar} label="Interviews" value={overview?.total_interviews} color="bg-purple-500" loading={loading} />
        <StatCard icon={Trophy} label="Offers" value={overview?.total_offers} color="bg-green-500" loading={loading} />
        <StatCard icon={XCircle} label="Rejected" value={overview?.total_rejections} color="bg-red-500" loading={loading} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Target size={22} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            <p className="text-sm text-gray-500">Offer Rate</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp size={22} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{interviewRate}%</p>
            <p className="text-sm text-gray-500">Interview Rate</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <Clock size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {overview?.upcoming_interviews ?? 0}
            </p>
            <p className="text-sm text-gray-500">Upcoming Interviews</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution — Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Application Status Distribution</h2>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : statusDist.filter((d) => d.value > 0).length === 0 ? (
            <div className="empty-state h-64">
              <Briefcase size={40} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusDist.filter((d) => d.value > 0)}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDist.filter((d) => d.value > 0).map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Table */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          {loading ? (
            <div className="space-y-3">
              {Array(7).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {statusDist.map((item) => {
                const pct = overview?.total_applications
                  ? Math.round((item.value / overview.total_applications) * 100)
                  : 0;
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[item.key] || '#94a3b8' }} />
                    <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[item.key] || '#94a3b8' }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Activity Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Activity</h2>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : combinedMonthly.length === 0 ? (
          <div className="empty-state h-64">
            <BarChart2 size={40} className="text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No activity data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={combinedMonthly} barGap={4} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Application Trend Line Chart */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Application Trend</h2>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : combinedMonthly.length === 0 ? (
          <div className="empty-state h-48">
            <TrendingUp size={40} className="text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">No trend data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={combinedMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Line
                type="monotone" dataKey="Applications" stroke="#6366f1"
                strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }}
              />
              <Line
                type="monotone" dataKey="Interviews" stroke="#8b5cf6"
                strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Analytics;
