/**
 * pages/ApplicationDetail.jsx
 * ============================
 * Displays full details of a single job application with related interviews.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { interviewService } from '../services/interviewService';
import { StatusBadge } from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Edit2, Trash2, Briefcase, MapPin, Calendar,
  Globe, Link2, DollarSign, FileText, StickyNote, Clock,
  Plus, Video, Phone, Users
} from 'lucide-react';

const DetailRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-gray-800 text-sm mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [appRes, interviewRes] = await Promise.all([
          applicationService.getById(id),
          interviewService.getAll({ application: id }),
        ]);
        setApp(appRes.data);
        setInterviews(interviewRes.data.results || interviewRes.data || []);
      } catch {
        toast.error('Application not found');
        navigate('/applications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await applicationService.delete(id);
      toast.success('Application deleted');
      navigate('/applications');
    } catch {
      toast.error('Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/applications')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{app.job_title}</h1>
              <StatusBadge status={app.status} label={app.status_display} />
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{app.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/applications/${id}/edit`}
            id="edit-application-btn"
            className="btn-secondary"
          >
            <Edit2 size={16} />
            Edit
          </Link>
          <button
            id="delete-application-btn"
            onClick={() => setShowDeleteDialog(true)}
            className="btn-danger"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company + Job Info */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" />
              Job Details
            </h2>
            <DetailRow icon={Briefcase} label="Company" value={app.company_name} />
            <DetailRow icon={MapPin} label="Location" value={app.location} />
            <DetailRow icon={Globe} label="Company Website" value={app.company_website} />
            <DetailRow icon={Link2} label="Job URL" value={app.job_url} />
            <DetailRow icon={DollarSign} label="Salary Range" value={app.salary_range} />
            {app.company_website && (
              <div className="mt-3">
                <a href={app.company_website} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
                  <Globe size={14} /> Visit Company Site
                </a>
              </div>
            )}
            {app.job_url && (
              <div className="mt-1">
                <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
                  <Link2 size={14} /> View Job Posting
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {app.description && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Job Description
              </h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{app.description}</p>
            </div>
          )}

          {/* Notes */}
          {app.notes && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <StickyNote size={18} className="text-indigo-600" />
                Notes
              </h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{app.notes}</p>
            </div>
          )}

          {/* Interviews */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Interviews ({interviews.length})
              </h2>
              <Link to="/interviews" className="btn-primary text-sm py-1.5 px-3">
                <Plus size={14} />
                Schedule
              </Link>
            </div>
            {interviews.length === 0 ? (
              <div className="empty-state py-10">
                <Calendar size={36} className="text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">No interviews scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {interviews.map((iv) => (
                  <div key={iv.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{iv.round}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {formatDate(iv.interview_date)} · {iv.interview_type_display || iv.interview_type} · {iv.interview_mode_display || iv.interview_mode}
                      </p>
                      {iv.meeting_link && (
                        <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer"
                          className="text-indigo-600 text-xs hover:underline mt-0.5 inline-flex items-center gap-1">
                          <Video size={11} /> Join Meeting
                        </a>
                      )}
                    </div>
                    <StatusBadge status={iv.status} label={iv.status_display} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Application Stats */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Application Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Employment Type</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">
                  {app.employment_type_display || app.employment_type?.replace('_', '-')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Job Type</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5 capitalize">
                  {app.job_type_display || app.job_type?.replace('_', '-')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Date Applied</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(app.application_date)}</p>
              </div>
              {app.deadline && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Deadline</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(app.deadline)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Last Updated</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(app.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Quick Status Update */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <select
              id="quick-status-update"
              className="input"
              value={app.status}
              onChange={async (e) => {
                try {
                  const res = await applicationService.patch(id, { status: e.target.value });
                  setApp(res.data);
                  toast.success('Status updated!');
                } catch {
                  toast.error('Failed to update status');
                }
              }}
            >
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="offer_received">Offer Received</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Application"
        message={`Are you sure you want to delete the application for "${app.job_title}" at ${app.company_name}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        danger
      />
    </div>
  );
};

export default ApplicationDetail;
