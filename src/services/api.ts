import axios from 'axios';
import { toast } from 'sonner';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code out of 2xx
      const status = error.response.status;
      const data = error.response.data;
      const message = data.error || data.message || 'An unexpected error occurred';

      if (status === 401) {
        // Unauthorized - handle session expiration if needed
        // Avoid toast loop if already on login
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session Expired', { description: 'Please login again to continue.' });
          localStorage.removeItem('skyscript_token');
          // Redirect can be handled here or in AuthProvider
          // window.location.href = '/login';
        }
      } else if (status === 403) {
        toast.error('Access Denied', { description: message });
      } else if (status >= 400 && status < 500) {
        toast.error('Validation Error', { description: message });
      } else {
        toast.error('Server Error', { description: 'The server encountered an issue. Please try again later.' });
      }
    } else if (error.request) {
      // Request was made but no response was received
      toast.error('Network Error', { description: 'Could not connect to the server. Please check your internet connection.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('Request Error', { description: error.message });
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: any) => api.post('/login', credentials),
  guestLogin: () => api.post('/guest-login'),
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
