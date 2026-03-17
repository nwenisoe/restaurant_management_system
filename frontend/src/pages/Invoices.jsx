import React, { useState, useEffect } from 'react'
import { get, post, patch, del } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Plus, FileText, Calendar, DollarSign, Search, Table2, Clock, CheckCircle, XCircle, TrendingUp, Receipt, Filter, Edit2, Trash2, Save, RefreshCw, Grid, List, X, Eye, Download, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Invoices() {
  const { token, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date') // 'date', 'amount', 'status', 'customer'
  const [editingInvoice, setEditingInvoice] = useState(null) // Track which invoice is being edited
  const [editForm, setEditForm] = useState({}) // Store edit form data

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await get('/api/v1/public-invoices')
      setItems(response.invoices || response || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || item.paymentStatus === filterStatus
      return matchesSearch && matchesStatus
    })

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'amount':
          return (b.totalAmount || 0) - (a.totalAmount || 0)
        case 'status':
          return (a.paymentStatus || '').localeCompare(b.paymentStatus || '')
        case 'customer':
          return (a.customerName || '').localeCompare(b.customerName || '')
        default:
          return 0
      }
    })

    return filtered
  }

  const getItemId = (item) => {
    return item.invoiceId || item.id || item._id
  }

  const startEdit = (item) => {
    const itemId = getItemId(item)
    setEditingInvoice(itemId)
    setEditForm({
      customerName: item.customerName,
      tableNumber: item.tableNumber,
      paymentStatus: item.paymentStatus,
      paymentMethod: item.paymentMethod,
      totalAmount: item.totalAmount
    })
  }

  const cancelEdit = () => {
    setEditingInvoice(null)
    setEditForm({})
  }

  const handleUpdate = async (itemId) => {
    try {
      await put(`/api/v1/public-invoices/${itemId}`, editForm)
      // Update item in local state
      setItems(items.map(item => {
        const id = getItemId(item)
        if (id === itemId) {
          return {
            ...item,
            ...editForm,
            updatedAt: new Date().toISOString()
          }
        }
        return item
      }))
      setEditingInvoice(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/public-invoices/${id}`)
      setItems(items.filter(item => getItemId(item) !== id))
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const filteredItems = getFilteredAndSortedItems()
  const statuses = [...new Set(items.map(item => item.paymentStatus).filter(Boolean))]

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your restaurant invoices efficiently</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">
                ${items.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Revenue</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-purple-600">
                {items.filter(item => item.paymentStatus === 'paid').length}
              </div>
              <div className="text-sm text-gray-500">Paid Invoices</div>
            </div>
            <Link to="/create/invoice" className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4" />
              Add Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search invoices by customer name, invoice number, or table..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Sort:</label>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date Created</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="flex items-center bg-gradient-to-r from-emerald-100 to-teal-200 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-600 hover:bg-white'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-600 hover:bg-white'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Receipt className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by creating your first invoice'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link to="/create/invoice" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Invoice
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const itemId = getItemId(item)
                const isEditing = editingInvoice === itemId
                
                return (
                  <div key={itemId} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editForm.customerName || ''}
                                onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                placeholder="Customer name"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.totalAmount || ''}
                                onChange={(e) => setEditForm({...editForm, totalAmount: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                placeholder="Total amount"
                              />
                              <select
                                value={editForm.paymentStatus || ''}
                                onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                              >
                                <option value="">Select status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.customerName}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Table2 className="h-4 w-4 text-purple-500" />
                                <span className="text-sm font-medium text-gray-700">Table: {item.tableNumber}</span>
                              </div>
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(item.paymentStatus)} shadow-sm`}>
                                {getStatusIcon(item.paymentStatus)}
                                <span className="ml-1.5">{item.paymentStatus}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdate(itemId)}
                                className="p-2.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Edit Invoice"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setItemToDelete(item)
                              setShowDeleteModal(true)
                            }}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Receipt className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium">Invoice #{itemId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-green-600">${parseFloat(item.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium">Created: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {item.updatedAt && (
                            <span>Updated {formatDate(item.updatedAt)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg p-1.5 transition-all">
                            <Eye className="h-3 w-3" />
                          </button>
                          <button className="text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg p-1.5 transition-all">
                            <Download className="h-3 w-3" />
                          </button>
                          <button className="text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg p-1.5 transition-all">
                            <Printer className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const itemId = getItemId(item)
                      const isEditing = editingInvoice === itemId
                      
                      return (
                        <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">#{itemId}</div>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.customerName || ''}
                                onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                placeholder="Customer name"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.tableNumber || ''}
                                onChange={(e) => setEditForm({...editForm, tableNumber: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                placeholder="Table number"
                              />
                            ) : (
                              <div className="text-sm text-gray-600">{item.tableNumber}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.totalAmount || ''}
                                onChange={(e) => setEditForm({...editForm, totalAmount: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                placeholder="Amount"
                              />
                            ) : (
                              <div className="text-sm font-bold text-green-600">${parseFloat(item.totalAmount || 0).toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select
                                value={editForm.paymentStatus || ''}
                                onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              >
                                <option value="">Select status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.paymentStatus)}`}>
                                {getStatusIcon(item.paymentStatus)}
                                <span className="ml-1">{item.paymentStatus}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdate(itemId)}
                                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Save"
                                  >
                                    <Save className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setItemToDelete(item)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Invoice</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete invoice "<span className="font-medium text-gray-900">#{itemToDelete?.invoiceId || itemToDelete?.id}</span>" for "<span className="font-medium text-gray-900">{itemToDelete?.customerName}</span>"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(getItemId(itemToDelete))}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
