import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Menu from './pages/Menu'
import Orders from './pages/Orders'
import Foods from './pages/Foods'
import Tables from './pages/Tables'
import Invoices from './pages/Invoices'
import Signup from './pages/Signup'
import CreateMenu from './pages/CreateMenu'
import CreateFood from './pages/CreateFood'
import CreateTable from './pages/CreateTable'
import CreateOrder from './pages/CreateOrder'
import CreateOrderItem from './pages/CreateOrderItem'
import CreateInvoice from './pages/CreateInvoice'
import Dashboard from './pages/Dashboard'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={
        isAuthenticated ? 
          <ProtectedRoute><Dashboard /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/menu" element={
        isAuthenticated ? 
          <ProtectedRoute><Menu /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/menu" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateMenu /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/food" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateFood /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/table" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateTable /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/order" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateOrder /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/orderitem" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateOrderItem /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/create/invoice" element={
        isAuthenticated ? 
          <ProtectedRoute><CreateInvoice /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/foods" element={
        isAuthenticated ? 
          <ProtectedRoute><Foods /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/tables" element={
        isAuthenticated ? 
          <ProtectedRoute><Tables /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/invoices" element={
        isAuthenticated ? 
          <ProtectedRoute><Invoices /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="/orders" element={
        isAuthenticated ? 
          <ProtectedRoute><Orders /></ProtectedRoute> : 
          <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
