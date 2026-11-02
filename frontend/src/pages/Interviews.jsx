/**
 * pages/Interviews.jsx
 * =====================
 * Manages all interviews: upcoming, completed, cancelled.
 * Supports scheduling, editing, and cancellation.
 */

import { useState, useEffect, useCallback } from 'react';
import { interviewService } from '../services/interviewService';
import { applicationService } from '../services/applicationService';
import { StatusBadge } from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Skeleton } from '../components/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Calendar, Plus, Edit2, Trash2, Video, MapPin, X, Save, Clock } from 'lucide-react';

const TABS = [
  { key: 'scheduled', label: 'Upcoming', status: 'scheduled' },
  { key: 'completed', label: 'Completed', status: 'completed' },
  { key: 'cancelled', label: 'Cancelled', status: 'cancelled' },
];

const INITIAL_FORM = {
  application: '',
  round: '',
  interview_date: '',
  interview_time: '10:00',
  interview_type: 'technical',
  interview_mode: 'online',
  meeting_link: '',
  location: '',
  notes: '',
  status: 'scheduled',
};


/**
 * Field wrapper — defined OUTSIDE InterviewModal so React doesn't
 * recreate it on every render, which would unmount inputs and lose focus.
 */
const Field = ({ label, name, errors, children }) => (
  <div>
    <label htmlFor={name} className="label">{label}</label>
    {children}
    {errors?.[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
  </div>
);

const InterviewModal = ({ interview, applications, onClose, onSave }) => {
  const [form, setForm] = useState(
    interview
      ? {
          application: interview.application,
          round: interview.round || '',
          interview_date: interview.interview_date || '',
          interview_time: interview.interview_time || '10:00',
          interview_type: interview.interview_type || 'technical',
          interview_mode: interview.interview_mode || 'online',
          meeting_link: interview.meeting_link || '',
          location: interview.location || '',
          notes: interview.notes || '',
          status: interview.status || 'scheduled',
        }
      : INITIAL_FORM
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.application) e.application = 'Application is required';
    if (!form.round.trim()) e.round = 'Round name is required';
    if (!form.interview_date) e.interview_date = 'Interview date is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (interview) {
        await interviewService.update(interview.id, form);
        toast.success('Interview updated!');
      } else {
        await interviewService.create(form);
        toast.success('Interview scheduled!');
      }
      onSave();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') setErrors(data);
      toast.error('Failed to save interview');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {interview ? 'Edit Interview' : 'Schedule Interview'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Application *" name="application" errors={errors}>
            <select id="application" name="application" className="input" value={form.application} onChange={handleChange}>
              <option value="">Select an application</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.job_title} — {a.company_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Round / Stage *" name="round" errors={errors}>
            <input
              id="round"
              name="round"
              className="input"
              placeholder="e.g. Technical Round 1, HR Interview"
              value={form.round}
              onChange={handleChange}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Interview Date *" name="interview_date" errors={errors}>
              <input id="interview_date" name="interview_date" type="date" className="input" value={form.interview_date} onChange={handleChange} />
            </Field>
            <Field label="Interview Time" name="interview_time" errors={errors}>
              <input id="interview_time" name="interview_time" type="time" className="input" value={form.interview_time} onChange={handleChange} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Interview Type" name="interview_type" errors={errors}>
              <select id="interview_type" name="interview_type" className="input" value={form.interview_type} onChange={handleChange}>
                <option value="technical">Technical</option>
                <option value="hr">HR</option>
                <option value="managerial">Managerial</option>
                <option value="assessment">Assessment</option>
              </select>
            </Field>
            <Field label="Mode" name="interview_mode" errors={errors}>
              <select id="interview_mode" name="interview_mode" className="input" value={form.interview_mode} onChange={handleChange}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </Field>
          </div>

          {form.interview_mode === 'online' ? (
            <Field label="Meeting Link" name="meeting_link" errors={errors}>
              <input id="meeting_link" name="meeting_link" className="input" placeholder="https://meet.google.com/..." value={form.meeting_link} onChange={handleChange} />
            </Field>
          ) : (
            <Field label="Location / Address" name="location" errors={errors}>
              <input id="location" name="location" className="input" placeholder="Office address..." value={form.location} onChange={handleChange} />
            </Field>
          )}

          {interview && (
            <Field label="Status" name="status" errors={errors}>
              <select id="status" name="status" className="input" value={form.status} onChange={handleChange}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          )}

          <Field label="Notes" name="notes" errors={errors}>
            <textarea id="notes" name="notes" rows={2} className="input resize-none" placeholder="Any notes about this interview..." value={form.notes} onChange={handleChange} />
          </Field>


          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button id="save-interview" type="submit" disabled={loading} className="btn-primary flex-1">
              <Save size={16} />
              {loading ? 'Saving...' : interview ? 'Update' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InterviewCard = ({ interview, onEdit, onDelete }) => (
  <div className="card p-4 flex items-start gap-4">
    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
      <Calendar size={22} className="text-purple-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900">{interview.round}</p>
          <p className="text-gray-500 text-sm">
            {interview.company_name || interview.application_detail?.company_name || 'Company'}
          </p>
        </div>
        <StatusBadge status={interview.status} label={interview.status_display} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={12} />
          {formatDate(interview.interview_date)} {interview.interview_time ? `at ${interview.interview_time}` : ''}
        </span>
        <span className="text-xs text-gray-500 capitalize">
          {interview.interview_type_display || interview.interview_type} · {interview.interview_mode_display || interview.interview_mode}
        </span>
        {interview.meeting_link && (
          <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            <Video size={11} /> Join Meeting
          </a>
        )}
        {interview.location && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={11} /> {interview.location}
          </span>
        )}
      </div>
      {interview.notes && (
        <p className="text-xs text-gray-400 mt-2 italic">{interview.notes}</p>
      )}
    </div>
    <div className="flex gap-1 flex-shrink-0">
      <button
        id={`edit-interview-${interview.id}`}
        onClick={() => onEdit(interview)}
        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit2 size={15} />
      </button>
      <button
        id={`delete-interview-${interview.id}`}
        onClick={() => onDelete(interview.id)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  </div>
);

const Interviews = () => {
  const [activeTab, setActiveTab] = useState('scheduled');
  const [allInterviews, setAllInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [interviewRes, appRes] = await Promise.all([
        interviewService.getAll(),
        applicationService.getAll({ page_size: 100 }),
      ]);
      setAllInterviews(interviewRes.data.results || interviewRes.data || []);
      setApplications(appRes.data.results || []);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = allInterviews.filter((iv) => iv.status === activeTab);

  const handleEdit = (interview) => {
    setEditingInterview(interview);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await interviewService.delete(deleteId);
      toast.success('Interview deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete interview');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">{allInterviews.length} total interview{allInterviews.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          id="add-interview-btn"
          onClick={() => { setEditingInterview(null); setModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={18} />
          Schedule Interview
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => {
          const count = allInterviews.filter((iv) => iv.status === tab.status).length;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interview List */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <Calendar size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No {activeTab} interviews</p>
            {activeTab === 'scheduled' && (
              <button
                onClick={() => { setEditingInterview(null); setModalOpen(true); }}
                className="btn-primary mt-4"
              >
                <Plus size={16} />
                Schedule an Interview
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((iv) => (
            <InterviewCard
              key={iv.id}
              interview={iv}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <InterviewModal
          interview={editingInterview}
          applications={applications}
          onClose={() => { setModalOpen(false); setEditingInterview(null); }}
          onSave={fetchData}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Interview"
        message="Are you sure you want to delete this interview?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
};

export default Interviews;
