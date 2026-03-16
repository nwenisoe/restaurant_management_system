import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../api/client'
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, AlertCircle, Search, Table2, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await get('/api/v1/invoices')
        const invoicesData = response.invoices || response || []
        console.log('Invoices data received:', invoicesData)
        setInvoices(invoicesData)
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError(`Failed to load invoices: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

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
              <h1 className="text-3xl font-bold text-gray-900">Invoices & Orders</h1>
              <p className="mt-2 text-gray-600">Manage all customer invoices and track orders</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/create/order"
                className="btn btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Link>
              <Link
                to="/create/invoice"
                className="btn btn-secondary flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Manual Invoice
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search invoices by ID, order ID, or table number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
        <div className="card">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No invoices found' : 'No invoices yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Create an order to automatically generate an invoice'}
              </p>
              <Link
                to="/create/order"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id || invoice.invoiceId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceId}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus)}`}>
                          {getStatusIcon(invoice.paymentStatus)}
                          <span className="ml-1">{invoice.paymentStatus || 'Pending'}</span>
                        </span>
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
                    <div className="border-t border-gray-200 pt-4 mb-4">
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
                    <div className="border-t border-gray-200 pt-4 mb-4">
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
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(invoice.createdAt).toLocaleString()}
                        {invoice.paymentDueDate && (
                          <span className="ml-4">
                            Due: {new Date(invoice.paymentDueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                          View Details
                        </button>
                        {invoice.paymentStatus === 'PENDING' && (
                          <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
