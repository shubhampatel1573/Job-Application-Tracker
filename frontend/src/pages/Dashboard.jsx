/**
 * pages/Dashboard.jsx
 * ====================
 * Main dashboard showing stats, charts, and recent activity
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import { applicationService } from '../services/applicationService';
import { interviewService } from '../services/interviewService';
import { formatDate, getStatusColor, daysUntil } from '../utils/helpers';
import { Skeleton } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  Briefcase, Calendar, TrendingUp, Trophy, XCircle, Plus,
  ArrowRight, Clock, AlertCircle
} from 'lucide-react';

// Color scheme for pie chart
const STATUS_COLORS = {
  applied: '#6366f1',
  shortlisted: '#f59e0b',
  interview_scheduled: '#8b5cf6',
  interview_completed: '#3b82f6',
  offer_received: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
};

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className="stat-card">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      {loading ? (
        <>
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, statusRes, monthlyRes, appsRes, interviewsRes] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getStatusStats(),
          analyticsService.getMonthlyStats(),
          applicationService.getAll({ page_size: 5, ordering: '-created_at' }),
          interviewService.getUpcoming(),
        ]);

        setOverview(overviewRes.data);
        // Prepare pie chart data (filter out 0-count statuses)
        setStatusData(
          statusRes.data.status_distribution
            .filter((item) => item.count > 0)
            .map((item) => ({
              name: item.label,
              value: item.count,
              key: item.status,
            }))
        );

        // Merge monthly applications and interviews for bar chart
        const appsByMonth = {};
        monthlyRes.data.monthly_applications.forEach((item) => {
          appsByMonth[item.month] = { month: item.month, applications: item.count, interviews: 0 };
        });
        monthlyRes.data.monthly_interviews.forEach((item) => {
          if (appsByMonth[item.month]) {
            appsByMonth[item.month].interviews = item.count;
          } else {
            appsByMonth[item.month] = { month: item.month, applications: 0, interviews: item.count };
          }
        });
        setMonthlyData(Object.values(appsByMonth).slice(-6));

        setRecentApps(appsRes.data.results || []);
        setUpcomingInterviews((interviewsRes.data || []).slice(0, 5));
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const firstName = user?.first_name || user?.username || 'there';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getTimeGreeting()}, {firstName}! 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your job search overview</p>
        </div>
        <Link to="/applications/add" className="btn-primary">
          <Plus size={18} />
          Add Application
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Briefcase} label="Total Applications" value={overview?.total_applications} color="bg-indigo-500" loading={loading} />
        <StatCard icon={TrendingUp} label="Shortlisted" value={overview?.total_applications ? statusData.find(s => s.key === 'shortlisted')?.value ?? 0 : 0} color="bg-amber-500" loading={loading} />
        <StatCard icon={Calendar} label="Interviews" value={overview?.total_interviews} color="bg-purple-500" loading={loading} />
        <StatCard icon={Trophy} label="Offers" value={overview?.total_offers} color="bg-green-500" loading={loading} />
        <StatCard icon={XCircle} label="Rejected" value={overview?.total_rejections} color="bg-red-500" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Application Status</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : statusData.length === 0 ? (
            <div className="empty-state h-48">
              <Briefcase size={40} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No applications yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Bar Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Activity</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : monthlyData.length === 0 ? (
            <div className="empty-state h-48">
              <BarChart2Icon size={40} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No activity data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={16} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interviews" name="Interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Applications + Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link to="/applications" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : recentApps.length === 0 ? (
              <div className="empty-state py-12">
                <Briefcase size={36} className="text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">No applications yet</p>
                <Link to="/applications/add" className="btn-primary mt-3 text-sm">
                  <Plus size={16} /> Add your first
                </Link>
              </div>
            ) : (
              recentApps.map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">{app.company_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{app.job_title}</p>
                    <p className="text-gray-500 text-xs truncate">{app.company_name}</p>
                  </div>
                  <StatusBadge status={app.status} label={app.status_display} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming Interviews</h2>
            <Link to="/interviews" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-12 w-full" /></div>
              ))
            ) : upcomingInterviews.length === 0 ? (
              <div className="empty-state py-12">
                <Calendar size={36} className="text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">No upcoming interviews</p>
              </div>
            ) : (
              upcomingInterviews.map((interview) => {
                const days = daysUntil(interview.interview_date);
                return (
                  <div key={interview.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{interview.company_name}</p>
                      <p className="text-gray-500 text-xs">{interview.round} · {formatDate(interview.interview_date)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      days <= 1 ? 'bg-red-100 text-red-700' :
                      days <= 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// This BarChart2 icon reference fix
const BarChart2Icon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

export default Dashboard;
