import React, { useState, useEffect } from 'react'
import { get, del } from '../api/client'
import { Plus, Trash2, Search, Filter, Calendar, Tag, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const menuImages = {
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80',
  Lunch: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80',
  Dinner: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80',
  Drinks: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
  Dessert: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80',
  Default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
}

export default function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

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

  const handleDelete = async (id) => {
    try {
      await del(`/api/v1/menus/${id}`)
      setItems(items.filter(item => item.menuId !== id))
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))]

  const formatDate = (dateString) => {
    if (!dateString) return 'Open schedule'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Menus</h1>
          <p className="page-subtitle">Organize restaurant offerings by service time and category.</p>
        </div>
        <Link to="/create/menu" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          New Menu
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search menus..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              className="input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Tag className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-950">No menus found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || filterCategory !== 'all'
              ? 'Try a different search or category.'
              : 'Create a menu to start grouping foods.'}
          </p>
          {!searchTerm && filterCategory === 'all' && (
            <Link to="/create/menu" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New Menu
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const image = menuImages[item.category] || menuImages.Default
            return (
              <article key={item.menuId || item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
                <div className="relative h-40">
                  <img src={image} alt={item.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="inline-flex rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-800">
                      {item.category}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        Starts
                      </div>
                      <p className="mt-1 font-medium text-slate-950">{formatDate(item.startDate)}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        Ends
                      </div>
                      <p className="mt-1 font-medium text-slate-950">{formatDate(item.endDate)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link to="/foods" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950">
                      View foods
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setItemToDelete(item)
                        setShowDeleteModal(true)
                      }}
                      className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-950">Delete menu?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will delete "{itemToDelete?.name}". This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(itemToDelete.menuId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
