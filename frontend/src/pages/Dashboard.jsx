import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { Utensils, ShoppingCart, Table, TrendingUp, FileText, BarChart3, Trophy, Plus, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    menus: 0,
    foods: 0,
    tables: 0,
    orders: 0,
    invoices: 0,
    todaySales: 0
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [bestSellers, setBestSellers] = useState([])

  const fetchBestSellers = async () => {
    try {
      const response = await get('/api/v1/invoices')
      const invoicesData = response.invoices || response || []
      const foodSalesMap = new Map()

      invoicesData.forEach(invoice => {
        const foodItems = invoice.foodItems || invoice.food_items || invoice.orderDetails || []

        foodItems.forEach(item => {
          const foodName = item.foodName || item.name || 'Menu item'
          const quantity = parseInt(item.quantity) || 1
          const price = parseFloat(item.price) || 0
          const total = quantity * price

          if (foodSalesMap.has(foodName)) {
            const existing = foodSalesMap.get(foodName)
            existing.quantity += quantity
            existing.totalAmount += total
          } else {
            foodSalesMap.set(foodName, { foodName, quantity, price, totalAmount: total })
          }
        })
      })

      setBestSellers(
        Array.from(foodSalesMap.values())
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .slice(0, 5)
      )
    } catch (err) {
      console.error('Error fetching best sellers:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const [menusRes, foodsRes, tablesRes, ordersRes, invoicesRes] = await Promise.all([
        get('/api/v1/menus'),
        get('/api/v1/foods'),
        get('/api/v1/tables'),
        get('/api/v1/orders'),
        get('/api/v1/invoices')
      ])

      const menusCount = menusRes?.menus?.length || menusRes?.totalCount || menusRes?.length || 0
      const foodsCount = foodsRes?.foodItems?.length || foodsRes?.totalCount || foodsRes?.length || 0
      const tablesCount = tablesRes?.tables?.length || tablesRes?.totalCount || tablesRes?.length || 0
      const ordersCount = ordersRes?.orders?.length || ordersRes?.totalCount || ordersRes?.length || 0
      const invoicesCount = invoicesRes?.invoices?.length || invoicesRes?.totalCount || invoicesRes?.length || 0

      const today = new Date().toISOString().split('T')[0]
      const invoicesData = invoicesRes?.invoices || invoicesRes || []
      const todaySales = invoicesData
        .filter(invoice => {
          const rawDate = invoice.createdAt || invoice.created_at || invoice.orderDate
          return rawDate && new Date(rawDate).toISOString().split('T')[0] === today
        })
        .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount || invoice.total_amount || 0), 0)

      setStats({
        menus: menusCount,
        foods: foodsCount,
        tables: tablesCount,
        orders: ordersCount,
        invoices: invoicesCount,
        todaySales
      })

      await fetchBestSellers()

      setChartData([
        { name: 'Mon', orders: 12, revenue: 2400 },
        { name: 'Tue', orders: 19, revenue: 3800 },
        { name: 'Wed', orders: 15, revenue: 3000 },
        { name: 'Thu', orders: 25, revenue: 5000 },
        { name: 'Fri', orders: 30, revenue: 6000 },
        { name: 'Sat', orders: 35, revenue: 7000 },
        { name: 'Sun', orders: 28, revenue: 5600 }
      ])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const metrics = [
    { name: 'Menus', value: stats.menus, icon: Utensils, href: '/menus' },
    { name: 'Foods', value: stats.foods, icon: ShoppingCart, href: '/foods' },
    { name: 'Tables', value: stats.tables, icon: Table, href: '/tables' },
    { name: 'Orders', value: stats.orders, icon: FileText, href: '/orders' },
    { name: 'Invoices', value: stats.invoices, icon: BarChart3, href: '/invoices' },
    { name: 'Today Sales', value: `$${stats.todaySales.toFixed(2)}`, icon: TrendingUp, href: '/sales-details' }
  ]

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
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">A simple overview of orders, inventory, and sales.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/menu-with-foods" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Order Food
          </Link>
          <Link to="/summary-report" className="btn btn-secondary">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(metric => {
          const Icon = metric.icon
          return (
            <Link key={metric.name} to={metric.href} className="metric-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{metric.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{metric.value}</p>
                </div>
                <div className="rounded-md bg-slate-100 p-2 text-slate-600 group-hover:bg-slate-900 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Weekly Activity</h2>
              <p className="text-sm text-slate-500">Orders and revenue trend</p>
            </div>
            <Link to="/sales-reports" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              View reports
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="orders" fill="#0f172a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Best Sellers</h2>
              <p className="text-sm text-slate-500">Top menu items</p>
            </div>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>

          {bestSellers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">No sales data yet</p>
              <p className="mt-1 text-sm text-slate-500">New orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((item, index) => (
                <div key={item.foodName} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                      <p className="truncate text-sm font-medium text-slate-900">{item.foodName}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.quantity} sold</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">${item.totalAmount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          <Link to="/sales-details" className="mt-4 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-950">
            Sales details
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
