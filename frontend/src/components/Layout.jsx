import React from 'react'
import Navbar from './Navbar'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={handleLogout} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
