import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Menu, 
  X, 
  Utensils, 
  ShoppingCart, 
  Table, 
  Receipt, 
  LogOut, 
  User, 
  Home,
  Moon,
  Sun
} from 'lucide-react'

export default function Sidebar({ onLogout, isOpen, onToggle }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Menu', href: '/menus', icon: Utensils },
    { name: 'Foods', href: '/foods', icon: ShoppingCart },
    { name: 'Tables', href: '/tables', icon: Table },
    { name: 'Orders', href: '/menu-with-foods', icon: ShoppingCart },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 ${isDarkMode ? 'bg-gray-900' : 'bg-emerald-600'} text-white transform transition-transform duration-300 ease-in-out
        lg:fixed lg:translate-x-0 lg:inset-0 lg:z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-emerald-700'}`}>
            <div className="flex items-center">
              <Utensils className="h-8 w-8 text-white" />
              <span className={`ml-2 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-emerald-200'}`}>Restaurant Manager</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-md transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-700'
                }`}
                title="Toggle Dark Mode"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-md text-amber-200 hover:text-white hover:bg-amber-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => isOpen && onToggle()}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? `${isDarkMode ? 'bg-gray-800' : 'bg-emerald-700'} text-white` 
                      : `${isDarkMode ? 'text-gray-300' : 'text-emerald-200'} hover:${isDarkMode ? 'bg-gray-800' : 'bg-emerald-700'} hover:text-white`
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-emerald-700'}`}>
            <button
              onClick={() => {
                onLogout()
                isOpen && onToggle()
              }}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                  : 'text-emerald-200 hover:bg-emerald-700 hover:text-white'
              }`}
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
