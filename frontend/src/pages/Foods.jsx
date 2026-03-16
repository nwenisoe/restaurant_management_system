import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { ArrowLeft, Plus, Utensils, DollarSign, Image, AlertCircle, Search } from 'lucide-react'

export default function Foods() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await get('/api/v1/foods')
        const foodItems = response.foodItems || response || []
        console.log('Foods data received:', response)
        console.log('Foods extracted:', foodItems)
        setFoods(foodItems)
      } catch (err) {
        console.error('Error fetching foods:', err)
        setError(`Failed to load foods: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFoods()
  }, [])

  // Filter foods based on search term
  const filteredFoods = foods.filter(food => 
    food.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading foods...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Foods</h1>
              <p className="mt-2 text-gray-600">Manage all food items and menu items</p>
            </div>
            <Link
              to="/create/food"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Food
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

        {/* Foods List */}
        <div className="card">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No foods found' : 'No foods yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Get started by creating your first food item'}
              </p>
              {!searchTerm && (
                <Link
                  to="/create/food"
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Food
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <div key={food.id || food.foodId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{food.name}</h3>
                      <div className="flex items-center mt-1">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-lg font-bold text-green-600">${food.price}</span>
                      </div>
                    </div>
                    {food.foodImage && (
                      <div className="ml-4">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Utensils className="h-4 w-4 mr-1" />
                    Food ID: {food.foodId || food.id}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {food.foodImage ? 'Has image' : 'No image'}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
