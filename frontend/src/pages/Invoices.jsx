import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get, patch, del } from '../api/client'
import { Plus, FileText, Calendar, AlertCircle, Search, Table2, Clock, CheckCircle, XCircle, Receipt, Edit2, Trash2, Save, RefreshCw, CreditCard } from 'lucide-react'

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 })
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentEditingInvoice, setCurrentEditingInvoice] = useState(null)
  const [editForm, setEditForm] = useState({
    paymentStatus: '',
    paymentMethod: '',
    foodItems: []
  })

  const orderIdFilter = searchParams.get('orderId') || ''

  const normalizeInvoices = (data) => {
    const invoiceList = data.invoices || data || []
    return invoiceList.map(invoice => ({
      ...invoice,
      invoiceId: invoice.invoiceId || invoice._id || invoice.id,
      createdAt: invoice.createdAt || invoice.created_at || new Date(),
      orderDate: invoice.orderDate || invoice.order_date || invoice.createdAt,
      totalAmount: Number(invoice.totalAmount || invoice.total_amount || invoice.total || 0),
      paymentStatus: invoice.paymentStatus || invoice.payment_status || 'PENDING',
      paymentMethod: invoice.paymentMethod || invoice.payment_method || 'CASH',
      tableNumber: invoice.tableNumber || invoice.table_number || 'N/A',
      orderId: invoice.orderId || invoice.order_id || 'N/A',
      foodItems: invoice.foodItems || invoice.food_items || invoice.orderDetails || []
    }))
  }

  const calculateTodayStats = (invoiceList) => {
    const today = new Date().toDateString()
    const todayInvoices = invoiceList.filter(invoice =>
      new Date(invoice.createdAt || invoice.orderDate).toDateString() === today
    )
    const total = todayInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0)
    setTodayStats({ count: todayInvoices.length, total })
  }

  const fetchInvoices = async ({ showSpinner = false } = {}) => {
    if (showSpinner) setRefreshing(true)
    setError('')

    try {
      const response = await get('/api/v1/invoices')
      const normalized = normalizeInvoices(response)
      setInvoices(normalized)
      calculateTodayStats(normalized)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(`Failed to load invoices: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const updatePaymentStatus = async (invoiceId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: true }))

      const response = await patch(`/api/v1/invoices/${invoiceId}`, {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      })

      const nextInvoices = invoices.map(invoice =>
        invoice.invoiceId === invoiceId
          ? { ...invoice, paymentStatus: newStatus, lastUpdated: new Date().toISOString(), ...response.invoice }
          : invoice
      )
      setInvoices(nextInvoices)
      calculateTodayStats(nextInvoices)
    } catch (err) {
      console.error('Error updating payment status:', err)
      setError('Failed to update payment status')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: false }))
    }
  }

  const deleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return

    try {
      await del(`/api/v1/invoices/${invoiceId}`)
      const nextInvoices = invoices.filter(invoice => invoice.invoiceId !== invoiceId)
      setInvoices(nextInvoices)
      calculateTodayStats(nextInvoices)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError('Failed to delete invoice')
    }
  }

  const openEditModal = (invoice) => {
    setCurrentEditingInvoice(invoice)
    setEditForm({
      paymentStatus: invoice.paymentStatus || 'PENDING',
      paymentMethod: invoice.paymentMethod || 'CASH',
      foodItems: invoice.foodItems || []
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setCurrentEditingInvoice(null)
    setEditForm({ paymentStatus: '', paymentMethod: '', foodItems: [] })
  }

  const updateInvoice = async () => {
    if (!currentEditingInvoice) return

    try {
      setUpdatingStatus(prev => ({ ...prev, [currentEditingInvoice.invoiceId]: true }))
      const totalAmount = editForm.foodItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
      const updateData = {
        paymentStatus: editForm.paymentStatus,
        paymentMethod: editForm.paymentMethod,
        foodItems: editForm.foodItems,
        totalAmount,
        updatedAt: new Date().toISOString()
      }

      await patch(`/api/v1/invoices/${currentEditingInvoice.invoiceId}`, updateData)
      const nextInvoices = invoices.map(invoice =>
        invoice.invoiceId === currentEditingInvoice.invoiceId
          ? { ...invoice, ...updateData, lastUpdated: new Date().toISOString() }
          : invoice
      )
      setInvoices(nextInvoices)
      calculateTodayStats(nextInvoices)
      closeEditModal()
    } catch (err) {
      console.error('Error updating invoice:', err)
      setError('Failed to update invoice')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [currentEditingInvoice.invoiceId]: false }))
    }
  }

  const addFoodItem = () => {
    setEditForm(prev => ({
      ...prev,
      foodItems: [...prev.foodItems, { foodName: '', quantity: 1, price: 0 }]
    }))
  }

  const removeFoodItem = (index) => {
    setEditForm(prev => ({
      ...prev,
      foodItems: prev.foodItems.filter((_, i) => i !== index)
    }))
  }

  const updateFoodItem = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      foodItems: prev.foodItems.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }))
  }

  const getInvoiceDate = (invoice) => new Date(invoice.createdAt || invoice.orderDate || Date.now())

  const getInvoiceDateKey = (invoice) => {
    const date = getInvoiceDate(invoice)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const filteredInvoices = invoices.filter(invoice => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = (
      invoice.invoiceId?.toLowerCase().includes(q) ||
      invoice.orderId?.toLowerCase().includes(q) ||
      invoice.tableNumber?.toString().toLowerCase().includes(q) ||
      invoice.paymentStatus?.toLowerCase().includes(q)
    )
    const matchesDate = !dateFilter || getInvoiceDateKey(invoice) === dateFilter
    const matchesOrder = !orderIdFilter || invoice.orderId === orderIdFilter
    return matchesSearch && matchesDate && matchesOrder
  }).sort((a, b) => getInvoiceDate(b) - getInvoiceDate(a))

  const paidCount = invoices.filter(invoice => invoice.paymentStatus?.toLowerCase() === 'paid').length
  const pendingCount = invoices.filter(invoice => invoice.paymentStatus?.toLowerCase() === 'pending').length

  const statusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const StatusIcon = ({ status }) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="page-surface">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Review payments, invoice items, daily sales, and order totals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchInvoices({ showSpinner: true })}
            className="btn btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/menu-with-foods" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Order Food
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Invoices</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{invoices.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Today</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{todayStats.count}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Today Revenue</p>
          <p className="mt-2 text-3xl font-semibold text-teal-700">${todayStats.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Paid</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-900">{paidCount}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-700" />
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-amber-900">{pendingCount}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-700" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search invoices by ID, order, table, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="input pl-10"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setDateFilter('')
              setSearchParams({})
            }}
            className="btn btn-secondary"
            disabled={!searchTerm && !dateFilter && !orderIdFilter}
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Showing {filteredInvoices.length} of {invoices.length} invoice{invoices.length === 1 ? '' : 's'}, newest first
          {dateFilter ? ` for ${new Date(`${dateFilter}T00:00:00`).toLocaleDateString()}` : ''}
          {orderIdFilter ? ` for order ${orderIdFilter}` : ''}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {filteredInvoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-950">
            {searchTerm || dateFilter || orderIdFilter ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || dateFilter || orderIdFilter ? 'Try another search or clear the filters.' : 'Use Order Food to generate the first invoice.'}
          </p>
          {!searchTerm && !dateFilter && !orderIdFilter && (
            <Link to="/menu-with-foods" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" />
              Order Food
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <article key={invoice.id || invoice.invoiceId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(invoice.paymentStatus)}`}>
                      <StatusIcon status={invoice.paymentStatus} />
                      {invoice.paymentStatus || 'PENDING'}
                    </span>
                    {invoice.paymentMethod && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <CreditCard className="h-3.5 w-3.5" />
                        {invoice.paymentMethod}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">{invoice.invoiceId}</h3>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(invoice.orderDate || invoice.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Table2 className="h-4 w-4" />
                      Table {invoice.tableNumber || 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      Order {invoice.orderId}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                  <div>
                    <p className="text-sm text-slate-500 lg:text-right">Total</p>
                    <p className="text-2xl font-semibold text-slate-950">${Number(invoice.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <select
                    value={invoice.paymentStatus || 'PENDING'}
                    disabled={updatingStatus[invoice.invoiceId]}
                    onChange={(e) => updatePaymentStatus(invoice.invoiceId, e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {invoice.foodItems && invoice.foodItems.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">Order Items</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {invoice.foodItems.map((item, index) => (
                      <div key={index} className="flex flex-col gap-1 rounded-md bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-medium text-slate-700">{item.foodName || `Food Item ${index + 1}`}</span>
                        <span className="text-slate-500 sm:text-right">
                          {item.quantity || 1} x ${Number(item.price || 0).toFixed(2)}
                          <span className="ml-2 font-semibold text-slate-900">${Number(item.subtotal || (Number(item.price || 0) * Number(item.quantity || 1))).toFixed(2)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <span>Created: {new Date(invoice.createdAt).toLocaleString()}</span>
                  {invoice.paymentDueDate && <span>Due: {new Date(invoice.paymentDueDate).toLocaleDateString()}</span>}
                  {invoice.lastUpdated && <span className="font-medium text-emerald-700">Updated: {new Date(invoice.lastUpdated).toLocaleString()}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(invoice)} className="btn btn-secondary">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteInvoice(invoice.invoiceId)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showEditModal && currentEditingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Edit Invoice</h2>
                  <p className="mt-1 text-sm text-slate-500">{currentEditingInvoice.invoiceId}</p>
                </div>
                <button onClick={closeEditModal} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment Status</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="input"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Payment Method</label>
                  <select
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="input"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Food Items</label>
                  <button onClick={addFoodItem} className="btn btn-secondary">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {editForm.foodItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_80px_110px_36px]">
                      <input
                        type="text"
                        placeholder="Food name"
                        value={item.foodName || ''}
                        onChange={(e) => updateFoodItem(index, 'foodName', e.target.value)}
                        className="input"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) => updateFoodItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="input"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.price || 0}
                        onChange={(e) => updateFoodItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="input"
                      />
                      <button onClick={() => removeFoodItem(index)} className="rounded-md p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-slate-100 p-4">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">Total Amount</span>
                  <span className="text-2xl font-semibold text-slate-950">
                    ${editForm.foodItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={closeEditModal} className="btn btn-secondary">Cancel</button>
                <button
                  onClick={updateInvoice}
                  disabled={updatingStatus[currentEditingInvoice.invoiceId]}
                  className="btn btn-primary"
                >
                  <Save className="h-4 w-4" />
                  {updatingStatus[currentEditingInvoice.invoiceId] ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
