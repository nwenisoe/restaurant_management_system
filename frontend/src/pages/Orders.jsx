import React, { useState, useEffect } from 'react'
import { get } from '../api/client'
import { Calendar, Table2, AlertCircle, Search, Receipt, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [tablesById, setTablesById] = useState({})

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [ordersRes, tablesRes] = await Promise.all([
          get('/api/v1/orders'),
          get('/api/v1/tables')
        ])
        const orderList = ordersRes.orders || ordersRes || []
        const tableList = tablesRes.tables || tablesRes || []
        setOrders(orderList)
        setTablesById(
          tableList.reduce((acc, table) => {
            acc[table.tableId] = table
            return acc
          }, {})
        )
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(`Failed to load orders: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getOrderDate = (order) => new Date(order.orderDate || order.createdAt || Date.now())

  const getOrderDateKey = (order) => {
    const date = getOrderDate(order)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getTableLabel = (tableId) => {
    const table = tablesById[tableId]
    return table?.tableNumber ? `Table ${table.tableNumber}` : `Table ${tableId || 'N/A'}`
  }

  const filteredOrders = orders.filter(order => {
    const q = searchTerm.toLowerCase()
    const tableLabel = getTableLabel(order.tableId).toLowerCase()
    const matchesSearch = (
      order.orderId?.toLowerCase().includes(q) ||
      order.tableId?.toLowerCase().includes(q) ||
      tableLabel.includes(q) ||
      getOrderDate(order).toLocaleDateString().toLowerCase().includes(q)
    )
    const matchesDate = !dateFilter || getOrderDateKey(order) === dateFilter
    return matchesSearch && matchesDate
  }).sort((a, b) => getOrderDate(b) - getOrderDate(a))

  const today = new Date().toDateString()
  const todayOrders = orders.filter(order =>
    new Date(order.orderDate || order.createdAt || Date.now()).toDateString() === today
  )

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
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Review customer orders, filter by date, and open related invoices.</p>
        </div>
        <Link to="/menu-with-foods" className="btn btn-primary">
          <ShoppingBag className="h-4 w-4" />
          Order Food
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Total Orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{orders.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Today</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{todayOrders.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search orders by ID, table, or date..."
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
            }}
            className="btn btn-secondary"
            disabled={!searchTerm && !dateFilter}
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Showing {filteredOrders.length} of {orders.length} order{orders.length === 1 ? '' : 's'}, newest first
          {dateFilter ? ` for ${new Date(`${dateFilter}T00:00:00`).toLocaleDateString()}` : ''}
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

      {filteredOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Table2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-950">
            {searchTerm || dateFilter ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || dateFilter ? 'Try another search or clear the date filter.' : 'Use the food ordering flow to create the first order.'}
          </p>
          {!searchTerm && !dateFilter && (
            <Link to="/menu-with-foods" className="btn btn-primary mt-5">
              <ShoppingBag className="h-4 w-4" />
              Order Food
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredOrders.map((order) => {
            const date = new Date(order.orderDate || order.createdAt || Date.now())
            const shortId = order.orderId || order.id || 'N/A'

            return (
              <article key={order.id || order.orderId} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Order</span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">{shortId}</h3>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Table2 className="h-4 w-4" />
                        {getTableLabel(order.tableId)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {date.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-md bg-slate-100 p-3 text-slate-600">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link to={`/invoices?orderId=${encodeURIComponent(order.orderId || '')}`} className="btn btn-primary">
                    <Receipt className="h-4 w-4" />
                    View Invoice
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
