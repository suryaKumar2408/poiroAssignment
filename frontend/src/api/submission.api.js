import api from './axios'

export const createSubmission  = (data)          => api.post('/submissions', data)
export const getSubmissions    = (roundId)        => api.get(`/submissions/${roundId}`)
export const getSubmissionById = (submissionId)   => api.get(`/submissions/single/${submissionId}`)
