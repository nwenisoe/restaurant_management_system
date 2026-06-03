import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { Plus, Users, Table2, AlertCircle, Search, Armchair, Sparkles } from 'lucide-react'

export default function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await get('/api/v1/tables')
        setTables(response.tables || response || [])
      } catch (err) {
        console.error('Error fetching tables:', err)
        setError(`Failed to load tables: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [])

  const filteredTables = tables.filter(table =>
    table.tableNumber?.toString().includes(searchTerm.toLowerCase()) ||
    table.numberOfGuests?.toString().includes(searchTerm.toLowerCase())
  )

  const totalSeats = tables.reduce((sum, table) => sum + Number(table.numberOfGuests || 0), 0)

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
          <h1 className="page-title">Tables</h1>
          <p className="page-subtitle">A quick view of seating capacity across the dining room.</p>
        </div>
        <Link to="/create/table" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          New Table
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Tables</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{tables.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Total Seats</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{totalSeats}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-medium text-slate-500">Average Party Size</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {tables.length ? Math.round(totalSeats / tables.length) : 0}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by table number or seats..."
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

      {filteredTables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Table2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-950">
            {searchTerm ? 'No tables found' : 'No tables yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm ? 'Try another search.' : 'Create tables to start planning the dining room.'}
          </p>
          {!searchTerm && (
            <Link to="/create/table" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" />
              New Table
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredTables.map((table, index) => {
            const capacity = Number(table.numberOfGuests || 0)
            const zone = index % 3 === 0 ? 'Window' : index % 3 === 1 ? 'Main floor' : 'Patio'

            return (
              <article key={table.id || table.tableId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
                <div className="relative h-36 bg-slate-900">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.35),transparent_32%),radial-gradient(circle_at_75%_20%,rgba(251,191,36,0.28),transparent_28%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/10">
                      <Table2 className="h-8 w-8 text-white" />
                      <div className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-white/80" />
                      <div className="absolute -bottom-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-white/80" />
                      <div className="absolute -left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/80" />
                      <div className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white/80" />
                    </div>
                  </div>
                  <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-800">
                    {zone}
                  </span>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Table {table.tableNumber}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Users className="h-4 w-4" />
                        {capacity} guests
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Available
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Armchair className="h-3.5 w-3.5" />
                        Seats
                      </div>
                      <p className="mt-1 font-semibold text-slate-950">{capacity}</p>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Sparkles className="h-3.5 w-3.5" />
                        Status
                      </div>
                      <p className="mt-1 font-semibold text-slate-950">Ready</p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
