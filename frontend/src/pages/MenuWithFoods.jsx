import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post, patch } from '../api/client'
import { useCart } from '../contexts/CartContext'
import {
  ArrowLeft, Plus, Minus, ShoppingCart, Search, Utensils, DollarSign
} from 'lucide-react'
import SuccessModal from '../components/SuccessModal'

export default function MenuWithFoods() {
  const navigate = useNavigate()

  // ---------------- STATE ----------------
  const [menus, setMenus] = useState([])
  const [foods, setFoods] = useState([])
  const [tables, setTables] = useState([])
  const [selectedMenu, setSelectedMenu] = useState(null)

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const [selectedTable, setSelectedTable] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentStatus, setPaymentStatus] = useState('PAID')

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { items, getTotalItems, getTotalAmount, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [menusRes, foodsRes, tablesRes] = await Promise.all([
        get('/api/v1/menus'),
        get('/api/v1/foods'),
        get('/api/v1/tables')
      ])

      const menusData = menusRes?.menus || menusRes || []
      const foodsData = foodsRes?.foodItems || foodsRes || []
      const tablesData = tablesRes?.tables || tablesRes || []

      setMenus(menusData)
      setFoods(foodsData)
      setTables(tablesData)

      if (menusData.length) setSelectedMenu(menusData[0])
      if (tablesData.length) setSelectedTable(tablesData[0].tableId)

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---------------- FILTER ----------------
  const filteredFoods = foods.filter(food => {
    const matchMenu = !selectedMenu || food.menuId === selectedMenu.menuId
    const matchSearch = food.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchMenu && matchSearch
  })

  // ---------------- CHECKOUT ----------------
  const handleCheckout = async () => {
    if (!items.length) return alert('Cart is empty')
    if (!selectedTable) return alert('Select table')

    try {
      const orderPayload = {
        tableId: selectedTable,
        orderItems: items.map(i => ({
          foodId: i.foodId,
          quantity: String(i.quantity)
        }))
      }

      await post('/api/v1/orderItems', orderPayload)

      const ordersRes = await get('/api/v1/orders')
      const latestOrder = (ordersRes?.orders || []).slice(-1)[0]

      if (!latestOrder?.orderId) throw new Error('Order not found')

      await post(`/api/v1/orders/${latestOrder.orderId}/invoice`, {
        paymentMethod,
        paymentStatus
      })

      showSuccess()
    } catch (err) {
      console.error(err)
      alert('Checkout failed')
    }
  }

  const showSuccess = () => {
    const table = tables.find(t => t.tableId === selectedTable)

    setSuccessMessage(`
✅ Order Successful!

🪑 Table: ${table?.tableNumber || selectedTable}
💳 ${paymentMethod} | ${paymentStatus}
💰 $${getTotalAmount().toFixed(2)}
    `)

    clearCart()
    setShowCheckout(false)
    setShowSuccessModal(true)
  }

  // ---------------- UI ----------------
  if (loading) return <div className="text-center p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <Link to="/" className="flex items-center text-emerald-700 hover:text-emerald-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-emerald-900">Restaurant Menu</h1>
              <p className="mt-2 text-emerald-700">Browse our delicious menu and place your order</p>
            </div>
            
            <button onClick={() => setShowCart(!showCart)} className="relative bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({getTotalItems()})
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MENUS */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg shadow p-1">
            {menus.map(menu => (
              <button
                key={menu.menuId}
                onClick={() => setSelectedMenu(menu)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedMenu?.menuId === menu.menuId
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
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

        {/* SEARCH */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-emerald-400" />
            </div>
            <input
              type="text"
              className="input pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Search foods..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

      {/* FOODS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredFoods.map(food => {
          const qty = items.find(i => i.foodId === food.foodId)?.quantity || 0

          return (
            <div key={food.foodId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              {/* Food Image */}
              <div className="relative h-48 bg-emerald-50">
                {food.foodImage ? (
                  <img 
                    src={food.foodImage} 
                    alt={food.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                    <div className="text-center text-emerald-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No Image</p>
                    </div>
                  </div>
                )}
                
                {/* Price Badge */}
                <div className="absolute bottom-2 right-2 bg-emerald-600 text-white px-3 py-1 rounded-full font-bold">
                  ${food.price ? food.price.toFixed(2) : '0.00'}
                </div>
              </div>
              
              {/* Food Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-emerald-900 mb-1">{food.name}</h3>
                <p className="text-sm text-emerald-600 mb-4">Menu: {selectedMenu?.name}</p>
                
                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (qty > 0) {
                          updateQuantity(food.foodId, qty - 1)
                        }
                      }}
                      className="p-2 rounded-md bg-emerald-100 hover:bg-emerald-200 transition-colors"
                      disabled={!qty}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <span className="w-8 text-center font-medium">{qty}</span>
                    
                    <button
                      onClick={() => addToCart(food, selectedMenu)}
                      className="p-2 rounded-md bg-teal-100 hover:bg-teal-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => addToCart(food, selectedMenu)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CART SIDEBAR */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-emerald-100">
                <h2 className="text-lg font-semibold text-emerald-900">Shopping Cart</h2>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-emerald-50 rounded-md">
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <p className="text-emerald-600 text-center py-8">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.foodId} className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-emerald-900">{item.foodName}</h4>
                          <p className="text-sm text-emerald-700">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => item.quantity > 1 && updateQuantity(item.foodId, item.quantity - 1)} className="p-1 rounded hover:bg-emerald-200">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.foodId, item.quantity + 1)} className="p-1 rounded hover:bg-emerald-200">
                            <Plus className="h-4 w-4" />
                          </button>
                          <button onClick={() => removeFromCart(item.foodId)} className="p-1 rounded hover:bg-red-100 text-red-600 ml-2">
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {items.length > 0 && (
                <div className="border-t border-emerald-100 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-emerald-900">Total:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowCheckout(true)
                      setShowCart(false)
                    }}
                    className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
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

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCheckout(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-emerald-900">Order Summary</h2>
              
              <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">Table</label>
                    <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} className="input w-full border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
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
                    <label className="block text-sm font-medium text-emerald-700 mb-1">Payment Status</label>
                    <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="input w-full border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input w-full border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-emerald-600">
                  <div>Order Time: {new Date().toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.foodId} className="flex justify-between">
                    <span>{item.quantity} × {item.foodName}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-emerald-100 pt-3 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-emerald-900">Total Amount:</span>
                  <span className="text-emerald-600">${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCheckout} className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                  Place Order & Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        onConfirm={() => navigate('/invoices')}
      />
      </div>
    </div>
  )
}
