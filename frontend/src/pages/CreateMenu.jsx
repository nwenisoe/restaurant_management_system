import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../api/client'
import { ArrowLeft, Save, Calendar, Tag, AlertCircle } from 'lucide-react'

export default function CreateMenu() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    startDate: '',
    endDate: ''
  })

  const categories = [
    'Appetizers',
    'Main Course',
    'Desserts',
    'Beverages',
    'Soups',
    'Salads',
    'Specials'
  ]

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
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      }

      await post('/api/v1/menus', payload)
      setSuccess('Menu created successfully!')
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        setFormData({
          name: '',
          category: '',
          startDate: '',
          endDate: ''
        })
        navigate('/menu')
      }, 2000)
      
    } catch (err) {
      console.error('Error creating menu:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to create menu item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Menu
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Menu Item</h1>
        <p className="text-gray-500">Add a new item to your restaurant menu</p>
      </div>

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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Menu Item Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Grilled Salmon"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-1" />
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="input"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="input"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="input"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Menu Item'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
