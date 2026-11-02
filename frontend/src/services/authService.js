/**
 * services/authService.js - Authentication API calls
 */

import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};
