import api from './axios'

export const createRoom   = ()           => api.post('/rooms/create')
export const joinRoom     = (code)       => api.post('/rooms/join', { code })
export const getRoomByCode= (code)       => api.get(`/rooms/${code}`)
export const getRoomState = (code)       => api.get(`/rooms/${code}/state`)
