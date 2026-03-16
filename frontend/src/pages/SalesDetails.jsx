import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Package, BarChart3 } from 'lucide-react'

export default function SalesDetails() {
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalQuantity, setTotalQuantity] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchSalesDetails(selectedDate)
  }, [selectedDate])

  const fetchSalesDetails = async (date) => {
    try {
      setLoading(true)
      
      // Fetch today's invoices
      const response = await get('/api/v1/public-invoices')
      const invoicesData = response.invoices || response || []
      
      // Filter invoices for the selected date
      const selectedDateInvoices = invoicesData.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.created_at).toISOString().split('T')[0]
        return invoiceDate === date
      })

      // Aggregate sales by food item
      const foodSalesMap = new Map()
      
      selectedDateInvoices.forEach(invoice => {
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

      // Convert to array and sort by total amount (highest first)
      const salesArray = Array.from(foodSalesMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
      
      setSalesData(salesArray)
      
      // Calculate totals
      const total = salesArray.reduce((sum, item) => sum + item.totalAmount, 0)
      const quantity = salesArray.reduce((sum, item) => sum + item.quantity, 0)
      
      setTotalAmount(total)
      setTotalQuantity(quantity)
      
    } catch (err) {
      console.error('Error fetching sales details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales details...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Details</h1>
              <p className="mt-2 text-gray-600">Detailed breakdown of food sales</p>
            </div>
            
            {/* Date Selector */}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalQuantity}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Different Food Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {salesData.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Details Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Food Sales Breakdown</h2>
          </div>
          
          {salesData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sales data available for {selectedDate}</p>
              <p className="text-sm text-gray-400 mt-2">Try selecting a different date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Food Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesData.map((item, index) => {
                    const percentage = totalAmount > 0 ? (item.totalAmount / totalAmount * 100) : 0
                    return (
                      <tr key={item.foodName} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            {index > 2 && <span className="text-gray-500">#{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.foodName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.quantity}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${item.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ${item.totalAmount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performers */}
        {salesData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Seller</h3>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 mb-2">{salesData[0].foodName}</p>
                <p className="text-gray-600">
                  {salesData[0].quantity} units sold
                </p>
                <p className="text-sm text-gray-500">
                  ${salesData[0].totalAmount.toFixed(2)} revenue
                </p>
              </div>
            </div>

            {salesData.length > 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🥈 Second Place</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 mb-2">{salesData[1].foodName}</p>
                  <p className="text-gray-600">
                    {salesData[1].quantity} units sold
                  </p>
                  <p className="text-sm text-gray-500">
                    ${salesData[1].totalAmount.toFixed(2)} revenue
                  </p>
                </div>
              </div>
            )}

            {salesData.length > 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🥉 Third Place</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 mb-2">{salesData[2].foodName}</p>
                  <p className="text-gray-600">
                    {salesData[2].quantity} units sold
                  </p>
                  <p className="text-sm text-gray-500">
                    ${salesData[2].totalAmount.toFixed(2)} revenue
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
