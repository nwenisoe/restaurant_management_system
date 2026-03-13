import React, { createContext, useContext, useState, useEffect } from 'react'
import { setToken as apiSetToken } from '../api/client'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      // Basic token validation - check if it's a JWT format
      try {
        const parts = storedToken.split('.')
        if (parts.length === 3) {
          // Token looks like a JWT, set it
          setToken(storedToken)
          apiSetToken(storedToken)
          setIsAuthenticated(true)
        } else {
          // Invalid token format, clear it
          localStorage.removeItem('token')
          setToken(null)
          apiSetToken(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        // Invalid token, clear it
        localStorage.removeItem('token')
        setToken(null)
        apiSetToken(null)
        setIsAuthenticated(false)
      }
    } else {
      setToken(null)
      apiSetToken(null)
      setIsAuthenticated(false)
    }
  }, [])

  const login = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    apiSetToken(newToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    apiSetToken(null)
    setIsAuthenticated(false)
  }

  const value = {
    token,
    isAuthenticated,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
