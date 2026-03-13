import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const api = axios.create({ 
  baseURL: BASE, 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export function setToken(token){
  if(token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

export async function get(path, params){
  try {
    const res = await api.get(path, { params })
    return res.data
  } catch (error) {
    console.error('GET Error:', error)
    throw error
  }
}

export async function post(path, body){
  try {
    const res = await api.post(path, body)
    return res.data
  } catch (error) {
    console.error('POST Error:', error)
    throw error
  }
}

export async function put(path, body){
  try {
    const res = await api.put(path, body)
    return res.data
  } catch (error) {
    console.error('PUT Error:', error)
    throw error
  }
}

export async function del(path){
  try {
    const res = await api.delete(path)
    return res.data
  } catch (error) {
    console.error('DELETE Error:', error)
    throw error
  }
}

export default api
