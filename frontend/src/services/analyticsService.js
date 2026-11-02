/**
 * services/analyticsService.js - Analytics API calls
 */

import api from './api';

export const analyticsService = {
  getOverview: () => api.get('/analytics/overview/'),
  getStatusStats: () => api.get('/analytics/status/'),
  getMonthlyStats: () => api.get('/analytics/monthly/'),
};
