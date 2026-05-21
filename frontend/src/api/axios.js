import axios from 'axios'

const defaultBaseURL = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api'
    : 'https://poiroassignment-3m71.onrender.com/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseURL,
  withCredentials: true, // sends JWT cookie automatically
  headers: { 'Content-Type': 'application/json' },
})

// Global error interceptor — re-throw so callers can handle
api.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err)
  }
)

export default api
