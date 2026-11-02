/**
 * utils/helpers.js - Utility functions
 */

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a datetime string (ISO 8601) to a readable local format
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get the CSS color class for a given application status
 */
export const getStatusColor = (status) => {
  const colors = {
    applied: 'bg-blue-100 text-blue-800 border-blue-200',
    shortlisted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
    interview_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    offer_received: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getInterviewStatusColor = (status) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get error message from axios error response
 */
export const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    // DRF returns errors in different formats
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors[0];
    // Get first field error
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const msg = data[firstKey];
      return Array.isArray(msg) ? `${firstKey}: ${msg[0]}` : `${firstKey}: ${msg}`;
    }
  }
  return error.message || 'An unexpected error occurred';
};

/**
 * Truncate text to a specified length
 */
export const truncate = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Calculate days until a deadline
 */
export const daysUntil = (dateString) => {
  if (!dateString) return null;
  const deadline = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  return diff;
};
