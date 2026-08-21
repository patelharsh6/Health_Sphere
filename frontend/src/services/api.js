import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Static files (avatars) are served from the server root, not under /api.
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Turns a server-relative upload path ("/uploads/avatars/x.png") into an
 * absolute URL. Passes absolute URLs and empty values through untouched.
 */
export const assetUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//.test(filePath)) return filePath;
  return `${ASSET_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hs_token');
      localStorage.removeItem('hs_user');
      // Only redirect if not already on login/signup
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  // The token is passed explicitly: logout clears local storage first, so the
  // request interceptor would otherwise find nothing to attach and the call
  // would come back 401 and trip the redirect interceptor.
  logout: (token) =>
    api.post('/auth/logout', null, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  // Returns a fresh token — the previous one is invalidated server-side.
  changePassword: (data) => api.put('/auth/password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  uploadAvatar: (formData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ═══════════════════════════════════════
// DOCTOR ENDPOINTS
// ═══════════════════════════════════════
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  updateProfile: (data) => api.put('/doctors/profile', data),
  getDashboard: () => api.get('/doctors/dashboard'),
  getSchedule: () => api.get('/doctors/schedule'),
  saveSchedule: (data) => api.put('/doctors/schedule', data),
  getUpcoming: () => api.get('/doctors/appointments/upcoming'),
  getPatients: (params) => api.get('/doctors/patients', { params }),
  getPatientById: (patientId) => api.get(`/doctors/patients/${patientId}`),
  updatePatientStatus: (patientId, data) => api.put(`/doctors/patients/${patientId}/status`, data),
};

// ═══════════════════════════════════════
// PATIENT ENDPOINTS
// ═══════════════════════════════════════
export const patientAPI = {
  getProfile: () => api.get('/patients/profile'),
  updateProfile: (data) => api.put('/patients/profile', data),
  getDashboard: () => api.get('/patients/dashboard'),
};

// ═══════════════════════════════════════
// APPOINTMENT ENDPOINTS
// ═══════════════════════════════════════
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getMyAppointments: (params) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  confirm: (id) => api.put(`/appointments/${id}/confirm`),
  complete: (id, data) => api.put(`/appointments/${id}/complete`, data),
  getReceipt: (id) => api.get(`/appointments/${id}/receipt`),
};

// ═══════════════════════════════════════
// REPORT ENDPOINTS
// ═══════════════════════════════════════
export const reportAPI = {
  upload: (formData) =>
    api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMyReports: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
  reanalyze: (id) => api.post(`/reports/${id}/reanalyze`),
  getTrends: (id) => api.get(`/reports/${id}/trends`),
  getFileUrl: (id) => `${API_BASE_URL}/reports/${id}/file`,
};

// ═══════════════════════════════════════
// AI ENDPOINTS
// ═══════════════════════════════════════
export const aiAPI = {
  symptomCheck: (symptoms) => api.post('/ai/symptom-check', { symptoms }),
  getAllDiseases: (params) => api.get('/ai/diseases', { params }),
  getDiseaseCategories: () => api.get('/ai/diseases/categories'),
  getDiseaseBySlug: (slug) => api.get(`/ai/diseases/${slug}`),
  getDiseaseDoctors: (slug) => api.get(`/ai/diseases/${slug}/doctors`),
};

// ═══════════════════════════════════════
// MEDICINE ENDPOINTS
// ═══════════════════════════════════════
export const medicineAPI = {
  getAll: (params) => api.get('/medicines', { params }),
  getBySlug: (slug) => api.get(`/medicines/${slug}`),
  getCategories: () => api.get('/medicines/categories'),
};

export default api;
