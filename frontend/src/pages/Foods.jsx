import React, { useState, useEffect } from 'react'
import { get, del, put } from '../api/client'
import { Plus, Edit2, Trash2, Search, Filter, Calendar, Tag, Grid, List, Clock, TrendingUp, Star, Eye, ChevronDown, ChevronRight, X, DollarSign, Utensils, Image as ImageIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Foods() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name') // 'name', 'category', 'price', 'date'
  const [editingFood, setEditingFood] = useState(null) // Track which food is being edited
  const [editForm, setEditForm] = useState({}) // Store edit form data

  useEffect(() => {
    fetchFoods()
  }, [])

  const fetchFoods = async () => {
    try {
      const data = await get('/api/v1/foods')
      setItems(data.foodItems || data || [])
    } catch (error) {
      console.error('Error fetching foods:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.foodId?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory
      return matchesSearch && matchesCategory
    })

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'price':
          return (a.price || 0) - (b.price || 0)
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        default:
          return 0
      }
    })

    return filtered
  }

  const getItemId = (item) => {
    return item.foodId || item.id || item._id
  }

  const startEdit = (item) => {
    const itemId = getItemId(item)
    setEditingFood(itemId)
    setEditForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description
    })
  }

  const cancelEdit = () => {
    setEditingFood(null)
    setEditForm({})
  }

  const handleUpdate = async (itemId) => {
    try {
      await put(`/api/v1/foods/${itemId}`, editForm)
      // Update the item in the local state
      setItems(items.map(item => {
        const id = getItemId(item)
        if (id === itemId) {
          return {
            ...item,
            ...editForm,
            updatedAt: new Date().toISOString()
          }
        }
        return item
      }))
      setEditingFood(null)
      setEditForm({})
    } catch (error) {
      console.error('Error updating food:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/foods/${id}`)
      setItems(items.filter(item => getItemId(item) !== id))
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting food:', error)
    }
  }

  const filteredItems = getFilteredAndSortedItems()
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading food items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              Food Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your restaurant food items efficiently</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">
                ${items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Value</div>
            </div>
            <Link to="/create/food" className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4" />
              Add Food Item
            </Link>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search food items by name, category, or ID..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Sort:</label>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="price">Price</option>
              <option value="date">Date Created</option>
            </select>
          </div>

          <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-green-600' : 'text-gray-600 hover:bg-white'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-green-600' : 'text-gray-600 hover:bg-white'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Food Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Utensils className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No food items found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first food item'}
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <Link to="/create/food" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Food Item
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const itemId = getItemId(item)
                const isEditing = editingFood === itemId
                
                return (
                  <div key={itemId} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
                    {/* Food Image */}
                    <div className="relative h-40 bg-gray-100">
                      {item.foodImage ? (
                        <img 
                          src={item.foodImage} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs">No Image</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        ${parseFloat(item.price || 0).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                                placeholder="Food name"
                              />
                              <select
                                value={editForm.category || ''}
                                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                              >
                                <option value="">Select category</option>
                                <option value="Appetizers">Appetizers</option>
                                <option value="Main Course">Main Course</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Sides">Sides</option>
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.price || ''}
                                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                                placeholder="Price"
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Tag className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdate(itemId)}
                                className="p-2.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                                title="Save"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(item)}
                              className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                              title="Edit Food"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setItemToDelete(item)
                              setShowDeleteModal(true)
                            }}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {item.description && (
                          <p className="text-sm text-gray-600 italic">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Tag className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">ID: {itemId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Created: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        {item.foodImage && (
                          <div className="text-xs text-gray-400">
                            <ImageIcon className="h-3 w-3 inline mr-1" />
                            Has Image
                          </div>
                        )}
                        {item.updatedAt && (
                          <div className="text-xs text-blue-600 font-medium">
                            Updated {formatDate(item.updatedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const itemId = getItemId(item)
                      const isEditing = editingFood === itemId
                      
                      return (
                        <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              {item.foodImage ? (
                                <img 
                                  src={item.foodImage} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/48x48?text=No+Img'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                placeholder="Food name"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <select
                                value={editForm.category || ''}
                                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              >
                                <option value="">Select category</option>
                                <option value="Appetizers">Appetizers</option>
                                <option value="Main Course">Main Course</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Sides">Sides</option>
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{item.category}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.price || ''}
                                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                placeholder="Price"
                              />
                            ) : (
                              <div className="text-sm font-bold text-green-600">${parseFloat(item.price || 0).toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdate(itemId)}
                                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Save"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                    title="Cancel"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Edit"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setItemToDelete(item)
                                  setShowDeleteModal(true)
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Food Item</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<span className="font-medium text-gray-900">{itemToDelete?.name}</span>"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(getItemId(itemToDelete))}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
