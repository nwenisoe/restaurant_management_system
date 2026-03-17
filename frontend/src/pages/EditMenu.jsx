import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { get, put } from '../api/client'
import { ArrowLeft, Save, Calendar, Tag, AlertCircle, Loader2 } from 'lucide-react'

export default function EditMenu() {
  const navigate = useNavigate()
  const { menuId } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
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

  useEffect(() => {
    fetchMenuData()
  }, [menuId])

  const fetchMenuData = async () => {
    try {
      const response = await get(`/api/v1/menus/${menuId}`)
      const menuData = response.menu || response
      
      // Format dates for input fields
      const startDate = menuData.startDate ? new Date(menuData.startDate).toISOString().split('T')[0] : ''
      const endDate = menuData.endDate ? new Date(menuData.endDate).toISOString().split('T')[0] : ''
      
      setFormData({
        name: menuData.name || '',
        category: menuData.category || '',
        startDate: startDate,
        endDate: endDate
      })
    } catch (err) {
      console.error('Error fetching menu data:', err)
      setError('Failed to load menu data. Please try again.')
    } finally {
      setFetchLoading(false)
    }
  }

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

      await put(`/api/v1/menus/${menuId}`, payload)
      setSuccess('Menu updated successfully!')
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate('/menu')
      }, 2000)
      
    } catch (err) {
      console.error('Error updating menu:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to update menu item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading menu data...</p>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold text-gray-900">Edit Menu Item</h1>
        <p className="text-gray-500">Update the menu item information</p>
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
              {loading ? 'Updating...' : 'Update Menu Item'}
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
