import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { post, get } from '../api/client'
import { ArrowLeft, Save, Calendar, Table2, AlertCircle } from 'lucide-react'

export default function CreateOrder() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [formData, setFormData] = useState({
    orderDate: '',
    tableId: ''
  })

  // Fetch available tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await get('/api/v1/tables')
        const tablesData = response.tables || response || []
        setTables(tablesData)
      } catch (err) {
        console.error('Error fetching tables:', err)
        setError('Failed to load tables. Please try again.')
      } finally {
        setTablesLoading(false)
      }
    }

    fetchTables()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Always use current date to avoid datetime-local issues
      const orderDate = new Date().toISOString()
      
      // Clean tableId - ensure it's a string and not empty
      const tableId = formData.tableId?.trim()
      
      if (!tableId) {
        throw new Error('Please select a table')
      }
      
      const payload = {
        orderDate: orderDate,
        tableId: tableId
      }
      
      console.log('Creating order with payload:', JSON.stringify(payload, null, 2))
      
      await post('/api/v1/orders', payload)
      setSuccess('Order created successfully!')
      
      // Auto-generate invoice for the order
      try {
        const orderResponse = await get('/api/v1/orders')
        const orders = orderResponse.orders || orderResponse || []
        const latestOrder = orders[orders.length - 1]
        
        if (latestOrder && latestOrder.orderId) {
          await post(`/api/v1/orders/${latestOrder.orderId}/invoice`, {})
          console.log('Invoice generated automatically for order:', latestOrder.orderId)
        }
      } catch (invoiceErr) {
        console.error('Failed to generate invoice:', invoiceErr)
        // Don't fail the order creation if invoice generation fails
      }
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        setFormData({
          orderDate: '',
          tableId: ''
        })
        navigate('/dashboard') // Navigate to dashboard or orders page
      }, 2000)
      
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Order
            </h1>
            <p className="mt-2 text-gray-600">
              Start a new order for your restaurant
            </p>
          </div>
        </div>

        {/* Create Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-2">
                <Table2 className="h-4 w-4 inline mr-1" />
                Table
              </label>
              {tablesLoading ? (
                <div className="input bg-gray-100 text-gray-500">Loading tables...</div>
              ) : tables.length === 0 ? (
                <div className="input bg-red-50 text-red-600">
                  No tables found. <a href="/create/table" className="underline">Create a table first</a>
                </div>
              ) : (
                <select
                  id="tableId"
                  name="tableId"
                  required
                  className="input"
                  value={formData.tableId}
                  onChange={handleChange}
                >
                  <option value="">Select a table...</option>
                  {tables.map((table) => (
                    <option key={table.id || table.tableId} value={table.tableId}>
                      Table {table.tableNumber} ({table.numberOfGuests} guests)
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Order will be created with current date and time
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Creating...' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
