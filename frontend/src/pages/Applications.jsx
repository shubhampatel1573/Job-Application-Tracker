/**
 * pages/Applications.jsx
 * =======================
 * Displays all job applications in a professional table.
 * Supports search, filter by status/job type, sort, and pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { StatusBadge } from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Skeleton } from '../components/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, Briefcase, SlidersHorizontal,
  MapPin, Calendar, Building2
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Completed' },
  { value: 'offer_received', label: 'Offer Received' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'remote', label: 'Remote' },
  { value: 'on_site', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EMPLOYMENT_OPTIONS = [
  { value: '', label: 'All Employment' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
];

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    job_type: '',
    employment_type: '',
    ordering: '-application_date',
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
        ...filters,
      };
      // Remove empty filters to keep the URL clean
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);

      const res = await applicationService.getAll(params);
      setApplications(res.data.results || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handleDelete = async () => {
    try {
      await applicationService.delete(deleteId);
      toast.success('Application deleted');
      setDeleteId(null);
      fetchApplications();
    } catch {
      toast.error('Failed to delete application');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalCount} total application{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/applications/add" className="btn-primary">
          <Plus size={18} />
          Add Application
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="search-applications"
              type="text"
              placeholder="Search by company or job title..."
              className="input pl-9"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* Sort */}
          <select
            id="sort-applications"
            className="input w-auto min-w-[180px]"
            value={filters.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
          >
            <option value="-application_date">Newest First</option>
            <option value="application_date">Oldest First</option>
            <option value="company_name">Company A-Z</option>
            <option value="-company_name">Company Z-A</option>
            <option value="deadline">Deadline Soonest</option>
          </select>

          {/* Filter Toggle */}
          <button
            id="toggle-filters"
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            Filters
            {(filters.status || filters.job_type || filters.employment_type) && (
              <span className="ml-1 w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                id="filter-status"
                className="input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Job Type</label>
              <select
                id="filter-job-type"
                className="input"
                value={filters.job_type}
                onChange={(e) => handleFilterChange('job_type', e.target.value)}
              >
                {JOB_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Employment</label>
              <select
                id="filter-employment"
                className="input"
                value={filters.employment_type}
                onChange={(e) => handleFilterChange('employment_type', e.target.value)}
              >
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state py-20">
            <Briefcase size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No applications found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filters.search || filters.status ? 'Try adjusting your filters' : 'Add your first job application'}
            </p>
            {!filters.search && !filters.status && (
              <Link to="/applications/add" className="btn-primary mt-4">
                <Plus size={16} />
                Add Application
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Job Title</th>
                    <th>Location</th>
                    <th>Date Applied</th>
                    <th>Employment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-bold text-xs">
                              {app.company_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{app.company_name}</span>
                        </div>
                      </td>
                      <td className="font-medium text-gray-700">{app.job_title}</td>
                      <td className="text-gray-500">{app.location || '—'}</td>
                      <td className="text-gray-500">{formatDate(app.application_date)}</td>
                      <td className="text-gray-500 capitalize">{app.employment_type_display || app.employment_type}</td>
                      <td>
                        <StatusBadge status={app.status} label={app.status_display} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            id={`view-app-${app.id}`}
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            id={`edit-app-${app.id}`}
                            onClick={() => navigate(`/applications/${app.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            id={`delete-app-${app.id}`}
                            onClick={() => setDeleteId(app.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {applications.map((app) => (
                <div key={app.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">
                          {app.company_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{app.job_title}</p>
                        <p className="text-gray-500 text-sm truncate">{app.company_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {app.location && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} />{app.location}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />{formatDate(app.application_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} label={app.status_display} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => navigate(`/applications/${app.id}`)}
                      className="btn-secondary text-xs py-1 px-3 flex-1">
                      <Eye size={13} /> View
                    </button>
                    <button onClick={() => navigate(`/applications/${app.id}/edit`)}
                      className="btn-secondary text-xs py-1 px-3 flex-1">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => setDeleteId(app.id)}
                      className="btn-danger text-xs py-1 px-3 flex-1">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="prev-page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="btn-secondary py-1.5 px-3 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  id={`page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              id="next-page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="btn-secondary py-1.5 px-3 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
};

export default Applications;
