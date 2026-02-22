import axios from 'axios';
import { API_BASE } from '../utils/constants';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  refresh: (refreshToken) => client.post('/auth/refresh', { refreshToken }),
};

export const stationsAPI = {
  list: (status) => client.get('/stations', { params: status ? { status } : {} }),
  get: (id) => client.get(`/stations/${id}`),
  create: (data) => client.post('/stations', data),
  updateStatus: (id, status) => client.patch(`/stations/${id}/status`, { status }),
  updateTariff: (id, tariffPerKwh) => client.patch(`/stations/${id}/tariff`, { tariffPerKwh }),
};

export const sessionsAPI = {
  start: (data) => client.post('/sessions/start', data),
  stop: (id) => client.post(`/sessions/${id}/stop`),
  getActive: () => client.get('/sessions/active'),
  getHistory: () => client.get('/sessions/history'),
  getAll: (status) => client.get('/sessions/all', { params: status ? { status } : {} }),
  get: (id) => client.get(`/sessions/${id}`),
};

export const adminAPI = {
  listUsers: () => client.get('/admin/users'),
  changeRole: (id, role) => client.patch(`/admin/users/${id}/role`, { role }),
  blockUser: (id, blocked) => client.patch(`/admin/users/${id}/block`, { blocked }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  createStation: (data) => client.post('/admin/stations', data),
  commissionStation: (id) => client.patch(`/admin/stations/${id}/commission`),
  updateTariff: (id, tariffPerKwh) => client.patch(`/admin/stations/${id}/tariff`, { tariffPerKwh }),
};

export const techSupportAPI = {
  getErrors: (params) => client.get('/tech-support/errors', { params }),
  updateErrorStatus: (id, status, timestamp) => client.patch(`/tech-support/errors/${id}/status`, { status, timestamp }),
  setStationMode: (id, status) => client.patch(`/tech-support/stations/${id}/mode`, { status }),
  forceStopSession: (id) => client.post(`/tech-support/sessions/${id}/force-stop`),
  getStats: () => client.get('/tech-support/stats'),
};
