import React, { useState, useEffect } from 'react'
import { get, del } from '../api/client'
import { Plus, Edit2, Trash2, Search, Filter, Grid, List, Users, Table2, X, Eye, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Tables() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('number') // 'number', 'capacity', 'status'

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const data = await get('/api/v1/tables')
      setItems(data.tables || data || [])
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.tableNumber?.toString().includes(searchTerm.toLowerCase()) ||
                           item.numberOfGuests?.toString().includes(searchTerm.toLowerCase()) ||
                           item.status?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesStatus
    })

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return (a.tableNumber || 0) - (b.tableNumber || 0)
        case 'capacity':
          return (b.numberOfGuests || 0) - (a.numberOfGuests || 0)
        case 'status':
          return (a.status || '').localeCompare(b.status || '')
        default:
          return 0
      }
    })

    return filtered
  }

  const getItemId = (item) => {
    return item.tableId || item.id || item._id
  }

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/tables/${id}`)
      setItems(items.filter(item => getItemId(item) !== id))
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting table:', error)
    }
  }

  const filteredItems = getFilteredAndSortedItems()
  const statuses = [...new Set(items.map(item => item.status).filter(Boolean))]

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'occupied':
        return 'bg-red-100 text-red-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />
      case 'occupied':
        return <XCircle className="h-3 w-3" />
      case 'reserved':
        return <Clock className="h-3 w-3" />
      default:
        return <Table2 className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading tables...</p>
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
                <Table2 className="h-6 w-6 text-white" />
              </div>
              Table Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your restaurant seating efficiently</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-gray-900">{items.length}</div>
              <div className="text-sm text-gray-500">Total Tables</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-orange-600">
                {items.reduce((sum, item) => sum + (parseInt(item.numberOfGuests) || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total Seats</div>
            </div>
            <div className="text-center bg-white rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(item => item.status === 'available').length}
              </div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            <Link to="/create/table" className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="h-4 w-4" />
              Add Table
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
              placeholder="Search tables by number, capacity, or status..."
              className="w-full pl-10 pr-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Sort:</label>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="number">Table Number</option>
              <option value="capacity">Capacity</option>
              <option value="status">Status</option>
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

      {/* Table Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Table2 className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first table'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link to="/create/table" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Table
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const itemId = getItemId(item)
                
                return (
                  <div key={itemId} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Table2 className="h-5 w-5 text-orange-500" />
                            Table #{item.tableNumber}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-gray-700">{item.numberOfGuests} Guests</span>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(item.status)} shadow-sm`}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1.5">{item.status || 'Available'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                            title="View Table"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 transform hover:scale-110"
                            title="Edit Table"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
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
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="font-medium">ID: {itemId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Table2 className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Capacity: {item.numberOfGuests} seats</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Created: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {item.updatedAt && (
                            <span>Updated {formatDate(item.updatedAt)}</span>
                          )}
                        </div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status || 'Available'}</span>
                        </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const itemId = getItemId(item)
                      
                      return (
                        <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <Table2 className="h-4 w-4 text-orange-500" />
                              #{item.tableNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{item.numberOfGuests} guests</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1">{item.status || 'Available'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{itemId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="View"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Table</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<span className="font-medium text-gray-900">Table #{itemToDelete?.tableNumber}</span>"? This action cannot be undone.
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
                  Delete Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
