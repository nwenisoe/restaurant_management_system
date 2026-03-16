import React, { createContext, useContext, useReducer } from 'react'

const CartContext = createContext()

// Cart item structure
export const cartItem = {
  foodId: '',
  foodName: '',
  price: 0,
  quantity: 1,
  menuId: '',
  menuName: ''
}

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.foodId === action.payload.foodId)
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.foodId === action.payload.foodId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      
      return {
        ...state,
        items: [...state.items, action.payload]
      }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.foodId !== action.payload)
      }

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.foodId === action.payload.foodId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      }

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }

    default:
      return state
  }
}

// Initial state
const initialState = {
  items: []
}

// Cart provider
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Calculate total items and amount
  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalAmount = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const addToCart = (food, menu) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        foodId: food.foodId,
        foodName: food.name,
        price: food.price,
        quantity: 1,
        menuId: menu.menuId,
        menuName: menu.name
      }
    })
  }

  const removeFromCart = (foodId) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: foodId
    })
  }

  const updateQuantity = (foodId, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { foodId, quantity }
    })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const value = {
    items: state.items,
    getTotalItems,
    getTotalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Hook to use cart
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
