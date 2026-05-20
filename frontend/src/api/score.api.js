import api from './axios'

export const submitScore        = (data)     => api.post('/scores', data)
export const getLeaderboard     = (roomCode) => api.get(`/scores/${roomCode}`)
export const getRoundLeaderboard= (roundId)  => api.get(`/scores/round/${roundId}`)
