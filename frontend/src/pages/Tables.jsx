import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { ArrowLeft, Plus, Users, Table2, AlertCircle, Search } from 'lucide-react'

export default function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await get('/api/v1/tables')
        const tablesData = response.tables || response || []
        console.log('Tables data received:', response)
        console.log('Tables extracted:', tablesData)
        setTables(tablesData)
      } catch (err) {
        console.error('Error fetching tables:', err)
        setError(`Failed to load tables: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [])

  // Filter tables based on search term
  const filteredTables = tables.filter(table => 
    table.tableNumber?.toString().includes(searchTerm.toLowerCase()) ||
    table.numberOfGuests?.toString().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
              <p className="mt-2 text-gray-600">Manage restaurant seating capacity</p>
            </div>
            <Link
              to="/create/table"
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Table
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
              placeholder="Search tables..."
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

        {/* Tables List */}
        <div className="card">
          {filteredTables.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Table2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No tables found' : 'No tables yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Get started by creating your first table'}
              </p>
              {!searchTerm && (
                <Link
                  to="/create/table"
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Table
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTables.map((table) => (
                <div key={table.id || table.tableId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-primary-100 rounded-full p-3 mr-4">
                        <Table2 className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Table #{table.tableNumber}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          {table.numberOfGuests} guests
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Available
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {table.tableId || table.id}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Capacity: {table.numberOfGuests} seats
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
