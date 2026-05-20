import api from './axios'

export const startRound      = (roomCode) => api.post('/rounds/start', { roomCode })
export const endRound        = (roundId)  => api.post('/rounds/end', { roundId })
export const getRoundsByRoom = (roomCode) => api.get(`/rounds/${roomCode}`)
