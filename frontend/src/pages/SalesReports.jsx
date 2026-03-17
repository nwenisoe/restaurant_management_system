import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { get, post } from '../api/client'
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react'

export default function SalesReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await get('/api/v1/sales-reports')
        const reportsData = response.reports || response || []
        console.log('Sales reports data received:', reportsData)
        setReports(reportsData)
      } catch (err) {
        console.error('Error fetching sales reports:', err)
        setError(`Failed to load sales reports: ${err.response?.data?.error || err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const handleGenerateReport = async () => {
    if (!selectedDate) {
      setError('Please select a date to generate report')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await post(`/api/v1/sales-reports/daily?date=${selectedDate}`, {})
      console.log('Sales report generated:', response)
      
      // Refresh reports list
      const reportsResponse = await get('/api/v1/sales-reports')
      const reportsData = reportsResponse.reports || reportsResponse || []
      setReports(reportsData)
      
      setSelectedDate('')
    } catch (err) {
      console.error('Error generating sales report:', err)
      setError(`Failed to generate sales report: ${err.response?.data?.error || err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
              <p className="mt-2 text-gray-600">Daily sales analysis and reporting</p>
            </div>
          </div>
        </div>

        {/* Generate Report Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Daily Report</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Report Date
              </label>
              <input
                type="date"
                id="reportDate"
                className="input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={generating || !selectedDate}
              className="btn btn-primary flex items-center"
            >
              {generating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
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

        {/* Reports List */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales reports yet</h3>
              <p className="text-gray-500 mb-6">
                Generate your first daily sales report using the form above
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Sales Report - {new Date(report.reportDate).toLocaleDateString()}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created: {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <div className="bg-green-100 rounded-full p-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-emerald-600 mr-3" />
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Total Sales</p>
                          <p className="text-2xl font-bold text-emerald-900">${report.totalSales.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Total Orders</p>
                          <p className="text-2xl font-bold text-green-900">{report.totalOrders}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Food Items</p>
                          <p className="text-2xl font-bold text-purple-900">{report.foodSales.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Food Sales Breakdown:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Food Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity Sold
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Sales
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.foodSales.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.foodName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.totalQuantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                ${item.totalSales.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
