import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../api/client'
import { ArrowLeft, Save, CreditCard, Calendar, Receipt, AlertCircle } from 'lucide-react'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    orderId: '',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    paymentDueDate: ''
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
        ...formData,
        paymentDueDate: formData.paymentDueDate || new Date().toISOString()
      }

      await post('/api/v1/invoices', payload)
      setSuccess('Invoice created successfully!')
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        setFormData({
          orderId: '',
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          paymentDueDate: ''
        })
        navigate('/dashboard') // Navigate to dashboard or invoices page
      }, 2000)
      
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to create invoice. Please try again.')
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
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Invoice
            </h1>
            <p className="mt-2 text-gray-600">
              Generate a new invoice for customer payment
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
              <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                id="orderId"
                name="orderId"
                required
                className="input"
                placeholder="e.g., order_123"
                value={formData.orderId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className="input"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Credit Card</option>
                <option value="ONLINE">Online Payment</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                className="input"
                value={formData.paymentStatus}
                onChange={handleChange}
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentDueDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Payment Due Date
              </label>
              <input
                type="datetime-local"
                id="paymentDueDate"
                name="paymentDueDate"
                className="input"
                value={formData.paymentDueDate}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use current date and time
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
                {loading ? 'Creating...' : 'Create Invoice'}
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
