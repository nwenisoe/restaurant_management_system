import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { Utensils, ShoppingCart, Table, Receipt, TrendingUp, Users, FileText, BarChart3, Trophy, Star } from 'lucide-react'
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
  const [bestSellers, setBestSellers] = useState([])

  const statCards = [
    { name: 'Menu Items', value: stats.menus, icon: Utensils, color: 'bg-blue-500', link: '/menus' },
    { name: '🍽️ Order Food', value: 'Browse Menu', icon: ShoppingCart, color: 'bg-gradient-to-r from-green-500 to-emerald-600', link: '/menu-with-foods', featured: true },
    { name: 'Foods', value: stats.foods, icon: ShoppingCart, color: 'bg-green-500', link: '/foods' },
    { name: 'Tables', value: stats.tables, icon: Table, color: 'bg-yellow-500', link: '/tables' },
    { name: 'Summary Report', value: 'View Report', icon: BarChart3, color: 'bg-purple-500', link: '/summary-report' },
    { name: 'Invoices', value: stats.invoices, icon: FileText, color: 'bg-indigo-500', link: '/invoices' },
    { name: 'Today Sales', value: `$${stats.todaySales.toFixed(2)}`, icon: TrendingUp, color: 'bg-green-600', link: '/sales-details' },
  ]

  const pieData = [
    { name: 'Menu Items', value: stats.menus, color: '#3b82f6' },
    { name: 'Foods', value: stats.foods, color: '#10b981' },
    { name: 'Tables', value: stats.tables, color: '#f59e0b' },
    { name: 'Orders', value: stats.orders, color: '#8b5cf6' },
    { name: 'Invoices', value: stats.invoices, color: '#6366f1' },
  ]

  // Fetch best sellers data
  const fetchBestSellers = async () => {
    try {
      const response = await get('/api/v1/public-invoices')
      const invoicesData = response.invoices || response || []
      
      // Aggregate sales by food item
      const foodSalesMap = new Map()
      
      invoicesData.forEach(invoice => {
        const foodItems = invoice.foodItems || invoice.food_items || invoice.orderDetails || []
        
        foodItems.forEach(item => {
          const foodName = item.foodName || item.name || `Food Item ${Math.random().toString(36).substr(2, 9)}`
          const quantity = parseInt(item.quantity) || 1
          const price = parseFloat(item.price) || 0
          const total = quantity * price
          
          if (foodSalesMap.has(foodName)) {
            const existing = foodSalesMap.get(foodName)
            existing.quantity += quantity
            existing.totalAmount += total
          } else {
            foodSalesMap.set(foodName, {
              foodName,
              quantity,
              price,
              totalAmount: total
            })
          }
        })
      })

      // Convert to array, sort by total amount (highest first), and take top 10
      const topSellers = Array.from(foodSalesMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          displayName: item.foodName.length > 15 ? item.foodName.substring(0, 15) + '...' : item.foodName
        }))
      
      setBestSellers(topSellers)
      console.log('Top 10 Best Sellers:', topSellers)
      
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

      // Debug logging to see the actual response structure
      console.log('API Responses:', {
        menus: menusRes,
        foods: foodsRes,
        tables: tablesRes,
        orders: ordersRes,
        invoices: invoicesRes
      })

      // Extract counts with fallbacks
      const menusCount = menusRes?.menus?.length || menusRes?.totalCount || menusRes?.length || 0
      const foodsCount = foodsRes?.foodItems?.length || foodsRes?.totalCount || foodsRes?.length || 0
      const tablesCount = tablesRes?.tables?.length || tablesRes?.totalCount || tablesRes?.length || 0
      const ordersCount = ordersRes?.orders?.length || ordersRes?.totalCount || ordersRes?.length || 0
      const invoicesCount = invoicesRes?.invoices?.length || invoicesRes?.totalCount || invoicesRes?.length || 0

      // Get today's sales from invoices
      const today = new Date().toISOString().split('T')[0]
      let todaySales = 0
      try {
        const invoicesData = invoicesRes?.invoices || invoicesRes || []
        const todayInvoices = invoicesData.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt || invoice.created_at).toISOString().split('T')[0]
          return invoiceDate === today
        })
          
          todaySales = todayInvoices.reduce((sum, invoice) => {
            return sum + parseFloat(invoice.totalAmount || invoice.total_amount || 0)
          }, 0)
          
          console.log('Today sales calculation:', { todayInvoices: todayInvoices.length, todaySales })
        } catch (err) {
          console.error('Error calculating today sales:', err)
        }

        setStats({
          menus: menusCount,
          foods: foodsCount,
          tables: tablesCount,
          orders: ordersCount,
          invoices: invoicesCount,
          todaySales: todaySales
        })

        console.log('Final stats:', {
          menus: menusCount,
          foods: foodsCount,
          tables: tablesCount,
          orders: ordersCount,
          invoices: invoicesCount,
          todaySales: todaySales
        })

        // Fetch best sellers data
        await fetchBestSellers()

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

  useEffect(() => {
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
          const isFeatured = stat.featured
          
          return (
            <Link 
              key={stat.name} 
              to={stat.link} 
              className={`card hover:shadow-lg transition-all duration-300 ${
                isFeatured 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-md hover:shadow-xl hover:scale-105' 
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${isFeatured ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg' : stat.color}`}>
                  <Icon className={`h-6 w-6 text-white ${isFeatured ? 'animate-pulse' : ''}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isFeatured ? 'text-green-800 font-bold' : 'text-gray-600'}`}>
                    {stat.name}
                  </p>
                  <p className={`text-2xl font-bold ${isFeatured ? 'text-green-600' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  {isFeatured && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      🌟 Start Ordering Now
                    </p>
                  )}
                </div>
              </div>
              {isFeatured && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    POPULAR
                  </span>
                </div>
              )}
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

        {/* Top 10 Best Sellers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Top 10 Best Sellers
            </h2>
            <Link
              to="/sales-details"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Details →
            </Link>
          </div>
          
          {bestSellers.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sales data available</p>
              <p className="text-sm text-gray-400 mt-2">Start placing orders to see best sellers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Best Sellers Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestSellers} margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Total Revenue']}
                      labelFormatter={(label) => `Food: ${label}`}
                    />
                    <Bar 
                      dataKey="totalAmount" 
                      fill="#f59e0b" 
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Top 3 List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {bestSellers.slice(0, 3).map((item, index) => (
                  <div key={item.foodName} className={`text-center p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                    'bg-orange-50 border-2 border-orange-300'
                  }`}>
                    <div className="text-2xl mb-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {item.foodName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.quantity} units sold
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ${item.totalAmount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Full List */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Complete Ranking</h3>
                <div className="space-y-2">
                  {bestSellers.map((item, index) => (
                    <div key={item.foodName} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 text-center font-bold text-gray-600">
                          #{item.rank}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.foodName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.quantity} units × ${item.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ${item.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((item.totalAmount / bestSellers.reduce((sum, s) => sum + s.totalAmount, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
