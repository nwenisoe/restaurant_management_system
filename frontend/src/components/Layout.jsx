import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Layout({ children }) {
  const { logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen')
    if (savedState !== null) {
      setIsSidebarOpen(JSON.parse(savedState))
    }
  }, [])

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen))
  }, [isSidebarOpen])

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
      }`}>
        {/* Desktop Toggle Button - Only show when sidebar is visible */}
        {isSidebarOpen && (
          <div className="hidden lg:flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Hide Sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold text-gray-900">Restaurant Manager</span>
          </div>
        )}

        {/* Show Sidebar Button - Only show when sidebar is hidden */}
        {!isSidebarOpen && (
          <div className="hidden lg:flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Show Sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold text-gray-900">Restaurant Manager</span>
          </div>
        )}

        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Menu 
                className="h-6 w-6 text-gray-600 mr-3" 
                onClick={toggleSidebar}
              />
              <span className="text-lg font-semibold text-gray-900">Restaurant Manager</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
