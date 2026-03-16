import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { Utensils, ShoppingCart, Table, Receipt, TrendingUp, Users, FileText, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    menus: 0,
    foods: 0,
    tables: 0,
    orders: 0,
    invoices: 0,
    vouchers: 0,
    todaySales: 0
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  const statCards = [
    { name: 'Menu Items', value: stats.menus, icon: Utensils, color: 'bg-blue-500', link: '/menus' },
    { name: 'Foods', value: stats.foods, icon: ShoppingCart, color: 'bg-green-500', link: '/foods' },
    { name: 'Tables', value: stats.tables, icon: Table, color: 'bg-yellow-500', link: '/tables' },
    { name: 'Orders', value: stats.orders, icon: Receipt, color: 'bg-purple-500', link: '/orders' },
    { name: 'Invoices', value: stats.invoices, icon: FileText, color: 'bg-indigo-500', link: '/invoices' },
    { name: 'Today Sales', value: `$${stats.todaySales.toFixed(2)}`, icon: TrendingUp, color: 'bg-green-600', link: '/sales-reports' },
  ]

  const pieData = [
    { name: 'Menu Items', value: stats.menus, color: '#3b82f6' },
    { name: 'Foods', value: stats.foods, color: '#10b981' },
    { name: 'Tables', value: stats.tables, color: '#f59e0b' },
    { name: 'Orders', value: stats.orders, color: '#8b5cf6' },
    { name: 'Invoices', value: stats.invoices, color: '#6366f1' },
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [menusRes, foodsRes, tablesRes, ordersRes, invoicesRes] = await Promise.all([
          get('/api/v1/menus'),
          get('/api/v1/foods'),
          get('/api/v1/tables'),
          get('/api/v1/orders'),
          get('/api/v1/invoices')
        ])

        // Get today's sales
        const today = new Date().toISOString().split('T')[0]
        let todaySales = 0
        try {
          const salesRes = await get(`/api/v1/sales-reports/daily?date=${today}`)
          todaySales = salesRes.totalSales || 0
        } catch (err) {
          // No sales report for today, that's okay
        }

        setStats({
          menus: menusRes.totalCount || menusRes.length || 0,
          foods: foodsRes.totalCount || foodsRes.length || 0,
          tables: tablesRes.totalCount || tablesRes.length || 0,
          orders: ordersRes.totalCount || ordersRes.length || 0,
          invoices: invoicesRes.totalCount || invoicesRes.length || 0,
          todaySales: todaySales
        })

        setChartData([
          { name: 'Mon', orders: 12, revenue: 2400 },
          { name: 'Tue', orders: 19, revenue: 3800 },
          { name: 'Wed', orders: 15, revenue: 3000 },
          { name: 'Thu', orders: 25, revenue: 5000 },
          { name: 'Fri', orders: 30, revenue: 6000 },
          { name: 'Sat', orders: 35, revenue: 7000 },
          { name: 'Sun', orders: 28, revenue: 5600 },
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to your restaurant management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.name} to={stat.link} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Orders & Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#3b82f6" />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn btn-primary">New Order</button>
          <button className="btn btn-secondary">Add Menu Item</button>
          <button className="btn btn-secondary">Reserve Table</button>
          <button className="btn btn-secondary">Generate Invoice</button>
        </div>
      </div>
    </div>
  )
}
