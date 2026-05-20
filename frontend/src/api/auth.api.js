import api from './axios'

export const register = (data) => api.post('/auth/register', data)
export const login    = (data) => api.post('/auth/login', data)
export const logout   = ()     => api.get('/auth/logout')
export const getMe    = ()     => api.get('/auth/get-me')
