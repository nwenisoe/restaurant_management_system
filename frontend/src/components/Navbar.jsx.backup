import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, Utensils, ShoppingCart, Table, Receipt, Plus, LogOut, User, Home } from 'lucide-react'

export default function Navbar({ onLogout }) {
  const { isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Menu', href: '/menu', icon: Utensils },
    { name: 'Foods', href: '/foods', icon: ShoppingCart },
    { name: 'Tables', href: '/tables', icon: Table },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
  ]

  const createItems = [
    { name: 'New Menu', href: '/create/menu' },
    { name: 'New Food', href: '/create/food' },
    { name: 'New Table', href: '/create/table' },
    { name: 'New Order', href: '/create/order' },
    { name: 'New OrderItem', href: '/create/orderitem' },
    { name: 'New Invoice', href: '/create/invoice' },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Utensils className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Restaurant Manager</span>
            </div>
            
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        location.pathname === item.href
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="relative group">
                  <button className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {createItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <User className="h-4 w-4 mr-1 inline" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated && navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-1">
                {createItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    onLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
