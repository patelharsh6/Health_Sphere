import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
};

// ═══════════════════════════════════════
// DOCTOR ENDPOINTS
// ═══════════════════════════════════════
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  updateProfile: (data) => api.put('/doctors/profile', data),
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
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
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
};

// ═══════════════════════════════════════
// AI ENDPOINTS
// ═══════════════════════════════════════
export const aiAPI = {
  symptomCheck: (symptoms) => api.post('/ai/symptom-check', { symptoms }),
  getAllDiseases: (params) => api.get('/ai/diseases', { params }),
  getDiseaseBySlug: (slug) => api.get(`/ai/diseases/${slug}`),
};

export default api;
