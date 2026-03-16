import React, { useState, useEffect } from 'react'
import { get } from '../api/client'
import { ArrowLeft, Plus, Calendar, Table2, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tokenStatus, setTokenStatus] = useState('')

  useEffect(() => {
    // Check token status
    const token = localStorage.getItem('token')
    setTokenStatus(token ? `Token exists (${token.substring(0, 20)}...)` : 'No token found')

    const fetchOrders = async () => {
      try {
        console.log('Fetching orders...')
        const data = await get('/api/v1/orders')
        console.log('Orders response received:', data) // Debug log
        
        // Backend returns { totalCount, orders }
        const ordersData = data.orders || data || []
        console.log('Orders data extracted:', ordersData) // Debug log
        console.log('Orders count:', ordersData.length)
        
        setOrders(ordersData)
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(`Failed to load orders: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="mt-2 text-gray-600">Manage all customer orders</p>
            </div>
            <Link
              to="/create/order"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Link>
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

        {/* Orders List */}
        <div className="card">
          {/* Debug Info */}
          <div className="mb-4 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Debug: Token Status = {tokenStatus}</p>
            <p className="text-sm text-gray-600">Debug: Orders count = {orders.length}</p>
            <p className="text-sm text-gray-600">Debug: Error = {error || 'None'}</p>
            {orders.length > 0 && (
              <p className="text-sm text-gray-600">
                Debug: First order = {JSON.stringify(orders[0], null, 2)}
              </p>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Table2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first order</p>
              <Link
                to="/create/order"
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id || order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId || order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Table2 className="h-4 w-4 mr-2 text-gray-400" />
                          {order.tableId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/create/orderitem`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Add Items
                          </Link>
                          <Link
                            to={`/invoices`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Invoice
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
