/**
 * services/interviewService.js - Interview API calls
 */

import api from './api';

export const interviewService = {
  getAll: (params = {}) => api.get('/interviews/', { params }),
  getById: (id) => api.get(`/interviews/${id}/`),
  create: (data) => api.post('/interviews/', data),
  update: (id, data) => api.put(`/interviews/${id}/`, data),
  patch: (id, data) => api.patch(`/interviews/${id}/`, data),
  delete: (id) => api.delete(`/interviews/${id}/`),
  getUpcoming: () => api.get('/interviews/upcoming/'),
  getPast: () => api.get('/interviews/past/'),
};
