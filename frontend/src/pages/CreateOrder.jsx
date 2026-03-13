import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../api/client'
import { ArrowLeft, Save, Calendar, Table2, AlertCircle } from 'lucide-react'

export default function CreateOrder() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    orderDate: '',
    tableId: ''
  })

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
      const payload = {
        orderDate: formData.orderDate || new Date().toISOString(),
        tableId: formData.tableId
      }

      await post('/api/v1/orders', payload)
      setSuccess('Order created successfully!')
      
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
              <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Order Date & Time
              </label>
              <input
                type="datetime-local"
                id="orderDate"
                name="orderDate"
                className="input"
                value={formData.orderDate}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use current date and time
              </p>
            </div>

            <div>
              <label htmlFor="tableId" className="block text-sm font-medium text-gray-700 mb-2">
                <Table2 className="h-4 w-4 inline mr-1" />
                Table ID
              </label>
              <input
                type="text"
                id="tableId"
                name="tableId"
                required
                className="input"
                placeholder="e.g., table_123"
                value={formData.tableId}
                onChange={handleChange}
              />
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
