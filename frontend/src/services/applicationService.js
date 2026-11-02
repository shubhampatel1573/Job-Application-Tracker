/**
 * services/applicationService.js - Job Application API calls
 */

import api from './api';

export const applicationService = {
  // Get all applications with optional filters/search
  getAll: (params = {}) => api.get('/applications/', { params }),

  // Get a single application by ID
  getById: (id) => api.get(`/applications/${id}/`),

  // Create a new application
  create: (data) => api.post('/applications/', data),

  // Full update (replace all fields)
  update: (id, data) => api.put(`/applications/${id}/`, data),

  // Partial update (update specific fields)
  patch: (id, data) => api.patch(`/applications/${id}/`, data),

  // Delete an application
  delete: (id) => api.delete(`/applications/${id}/`),

  // Get status counts for dashboard
  getStatusCounts: () => api.get('/applications/status-counts/'),
};
