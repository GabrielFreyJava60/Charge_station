import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { config } from '@/services/config/env'

const client = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`
  }
  return reqConfig
})

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: { response?: { status: number } }) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client

export interface RegisterData {
  email: string
  password: string
  name: string
  phoneNumber?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken?: string
  idToken?: string
  refreshToken?: string
  userId: string
  email?: string
  role: string
}

export interface StationData {
  name?: string
  location?: string
  [key: string]: unknown
}

export interface SessionStartData {
  stationId: string
  [key: string]: unknown
}

export const authAPI = {
  register: (data: RegisterData): Promise<AxiosResponse> => client.post('/auth/register', data),
  login: (data: LoginData): Promise<AxiosResponse<LoginResponse>> => client.post('/auth/login', data),
  refresh: (refreshToken: string): Promise<AxiosResponse> => client.post('/auth/refresh', { refreshToken }),
}

export const stationsAPI = {
  list: (status?: string): Promise<AxiosResponse> =>
    client.get('/stations', { params: status ? { status } : {} }),
  get: (id: string): Promise<AxiosResponse> => client.get(`/stations/${id}`),
  create: (data: StationData): Promise<AxiosResponse> => client.post('/stations', data),
  updateStatus: (id: string, status: string): Promise<AxiosResponse> =>
    client.patch(`/stations/${id}/status`, { status }),
  updateTariff: (id: string, tariffPerKwh: number): Promise<AxiosResponse> =>
    client.patch(`/stations/${id}/tariff`, { tariffPerKwh }),
}

export const sessionsAPI = {
  start: (data: SessionStartData): Promise<AxiosResponse> => client.post('/sessions/start', data),
  stop: (id: string): Promise<AxiosResponse> => client.post(`/sessions/${id}/stop`),
  getActive: (): Promise<AxiosResponse> => client.get('/sessions/active'),
  getHistory: (): Promise<AxiosResponse> => client.get('/sessions/history'),
  getAll: (status?: string): Promise<AxiosResponse> =>
    client.get('/sessions/all', { params: status ? { status } : {} }),
  get: (id: string): Promise<AxiosResponse> => client.get(`/sessions/${id}`),
}

export const adminAPI = {
  listUsers: (): Promise<AxiosResponse> => client.get('/admin/users'),
  changeRole: (id: string, role: string): Promise<AxiosResponse> =>
    client.patch(`/admin/users/${id}/role`, { role }),
  blockUser: (id: string, blocked: boolean): Promise<AxiosResponse> =>
    client.patch(`/admin/users/${id}/block`, { blocked }),
  deleteUser: (id: string): Promise<AxiosResponse> => client.delete(`/admin/users/${id}`),
  createStation: (data: StationData): Promise<AxiosResponse> => client.post('/admin/stations', data),
  commissionStation: (id: string): Promise<AxiosResponse> =>
    client.patch(`/admin/stations/${id}/commission`),
  updateTariff: (id: string, tariffPerKwh: number): Promise<AxiosResponse> =>
    client.patch(`/admin/stations/${id}/tariff`, { tariffPerKwh }),
}

export interface TechSupportErrorParams {
  stationId?: string
  status?: string
  [key: string]: unknown
}

export const techSupportAPI = {
  getErrors: (params?: TechSupportErrorParams): Promise<AxiosResponse> =>
    client.get('/tech-support/errors', { params }),
  updateErrorStatus: (id: string, status: string, timestamp?: string): Promise<AxiosResponse> =>
    client.patch(`/tech-support/errors/${id}/status`, { status, timestamp }),
  setStationMode: (id: string, status: string): Promise<AxiosResponse> =>
    client.patch(`/tech-support/stations/${id}/mode`, { status }),
  forceStopSession: (id: string): Promise<AxiosResponse> =>
    client.post(`/tech-support/sessions/${id}/force-stop`),
  getStats: (): Promise<AxiosResponse> => client.get('/tech-support/stats'),
}
