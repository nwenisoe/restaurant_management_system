import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post, patch } from '../api/client'
import { useCart } from '../contexts/CartContext'
import { ArrowLeft, Plus, Minus, ShoppingCart, Search, Utensils, DollarSign, Receipt, Clock, CheckCircle, XCircle } from 'lucide-react'
import SuccessModal from '../components/SuccessModal'

export default function MenuWithFoods() {
  const navigate = useNavigate()
  const [menus, setMenus] = useState([])
  const [foods, setFoods] = useState([])
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [tables, setTables] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [invoices, setInvoices] = useState([])
  const [updatingStatus, setUpdatingStatus] = useState({})
  
  const { items, getTotalItems, getTotalAmount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menusRes, foodsRes, tablesRes] = await Promise.all([
          get('/api/v1/menus'),
          get('/api/v1/foods'),
          get('/api/v1/tables')
        ])
        
        const menusData = menusRes.menus || menusRes || []
        const foodsData = foodsRes.foodItems || foodsRes || []
        const tablesData = tablesRes.tables || tablesRes || []
        
        console.log('Menus data received:', menusData)
        console.log('Foods data received:', foodsData)
        console.log('Tables data received:', tablesData)
        
        setMenus(menusData)
        setFoods(foodsData)
        setTables(tablesData)
        
        // Select first menu by default
        if (menusData.length > 0) {
          setSelectedMenu(menusData[0])
        }
        
        // Select first table by default
        if (tablesData.length > 0) {
          setSelectedTable(tablesData[0].tableId)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch recent invoices
  const fetchInvoices = async () => {
    try {
      const response = await get('/api/v1/public-invoices')
      const invoicesData = response.invoices || response || []
      
      // Normalize invoice data
      const normalizedInvoices = invoicesData.map(invoice => ({
        ...invoice,
        invoiceId: invoice.invoiceId || invoice._id || invoice.id,
        createdAt: invoice.createdAt || invoice.created_at || new Date(),
        orderDate: invoice.orderDate || invoice.order_date || invoice.createdAt,
        totalAmount: invoice.totalAmount || invoice.total_amount || invoice.total,
        paymentStatus: invoice.paymentStatus || invoice.payment_status || 'PENDING',
        paymentMethod: invoice.paymentMethod || invoice.payment_method,
        tableNumber: invoice.tableNumber || invoice.table_number || 'N/A',
        orderId: invoice.orderId || invoice.order_id || 'N/A',
        foodItems: invoice.foodItems || invoice.food_items || invoice.orderDetails || []
      }))
      
      // Get only the 5 most recent invoices
      const recentInvoices = normalizedInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      
      setInvoices(recentInvoices)
    } catch (err) {
      console.error('Error fetching invoices:', err)
    }
  }

  // Update payment status
  const updatePaymentStatus = async (invoiceId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: true }))
      
      const response = await patch(`/api/v1/public-invoices/${invoiceId}`, {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString()
      })
      
      // Update local state
      setInvoices(prev => prev.map(invoice => 
        invoice.invoiceId === invoiceId 
          ? { 
              ...invoice, 
              paymentStatus: newStatus,
              lastUpdated: new Date().toISOString(),
              ...response.invoice
            }
          : invoice
      ))
    } catch (err) {
      console.error('Error updating payment status:', err)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [invoiceId]: false }))
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return 'bg-yellow-100 text-yellow-800'
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices()
  }, [])

  // Filter foods by selected menu and search term
  const filteredFoods = foods.filter(food => {
    const matchesMenu = !selectedMenu || food.menuId === selectedMenu.menuId
    const matchesSearch = !searchTerm || 
      food.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Debug logging
    if (selectedMenu) {
      console.log('Filtering for menu:', selectedMenu.menuId, selectedMenu.name)
      console.log('Food:', food.name, 'menuId:', food.menuId, 'matches:', matchesMenu)
    }
    
    return matchesMenu && matchesSearch
  })

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (!selectedTable) {
      alert('Please select a table')
      return
    }

    try {
      const orderTime = new Date().toISOString()
      
      // Create order items using the existing CreateOrderItem endpoint
      // This endpoint creates both the order and the order items
      const orderItemsPayload = {
        tableId: selectedTable,
        orderItems: items.map(item => ({
          foodId: item.foodId,
          quantity: item.quantity.toString()
        }))
      }
      
      const orderItemsResponse = await post('/api/v1/orderItems', orderItemsPayload)
      console.log('Order and items created:', orderItemsResponse)

      // Get the created order to find the latest one
      const ordersResponse = await get('/api/v1/orders')
      const orders = ordersResponse.orders || ordersResponse || []
      const latestOrder = orders[orders.length - 1]

      if (latestOrder && latestOrder.orderId) {
        // Generate invoice with payment method and status
        const invoicePayload = {
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus // Use the selected payment status
        }
        
        await post(`/api/v1/orders/${latestOrder.orderId}/invoice`, invoicePayload)
        console.log('Invoice generated for order:', latestOrder.orderId)

        // Clear cart and show success
        clearCart()
        setShowCheckout(false)
        
        // Get selected table details for success message
        const selectedTableDetails = tables.find(t => t.tableId === selectedTable)
        const tableNumber = selectedTableDetails?.tableNumber || selectedTable
        
        // Set success message for modal
        const message = `✅ Order Placed Successfully!

📋 Order Details:
🪑 Table: ${tableNumber}
🕐 Time: ${new Date(orderTime).toLocaleString()}
💳 Payment: ${paymentMethod}
📊 Status: ${paymentStatus}
💰 Total: $${getTotalAmount().toFixed(2)}

🧾 Invoice #INV-${Date.now().toString().slice(-8)} generated successfully!

View your invoice history in the Invoices section.`
        
        setSuccessMessage(message)
        setShowSuccessModal(true)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Failed to place order. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Menu</h1>
              <p className="mt-2 text-gray-600">Browse our delicious menu and place your order</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({getTotalItems()})
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg shadow p-1">
            {menus.map(menu => (
              <button
                key={menu.menuId}
                onClick={() => setSelectedMenu(menu)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedMenu?.menuId === menu.menuId
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Utensils className="h-4 w-4 mr-2" />
                  {menu.name}
                </div>
              </button>
            ))}
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
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Foods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredFoods.map(food => (
            <div key={food.foodId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{food.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Menu: {selectedMenu?.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ${food.price ? food.price.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const item = items.find(i => i.foodId === food.foodId)
                      if (item && item.quantity > 1) {
                        updateQuantity(food.foodId, item.quantity - 1)
                      }
                    }}
                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                    disabled={!items.find(i => i.foodId === food.foodId)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="w-8 text-center font-medium">
                    {items.find(i => i.foodId === food.foodId)?.quantity || 0}
                  </span>
                  
                  <button
                    onClick={() => addToCart(food, selectedMenu)}
                    className="p-2 rounded-md bg-indigo-100 hover:bg-indigo-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => addToCart(food, selectedMenu)}
                  className="btn btn-primary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Shopping Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    ×
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {items.map(item => (
                        <div key={item.foodId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.foodName}</h4>
                            <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => item.quantity > 1 && updateQuantity(item.foodId, item.quantity - 1)}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.foodId, item.quantity + 1)}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.foodId)}
                              className="p-1 rounded hover:bg-red-100 text-red-600 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {items.length > 0 && (
                  <div className="border-t p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowCheckout(true)
                        setShowCart(false)
                      }}
                      className="w-full btn btn-primary flex items-center justify-center"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCheckout(false)} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                {/* Order Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                      <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Select Table</option>
                        {tables.map(table => (
                          <option key={table.tableId} value={table.tableId}>
                            Table {table.tableNumber || table.tableId}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="input w-full"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="input w-full"
                      >
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Order Time: {new Date().toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {items.map(item => (
                    <div key={item.foodId} className="flex justify-between">
                      <span>{item.quantity} × {item.foodName}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 btn btn-primary"
                  >
                    Place Order & Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Recent Invoices Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Recent Invoices
          </h3>
          <Link
            to="/invoices"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No invoices yet</p>
            <p className="text-sm">Create an order to generate your first invoice</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceId} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{invoice.invoiceId}</h4>
                      <div className="flex items-center space-x-2">
                        {/* Payment Status Dropdown */}
                        <div>
                          <small className="text-gray-500">Status:</small>
                          <select
                            value={invoice.paymentStatus || 'PENDING'}
                            onChange={(e) => {
                              const newStatus = e.target.value
                              // Update local state immediately
                              setInvoices(prev => prev.map(inv => 
                                inv.invoiceId === invoice.invoiceId 
                                  ? { ...inv, paymentStatus: newStatus }
                                  : inv
                              ))
                              // Update in backend
                              updatePaymentStatus(invoice.invoiceId, newStatus)
                            }}
                            className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                        
                        {invoice.paymentMethod && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {invoice.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Table {invoice.tableNumber || 'N/A'}</span>
                      <span>${invoice.totalAmount ? invoice.totalAmount.toFixed(2) : '0.00'}</span>
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Order Successful!"
        message={successMessage}
        onConfirm={() => navigate('/invoices')}
      />
    </div>
  )
}
