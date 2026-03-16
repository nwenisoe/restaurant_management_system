import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get, post, patch, del } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, AlertCircle, Search, Table2, Clock, CheckCircle, XCircle, TrendingUp, Receipt, Filter, Edit2, Trash2, Save, RefreshCw } from 'lucide-react'

export default function Invoices() {
  const { token, isAuthenticated } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 })
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentEditingInvoice, setCurrentEditingInvoice] = useState(null)
  const [editForm, setEditForm] = useState({
    paymentStatus: '',
    paymentMethod: '',
    foodItems: []
  })

  console.log('Auth status in Invoices:', { isAuthenticated, token: token ? 'present' : 'missing' })

  const fetchInvoices = async () => {
      try {
        console.log('Testing CORS endpoint first...')
        try {
          const testResponse = await get('/api/v1/test-cors')
          console.log('CORS test successful:', testResponse)
        } catch (testError) {
          console.error('CORS test failed:', testError)
          // Continue with invoices fetch even if CORS test fails
        }
        
        console.log('Testing public-invoices endpoint...')
        try {
          const publicInvoicesResponse = await get('/api/v1/public-invoices')
          console.log('Public invoices endpoint successful:', publicInvoicesResponse)
        } catch (publicInvoicesError) {
          console.error('Public invoices endpoint failed:', publicInvoicesError)
        }
        
        console.log('Fetching invoices from public endpoint...')
        const response = await get('/api/v1/public-invoices')
        console.log('Raw response:', response)
        
        const invoicesData = response.invoices || response || []
        console.log('Extracted invoices data:', invoicesData)
        console.log('Number of invoices:', invoicesData.length)
        
        // Debug first invoice structure
        if (invoicesData.length > 0) {
          console.log('First invoice structure:', invoicesData[0])
          console.log('Available fields:', Object.keys(invoicesData[0]))
        }
        
        // Normalize invoice data to handle different field names
        const normalizedInvoices = invoicesData.map(invoice => ({
          ...invoice,
          // Handle different ID field names
          invoiceId: invoice.invoiceId || invoice._id || invoice.id,
          // Handle different date field names
          createdAt: invoice.createdAt || invoice.created_at || new Date(),
          orderDate: invoice.orderDate || invoice.order_date || invoice.createdAt,
          // Handle other field variations
          totalAmount: invoice.totalAmount || invoice.total_amount || invoice.total,
          paymentStatus: invoice.paymentStatus || invoice.payment_status || 'PENDING',
          paymentMethod: invoice.paymentMethod || invoice.payment_method,
          tableNumber: invoice.tableNumber || invoice.table_number || 'N/A',
          orderId: invoice.orderId || invoice.order_id || 'N/A',
          // Handle food items structure
          foodItems: invoice.foodItems || invoice.food_items || invoice.orderDetails || []
        }))
        
        console.log('Normalized invoices:', normalizedInvoices)
        setInvoices(normalizedInvoices)
        
        // Calculate today's stats
        const today = new Date().toDateString()
        const todayInvoices = normalizedInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt || invoice.orderDate).toDateString()
          console.log('Invoice date:', invoiceDate, 'Today:', today, 'Match:', invoiceDate === today)
          return invoiceDate === today
        })
        
        console.log('Today invoices:', todayInvoices)
        
        const todayTotal = todayInvoices.reduce((sum, invoice) => 
          sum + (invoice.totalAmount || 0), 0
        )
        
        console.log('Today total:', todayTotal)
        
        setTodayStats({
          count: todayInvoices.length,
          total: todayTotal
        })
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError(`Failed to load invoices: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchInvoices()
  }, [])

  // Update invoice payment status
  const updatePaymentStatus = async (invoiceId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: true }))
      
      console.log('Updating payment status for invoice:', invoiceId, 'to:', newStatus)
      
      const response = await patch(`/api/v1/public-invoices/${invoiceId}`, {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      })
      
      console.log('Payment status updated:', response)
      
      // Update local state with lastUpdated timestamp
      setInvoices(prev => prev.map(invoice => 
        invoice.invoiceId === invoiceId 
          ? { 
              ...invoice, 
              paymentStatus: newStatus,
              lastUpdated: new Date().toISOString(),
              ...response.invoice
            }
          : invoice
      ))
      
      // Recalculate today's stats
      const today = new Date().toDateString()
      const todayInvoices = invoices.filter(invoice => 
        new Date(invoice.createdAt || invoice.orderDate).toDateString() === today
      )
      
      const todayTotal = todayInvoices.reduce((sum, invoice) => 
        sum + (invoice.totalAmount || 0), 0
      )
      
      setTodayStats({
        count: todayInvoices.length,
        total: todayTotal
      })
      
    } catch (err) {
      console.error('Error updating payment status:', err)
      setError('Failed to update payment status')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: false }))
    }
  }

  // Delete invoice
  const deleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }
    
    console.log('Deleting invoice with ID:', invoiceId)
    
    try {
      const response = await del(`/api/v1/public-invoices/${invoiceId}`)
      console.log('Delete response:', response)
      
      // Update local state
      setInvoices(prev => prev.filter(invoice => invoice.invoiceId !== invoiceId))
      
      // Recalculate today's stats
      const today = new Date().toDateString()
      const todayInvoices = invoices.filter(invoice => 
        new Date(invoice.createdAt || invoice.orderDate).toDateString() === today &&
        invoice.invoiceId !== invoiceId
      )
      
      const todayTotal = todayInvoices.reduce((sum, invoice) => 
        sum + (invoice.totalAmount || 0), 0
      )
      
      setTodayStats({
        count: todayInvoices.length,
        total: todayTotal
      })
      
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError('Failed to delete invoice')
    }
  }

  // Open full edit modal
  const openEditModal = (invoice) => {
    setCurrentEditingInvoice(invoice)
    setEditForm({
      paymentStatus: invoice.paymentStatus || 'PENDING',
      paymentMethod: invoice.paymentMethod || 'CASH',
      foodItems: invoice.foodItems || []
    })
    setShowEditModal(true)
  }

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false)
    setCurrentEditingInvoice(null)
    setEditForm({
      paymentStatus: '',
      paymentMethod: '',
      foodItems: []
    })
  }

  // Update invoice fully
  const updateInvoice = async () => {
    if (!currentEditingInvoice) return
    
    try {
      setUpdatingStatus(prev => ({ ...prev, [currentEditingInvoice.invoiceId]: true }))
      
      console.log('Updating invoice with ID:', currentEditingInvoice.invoiceId)
      console.log('Available invoice fields:', Object.keys(currentEditingInvoice))
      
      // Calculate new total based on food items
      const newTotal = editForm.foodItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )
      
      const updateData = {
        paymentStatus: editForm.paymentStatus,
        paymentMethod: editForm.paymentMethod,
        foodItems: editForm.foodItems,
        totalAmount: newTotal,
        updatedAt: new Date().toISOString()
      }
      
      console.log('Update data:', updateData)
      
      const response = await patch(`/api/v1/public-invoices/${currentEditingInvoice.invoiceId}`, updateData)
      console.log('Invoice updated:', response)
      
      // Update local state
      setInvoices(prev => prev.map(invoice => 
        invoice.invoiceId === currentEditingInvoice.invoiceId 
          ? { 
              ...invoice, 
              ...updateData,
              lastUpdated: new Date().toISOString()
            }
          : invoice
      ))
      
      closeEditModal()
    } catch (err) {
      console.error('Error updating invoice:', err)
      setError('Failed to update invoice')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [currentEditingInvoice.invoiceId]: false }))
    }
  }

  // Add food item to edit form
  const addFoodItem = () => {
    setEditForm(prev => ({
      ...prev,
      foodItems: [...prev.foodItems, { foodName: '', quantity: 1, price: 0 }]
    }))
  }

  // Remove food item from edit form
  const removeFoodItem = (index) => {
    setEditForm(prev => ({
      ...prev,
      foodItems: prev.foodItems.filter((_, i) => i !== index)
    }))
  }

  // Update food item in edit form
  const updateFoodItem = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      foodItems: prev.foodItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    if (!status) return 'bg-yellow-100 text-yellow-800'
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    if (!status) return <Clock className="h-4 w-4" />
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
              <p className="mt-2 text-gray-600">View and manage all your restaurant invoices</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchInvoices}
                className="btn btn-secondary flex items-center"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                to="/menu-with-foods"
                className="btn btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Order
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Summary Cards - KBZ Pay Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Today's Invoices</p>
                <p className="text-3xl font-bold mt-2">{todayStats.count}</p>
                <p className="text-blue-100 text-sm mt-1">Total invoices created today</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <Receipt className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold mt-2">${todayStats.total.toFixed(2)}</p>
                <p className="text-green-100 text-sm mt-1">Total sales amount today</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="input pl-10 w-full"
                  placeholder="Search invoices by ID, order ID, or table number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {filteredInvoices.length} of {invoices.length} invoices
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Create an order to generate your first invoice'}
              </p>
              <Link
                to="/menu-with-foods"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id || invoice.invoiceId} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceId}</h3>
                        <div className="flex items-center space-x-2">
                          {/* Payment Status Dropdown */}
                          <div>
                            <small className="text-gray-500">Status:</small>
                            <select
                              value={invoice.paymentStatus || 'PENDING'}
                              onChange={(e) => {
                                const newStatus = e.target.value
                                console.log('Status changed to:', newStatus)
                                // Update local state immediately for better UX
                                setInvoices(prev => prev.map(inv => 
                                  inv.invoiceId === invoice.invoiceId 
                                    ? { ...inv, paymentStatus: newStatus }
                                    : inv
                                ))
                                // Also update in backend
                                updatePaymentStatus(invoice.invoiceId, newStatus)
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PAID">Paid</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                          
                          {invoice.paymentMethod && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {invoice.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(invoice.orderDate || invoice.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Table2 className="h-4 w-4 mr-1" />
                          Table {invoice.tableNumber || 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Order: {invoice.orderId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${invoice.totalAmount ? invoice.totalAmount.toFixed(2) : '0.00'}
                      </div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                    </div>
                  </div>
                  
                  {/* Food Items */}
                  {invoice.foodItems && invoice.foodItems.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items:</h4>
                      <div className="space-y-2">
                        {invoice.foodItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{item.foodName}</span>
                            <div className="text-right">
                              <span className="text-gray-500">{item.quantity} × ${item.price ? item.price.toFixed(2) : '0.00'}</span>
                              <span className="font-medium ml-2">${item.subtotal ? item.subtotal.toFixed(2) : '0.00'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Details (for backward compatibility) */}
                  {invoice.orderDetails && Array.isArray(invoice.orderDetails) && (
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items:</h4>
                      <div className="space-y-2">
                        {invoice.orderDetails.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Food Item {index + 1}</span>
                            <div className="text-right">
                              <span className="text-gray-500">Qty: {item.quantity || 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(invoice.createdAt).toLocaleString()}
                        {invoice.lastUpdated && (
                          <span className="ml-4 text-green-600 font-medium">
                            Updated: {new Date(invoice.lastUpdated).toLocaleString()}
                          </span>
                        )}
                        {invoice.paymentDueDate && (
                          <span className="ml-4">
                            Due: {new Date(invoice.paymentDueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium flex items-center"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit Invoice
                        </button>
                        <button
                          onClick={() => deleteInvoice(invoice.invoiceId)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && currentEditingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Invoice: {currentEditingInvoice.invoiceId}</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                {/* Food Items */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Food Items</label>
                    <button
                      onClick={addFoodItem}
                      className="btn btn-secondary text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {editForm.foodItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                        <input
                          type="text"
                          placeholder="Food name"
                          value={item.foodName || ''}
                          onChange={(e) => updateFoodItem(index, 'foodName', e.target.value)}
                          className="input flex-1"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => updateFoodItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="input w-20"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.price || 0}
                          onChange={(e) => updateFoodItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input w-24"
                        />
                        <button
                          onClick={() => removeFoodItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${editForm.foodItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={updateInvoice}
                  disabled={updatingStatus[currentEditingInvoice.invoiceId]}
                  className="btn btn-primary"
                >
                  {updatingStatus[currentEditingInvoice.invoiceId] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
