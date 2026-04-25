import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skyscript_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (credentials: any) => api.post('/login', credentials),
  signup: (data: any) => api.post('/signup', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getUserById: (id: number) => api.get(`/users/${id}`),
  getUserMetrics: (id: number) => api.get(`/metrics/user/${id}`),
};

export const adminApi = {
  getUsers: () => api.get('/users'),
  updateUserRegistry: (id: number, data: any) => api.patch(`/users/${id}/admin-update`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  changeSecret: (current_secret: string, new_secret: string) => api.put('/admin/change-secret', { current_secret, new_secret }),
  getSystemStatus: () => api.get('/admin/system-status'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  exportAuditLogsCSV: (logs: any[]) => api.post('/admin/audit-logs/export/csv', { logs }, { responseType: 'blob' }),
  exportAuditLogsPDF: (logs: any[]) => api.post('/admin/audit-logs/export/pdf', { logs }, { responseType: 'blob' }),
};

export const aircraftApi = {
  getAll: () => api.get('/aircraft'),
  getPending: () => api.get('/aircraft/pending'),
  getById: (id: number) => api.get(`/aircraft/${id}`),
  create: (data: any) => api.post('/aircraft', data),
  update: (id: number, data: any) => api.put(`/aircraft/${id}`, data),
  approve: (id: number, action: 'approve' | 'reject') => api.post(`/aircraft/${id}/approve`, { action }),
  delete: (id: number) => api.delete(`/aircraft/${id}`),
};

export const logApi = {
  getLogs: () => api.get('/logs'),
  submitLog: (logData: any) => api.post('/logs', logData),
  updateStatus: (id: number, status: string, certNote?: string) => api.post(`/logs/${id}/status`, { status, certification_note: certNote }),
  updateCompliance: (id: number, status: string) => api.post(`/logs/${id}/compliance`, { status }),
  validate: (data: any) => api.post('/validate', data),
};

export const plannerApi = {
  getInsights: (aircraft_id?: string) => api.get(`/planner/insights${aircraft_id ? `?aircraft_id=${aircraft_id}` : ''}`),
};

export const qaApi = {
  validateLog: (data: any) => api.post('/qa/validate', data),
};

export const supervisorApi = {
  getSettings: () => api.get('/supervisor/settings'),
  updateSettings: (settings: any) => api.put('/supervisor/settings', settings),
};

export const notifyApi = {
  getNotifications: () => api.get('/notifications'),
};

export const reportApi = {
  getDailyReport: () => api.get('/daily-report'),
};

export default api;
