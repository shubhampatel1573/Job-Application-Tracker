/**
 * pages/EditApplication.jsx
 * ==========================
 * Loads an existing application and pre-fills the form for editing.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Field wrapper — defined OUTSIDE the page component so React doesn't
 * treat it as a new component type on every render (which would cause
 * inputs to unmount/remount and lose focus after each keystroke).
 */
const Field = ({ label, name, required, errors, children }) => (
  <div>
    <label htmlFor={name} className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {errors?.[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
  </div>
);

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await applicationService.getById(id);
        const data = res.data;
        setForm({
          job_title: data.job_title || '',
          company_name: data.company_name || '',
          company_website: data.company_website || '',
          description: data.description || '',
          location: data.location || '',
          job_type: data.job_type || 'remote',
          employment_type: data.employment_type || 'full_time',
          salary_range: data.salary_range || '',
          application_date: data.application_date || '',
          deadline: data.deadline || '',
          status: data.status || 'applied',
          job_url: data.job_url || '',
          notes: data.notes || '',
        });
      } catch {
        toast.error('Application not found');
        navigate('/applications');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.job_title.trim()) newErrors.job_title = 'Job title is required';
    if (!form.company_name.trim()) newErrors.company_name = 'Company name is required';
    if (!form.application_date) newErrors.application_date = 'Application date is required';
    if (form.company_website && !/^https?:\/\//i.test(form.company_website)) {
      newErrors.company_website = 'Must start with http:// or https://';
    }
    if (form.job_url && !/^https?:\/\//i.test(form.job_url)) {
      newErrors.job_url = 'Must start with http:// or https://';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      await applicationService.update(id, form);
      toast.success('Application updated!');
      navigate(`/applications/${id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
        toast.error('Please fix the errors below');
      } else {
        toast.error('Failed to update application');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/applications/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Edit Application</h1>
          <p className="text-gray-500 text-sm">Update your application details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Title" name="job_title" required errors={errors}>
              <input id="job_title" name="job_title" className="input" value={form.job_title} onChange={handleChange} />
            </Field>
            <Field label="Company Name" name="company_name" required errors={errors}>
              <input id="company_name" name="company_name" className="input" value={form.company_name} onChange={handleChange} />
            </Field>
            <Field label="Company Website" name="company_website" errors={errors}>
              <input id="company_website" name="company_website" className="input" value={form.company_website} onChange={handleChange} />
            </Field>
            <Field label="Job Posting URL" name="job_url" errors={errors}>
              <input id="job_url" name="job_url" className="input" value={form.job_url} onChange={handleChange} />
            </Field>
            <Field label="Location" name="location" errors={errors}>
              <input id="location" name="location" className="input" value={form.location} onChange={handleChange} />
            </Field>
            <Field label="Salary Range" name="salary_range" errors={errors}>
              <input id="salary_range" name="salary_range" className="input" value={form.salary_range} onChange={handleChange} />
            </Field>
          </div>
          <Field label="Job Description" name="description" errors={errors}>
            <textarea id="description" name="description" rows={3} className="input resize-none" value={form.description} onChange={handleChange} />
          </Field>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Application Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Type" name="job_type" required errors={errors}>
              <select id="job_type" name="job_type" className="input" value={form.job_type} onChange={handleChange}>
                <option value="remote">Remote</option>
                <option value="on_site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Employment Type" name="employment_type" required errors={errors}>
              <select id="employment_type" name="employment_type" className="input" value={form.employment_type} onChange={handleChange}>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </Field>
            <Field label="Application Date" name="application_date" required errors={errors}>
              <input id="application_date" name="application_date" type="date" className="input" value={form.application_date} onChange={handleChange} />
            </Field>
            <Field label="Application Deadline" name="deadline" errors={errors}>
              <input id="deadline" name="deadline" type="date" className="input" value={form.deadline} onChange={handleChange} />
            </Field>
            <Field label="Status" name="status" required errors={errors}>
              <select id="status" name="status" className="input" value={form.status} onChange={handleChange}>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="offer_received">Offer Received</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </Field>
          </div>
          <Field label="Notes" name="notes" errors={errors}>
            <textarea id="notes" name="notes" rows={3} className="input resize-none" value={form.notes} onChange={handleChange} />
          </Field>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link to={`/applications/${id}`} className="btn-secondary">Cancel</Link>
          <button id="save-edit" type="submit" disabled={loading} className="btn-primary">
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditApplication;
