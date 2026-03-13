import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { post } from '../api/client'
import { ArrowLeft, Save, DollarSign, Image, Utensils, AlertCircle } from 'lucide-react'

export default function CreateFood() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    foodImage: '',
    menuId: ''
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
        price: parseFloat(formData.price)
      }

      await post('/api/v1/foods', payload)
      setSuccess('Food item created successfully!')
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        setFormData({
          name: '',
          price: '',
          foodImage: '',
          menuId: ''
        })
        navigate('/menu')
      }, 2000)
      
    } catch (err) {
      console.error('Error creating food:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to create food item. Please try again.')
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
            onClick={() => navigate('/menu')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </button>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Food Item
            </h1>
            <p className="mt-2 text-gray-600">
              Add a delicious new item to your restaurant menu
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <Utensils className="h-4 w-4 inline mr-1" />
                Food Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input"
                placeholder="e.g., Grilled Salmon"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                required
                className="input"
                placeholder="29.99"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="foodImage" className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="h-4 w-4 inline mr-1" />
                Image URL
              </label>
              <input
                type="url"
                id="foodImage"
                name="foodImage"
                required
                className="input"
                placeholder="https://example.com/food-image.jpg"
                value={formData.foodImage}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="menuId" className="block text-sm font-medium text-gray-700 mb-2">
                Menu ID
              </label>
              <input
                type="text"
                id="menuId"
                name="menuId"
                required
                className="input"
                placeholder="Menu identifier"
                value={formData.menuId}
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
                {loading ? 'Creating...' : 'Create Food Item'}
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
    </div>
  )
}
