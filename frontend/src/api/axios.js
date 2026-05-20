import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
