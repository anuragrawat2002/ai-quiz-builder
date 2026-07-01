import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API Service Functions ────────────────────────────────────────────────────

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const quizService = {
  create: (data) => api.post('/quiz', data),
  getAll: (params) => api.get('/quiz', { params }),
  getById: (id) => api.get(`/quiz/${id}`),
  getByCode: (code) => api.get(`/quiz/code/${code}`),
  update: (id, data) => api.put(`/quiz/${id}`, data),
  publish: (id) => api.put(`/quiz/${id}/publish`),
  delete: (id) => api.delete(`/quiz/${id}`),
  addQuestion: (id, data) => api.post(`/quiz/${id}/questions`, data),
  updateQuestion: (id, qid, data) => api.put(`/quiz/${id}/questions/${qid}`, data),
  deleteQuestion: (id, qid) => api.delete(`/quiz/${id}/questions/${qid}`),
};

export const attemptService = {
  start: (quizId) => api.post('/attempts/start', { quizId }),
  submit: (id, data) => api.post(`/attempts/${id}/submit`, data),
  getMyAttempts: () => api.get('/attempts/my'),
  getLeaderboard: (quizId) => api.get(`/attempts/quiz/${quizId}/leaderboard`),
  getById: (id) => api.get(`/attempts/${id}`),
};

export const aiService = {
  generateQuiz: (data) => api.post('/ai/generate-quiz', data),
  explainAnswer: (data) => api.post('/ai/explain', data),
};

export const analyticsService = {
  getTeacher: () => api.get('/analytics/teacher'),
  getStudent: () => api.get('/analytics/student'),
};
