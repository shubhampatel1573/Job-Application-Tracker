/**
 * pages/AddApplication.jsx
 * =========================
 * Form to create a new job application.
 * All fields from the JobApplication model are included.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import toast from 'react-hot-toast';
import { ArrowLeft, Briefcase, Save } from 'lucide-react';

const INITIAL_FORM = {
  job_title: '',
  company_name: '',
  company_website: '',
  description: '',
  location: '',
  job_type: 'remote',
  employment_type: 'full_time',
  salary_range: '',
  application_date: new Date().toISOString().split('T')[0],
  deadline: '',
  status: 'applied',
  job_url: '',
  notes: '',
};

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
    {errors?.[name] && (
      <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
    )}
  </div>
);

const AddApplication = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
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
      // Clean empty optional fields (send null instead of empty string)
      const payload = { ...form };
      ['company_website', 'job_url', 'salary_range', 'deadline', 'description', 'notes', 'location'].forEach((key) => {
        if (!payload[key]) payload[key] = '';
      });

      await applicationService.create(payload);
      toast.success('Application added successfully!');
      navigate('/applications');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErrors(data);
        toast.error('Please fix the errors below');
      } else {
        toast.error('Failed to create application');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/applications" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Add Application</h1>
          <p className="text-gray-500 text-sm">Track a new job application</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Job Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Title" name="job_title" required errors={errors}>
              <input
                id="job_title"
                name="job_title"
                className="input"
                placeholder="e.g. Software Engineer"
                value={form.job_title}
                onChange={handleChange}
              />
            </Field>
            <Field label="Company Name" name="company_name" required errors={errors}>
              <input
                id="company_name"
                name="company_name"
                className="input"
                placeholder="e.g. Google"
                value={form.company_name}
                onChange={handleChange}
              />
            </Field>
            <Field label="Company Website" name="company_website" errors={errors}>
              <input
                id="company_website"
                name="company_website"
                className="input"
                placeholder="https://company.com"
                value={form.company_website}
                onChange={handleChange}
              />
            </Field>
            <Field label="Job Posting URL" name="job_url" errors={errors}>
              <input
                id="job_url"
                name="job_url"
                className="input"
                placeholder="https://jobs.company.com/role"
                value={form.job_url}
                onChange={handleChange}
              />
            </Field>
            <Field label="Location" name="location" errors={errors}>
              <input
                id="location"
                name="location"
                className="input"
                placeholder="e.g. New York, NY"
                value={form.location}
                onChange={handleChange}
              />
            </Field>
            <Field label="Salary Range" name="salary_range" errors={errors}>
              <input
                id="salary_range"
                name="salary_range"
                className="input"
                placeholder="e.g. $80,000 - $100,000"
                value={form.salary_range}
                onChange={handleChange}
              />
            </Field>
          </div>
          <Field label="Job Description" name="description" errors={errors}>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input resize-none"
              placeholder="Paste the job description here..."
              value={form.description}
              onChange={handleChange}
            />
          </Field>
        </div>

        {/* Application Details */}
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
              <input
                id="application_date"
                name="application_date"
                type="date"
                className="input"
                value={form.application_date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Application Deadline" name="deadline" errors={errors}>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="input"
                value={form.deadline}
                onChange={handleChange}
              />
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
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input resize-none"
              placeholder="Any additional notes about this application..."
              value={form.notes}
              onChange={handleChange}
            />
          </Field>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end">
          <Link to="/applications" className="btn-secondary">
            Cancel
          </Link>
          <button
            id="submit-application"
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddApplication;
