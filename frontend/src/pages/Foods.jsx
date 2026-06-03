import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { Plus, Utensils, DollarSign, AlertCircle, Search, ImageOff } from 'lucide-react'

const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'

export default function Foods() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await get('/api/v1/foods')
        setFoods(response.foodItems || response || [])
      } catch (err) {
        console.error('Error fetching foods:', err)
        setError(`Failed to load foods: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchFoods()
  }, [])

  const filteredFoods = foods.filter(food =>
    food.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.foodId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.menuId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const averagePrice = foods.length
    ? foods.reduce((sum, food) => sum + Number(food.price || 0), 0) / foods.length
    : 0

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="page-surface">
      <div className="page-header">
        <div>
          <h1 className="page-title">Foods</h1>
          <p className="page-subtitle">Food catalog with pricing, menu grouping, and photos.</p>
        </div>
        <Link to="/create/food" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          New Food
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Food Items</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{foods.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Average Price</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">${averagePrice.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">With Images</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {foods.filter(food => food.foodImage).length}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {filteredFoods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Utensils className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-950">
            {searchTerm ? 'No foods found' : 'No foods yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm ? 'Try another search term.' : 'Add your first food item with a price and image.'}
          </p>
          {!searchTerm && (
            <Link to="/create/food" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New Food
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredFoods.map((food) => (
            <article key={food.id || food.foodId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
              <div className="relative aspect-[4/3] bg-slate-100">
                {food.foodImage ? (
                  <img
                    src={food.foodImage}
                    alt={food.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = fallbackImage
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImageOff className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-3 top-3 rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-slate-950 shadow-sm">
                  ${Number(food.price || 0).toFixed(2)}
                </div>
              </div>

              <div className="p-4">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-950">{food.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Utensils className="h-4 w-4" />
                  <span className="truncate">Menu: {food.menuId || 'Unassigned'}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1 text-sm font-medium text-teal-700">
                    <DollarSign className="h-4 w-4" />
                    {Number(food.price || 0).toFixed(2)}
                  </div>
                  <span className="text-xs text-slate-400">{food.foodId || food.id}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
