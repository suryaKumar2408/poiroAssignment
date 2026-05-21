import api from './axios'

export const createRoom   = (data)       => api.post('/rooms/create', data)
export const joinRoom     = (code)       => api.post('/rooms/join', { code })
export const getRoomByCode= (code)       => api.get(`/rooms/${code}`)
export const getRoomState = (code)       => api.get(`/rooms/${code}/state`)
