import React, { useState, useEffect } from 'react'
import { get, del } from '../api/client'
import { Plus, Edit2, Trash2, Search, Filter, Calendar, Tag, Grid, List, Clock, TrendingUp, Star, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name') // 'name', 'category', 'date'
  const [expandedMenus, setExpandedMenus] = useState(new Set()) // Track expanded menus
  const [foods, setFoods] = useState({}) // Store foods for each menu

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      const data = await get('/api/v1/menus')
      setItems(data.menus || data || [])
    } catch (error) {
      console.error('Error fetching menus:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFoodsForMenu = async (menuId) => {
    try {
      const data = await get(`/api/v1/foods?menuId=${menuId}`)
      setFoods(prev => ({ ...prev, [menuId]: data.foods || data || [] }))
    } catch (error) {
      console.error('Error fetching foods:', error)
    }
  }

  const toggleMenuExpansion = (menuId) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
      // Fetch foods when expanding
      if (!foods[menuId]) {
        fetchFoodsForMenu(menuId)
      }
    }
    setExpandedMenus(newExpanded)
  }

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/menus/${id}`)
      setItems(items.filter(item => (item.menuId || item.id) !== id))
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        default:
          return 0
      }
    })

    return filtered
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

  const getStatusColor = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'bg-blue-100 text-blue-800'
    if (now > end) return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  const getItemId = (item) => {
  return item.menuId || item.id || item._id
}

  const getStatusText = (startDate, endDate) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (now < start) return 'Upcoming'
    if (now > end) return 'Expired'
    return 'Active'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading menu items...</p>
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
                <Tag className="h-6 w-6 text-white" />
              </div>
              Menu Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu items efficiently</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(item => {
                  const now = new Date()
                  const start = new Date(item.startDate)
                  const end = new Date(item.endDate)
                  return now >= start && now <= end
                }).length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <Link to="/create/menu" className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4" />
              Add Menu Item
            </Link>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg border border-emerald-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search menu items by name or category..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="date">Date Created</option>
            </select>
          </div>

          <div className="flex items-center bg-gradient-to-r from-emerald-100 to-teal-200 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-600 hover:bg-white'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-600 hover:bg-white'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Tag className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first menu item'}
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <Link to="/create/menu" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Menu Item
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const itemId = getItemId(item)
                const isExpanded = expandedMenus.has(itemId)
                const menuFoods = foods[itemId] || []
                
                return (
                  <div key={itemId} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => toggleMenuExpansion(itemId)}
                          >
                            <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(item.startDate, item.endDate)} shadow-sm`}>
                            <Clock className="h-3 w-3 mr-1.5" />
                            {getStatusText(item.startDate, item.endDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/edit/menu/${itemId}`}
                            className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                            title="Edit Menu"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
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
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Start: {formatDate(item.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium">End: {formatDate(item.endDate)}</span>
                        </div>
                      </div>

                      {/* Foods Section */}
                      {isExpanded && menuFoods.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Tag className="h-4 w-4 text-emerald-500" />
                              Foods ({menuFoods.length})
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {menuFoods.map((food) => (
                                <div key={food.id || food._id} className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      {/* Food Image */}
                                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {food.foodImage ? (
                                          <img 
                                            src={food.foodImage} 
                                            alt={food.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/48x48?text=No+Img'
                                            }}
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <div className="font-medium text-gray-900 text-sm">{food.name}</div>
                                        <div className="text-xs text-gray-600">Price: ${food.price || '0.00'}</div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {food.category && (
                                        <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                                          {food.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Created {formatDate(item.createdAt)}
                        </div>
                        {item.updatedAt && (
                          <div className="text-xs text-emerald-600 font-medium">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={getItemId(item)} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">Created {formatDate(item.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{item.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.startDate, item.endDate)}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {getStatusText(item.startDate, item.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <div>{formatDate(item.startDate)} - {formatDate(item.endDate)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/edit/menu/${getItemId(item)}`}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setItemToDelete(item)
                                setShowDeleteModal(true)
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Menu Item</h3>
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
