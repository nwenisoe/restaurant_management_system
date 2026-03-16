import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { ArrowLeft, Calendar, TrendingUp, DollarSign, BarChart3, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function SummaryReport() {
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [totalMonthlyAmount, setTotalMonthlyAmount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [chartType, setChartType] = useState('bar') // 'bar' or 'line'

  useEffect(() => {
    fetchMonthlyData(currentMonth)
  }, [currentMonth])

  const fetchMonthlyData = async (month) => {
    try {
      setLoading(true)
      
      // Fetch all invoices
      const response = await get('/api/v1/public-invoices')
      const invoicesData = response.invoices || response || []
      
      // Get the year and month from the selected date
      const year = month.getFullYear()
      const monthIndex = month.getMonth()
      
      // Filter invoices for the selected month
      const monthlyInvoices = invoicesData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.created_at)
        return invoiceDate.getFullYear() === year && invoiceDate.getMonth() === monthIndex
      })

      // Group by day and calculate totals
      const dailyTotals = new Map()
      
      monthlyInvoices.forEach(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.created_at)
        const day = invoiceDate.getDate()
        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        const totalAmount = parseFloat(invoice.totalAmount || invoice.total_amount || 0)
        
        if (dailyTotals.has(dateKey)) {
          const existing = dailyTotals.get(dateKey)
          existing.totalAmount += totalAmount
          existing.orderCount += 1
        } else {
          dailyTotals.set(dateKey, {
            date: dateKey,
            day: day,
            totalAmount: totalAmount,
            orderCount: 1
          })
        }
      })

      // Convert to array and sort by date
      const monthlyArray = Array.from(dailyTotals.values()).sort((a, b) => a.day - b.day)
      
      // Fill in missing days with zero values
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      const completeMonthlyData = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const existingData = monthlyArray.find(item => item.day === day)
        
        completeMonthlyData.push({
          date: dateKey,
          day: day,
          totalAmount: existingData ? existingData.totalAmount : 0,
          orderCount: existingData ? existingData.orderCount : 0,
          dayName: new Date(year, monthIndex, day).toLocaleDateString('en-US', { weekday: 'short' })
        })
      }
      
      setMonthlyData(completeMonthlyData)
      
      // Calculate monthly totals
      const monthlyTotal = completeMonthlyData.reduce((sum, day) => sum + day.totalAmount, 0)
      const monthlyOrderCount = completeMonthlyData.reduce((sum, day) => sum + day.orderCount, 0)
      
      setTotalMonthlyAmount(monthlyTotal)
      setTotalOrders(monthlyOrderCount)
      
    } catch (err) {
      console.error('Error fetching monthly data:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Day', 'Total Amount', 'Order Count'],
      ...monthlyData.map(day => [
        day.date,
        day.dayName,
        day.totalAmount.toFixed(2),
        day.orderCount
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-report-${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Summary Report</h1>
              <p className="mt-2 text-gray-600">Monthly sales breakdown by day</p>
            </div>
            
            {/* Month Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {getMonthName(currentMonth)}
                </span>
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={exportToCSV}
                className="btn btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalMonthlyAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalMonthlyAmount / monthlyData.filter(day => day.totalAmount > 0).length || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Daily Sales - {getMonthName(currentMonth)}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartType === 'line' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Line Chart
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
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
                    formatter={(value) => [formatCurrency(value), 'Total Sales']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalAmount" 
                    fill="#8b5cf6" 
                    name="Daily Sales"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
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
                    formatter={(value) => [formatCurrency(value), 'Total Sales']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalAmount" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Daily Sales"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
            
            {/* Quick Stats Below Chart */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {monthlyData.filter(day => day.totalAmount > 0).length}
                </div>
                <div className="text-sm text-gray-600">Active Days</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(Math.max(...monthlyData.map(d => d.totalAmount)))}
                </div>
                <div className="text-sm text-gray-600">Best Day</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalMonthlyAmount / monthlyData.length)}
                </div>
                <div className="text-sm text-gray-600">Daily Average</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((day) => (
                  <tr key={day.date} className={day.totalAmount > 0 ? 'hover:bg-gray-50' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${day.totalAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {formatCurrency(day.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.orderCount > 0 ? formatCurrency(day.totalAmount / day.orderCount) : '$0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    {formatCurrency(totalMonthlyAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {totalOrders}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {totalOrders > 0 ? formatCurrency(totalMonthlyAmount / totalOrders) : '$0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
