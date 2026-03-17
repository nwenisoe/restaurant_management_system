import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { post, get } from '../api/client'
import { ArrowLeft, Save, DollarSign, Image, Utensils, AlertCircle, Upload, X, Camera } from 'lucide-react'

export default function CreateFood() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [menus, setMenus] = useState([])
  const [menusLoading, setMenusLoading] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imageUploadProgress, setImageUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    foodImage: '',
    menuId: '',
    category: ''
  })

  const categories = [
    'Appetizers',
    'Main Course',
    'Desserts',
    'Beverages',
    'Soups',
    'Salads',
    'Specials',
    'Breakfast',
    'Lunch',
    'Dinner'
  ]

  // Fetch available menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await get('/api/v1/menus')
        const menusData = response.menus || response || []
        setMenus(menusData)
      } catch (err) {
        console.error('Error fetching menus:', err)
        setError('Failed to load menus. Please try again.')
      } finally {
        setMenusLoading(false)
      }
    }

    fetchMenus()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
      // For now, we'll store the preview as base64 in the form
      // In production, you'd upload to a server and get a URL
      setFormData(prev => ({
        ...prev,
        foodImage: reader.result
      }))
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({
      ...prev,
      foodImage: ''
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      }

      await post('/api/v1/foods', payload)
      setSuccess('Food item created successfully!')
      
      // Reset form after 2 seconds and navigate
      setTimeout(() => {
        setFormData({
          name: '',
          price: '',
          foodImage: '',
          menuId: '',
          category: ''
        })
        setImageFile(null)
        setImagePreview('')
        navigate('/foods')
      }, 2000)
      
    } catch (err) {
      console.error('Error creating food:', err)
      setError(err?.response?.data?.error || err.message || 'Failed to create food item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/foods')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Foods
          </button>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Food Item
            </h1>
            <p className="mt-2 text-gray-600">
              Add a delicious new item to your restaurant menu
            </p>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="h-4 w-4 inline mr-1" />
                Food Image
              </label>
              
              {!imagePreview ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">Drop your image here</p>
                      <p className="text-sm text-gray-500">or</p>
                    </div>
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Camera className="h-4 w-4" />
                      Browse Files
                    </button>
                    <p className="text-xs text-gray-400">
                      Supports: JPG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <Utensils className="h-4 w-4 inline mr-1" />
                Food Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Grilled Salmon"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                <Utensils className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="29.99"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="menuId" className="block text-sm font-medium text-gray-700 mb-2">
                <Utensils className="h-4 w-4 inline mr-1" />
                Menu
              </label>
              {menusLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                  Loading menus...
                </div>
              ) : menus.length === 0 ? (
                <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-600">
                  No menus found. <a href="/create/menu" className="underline">Create a menu first</a>
                </div>
              ) : (
                <select
                  id="menuId"
                  name="menuId"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={formData.menuId}
                  onChange={handleChange}
                >
                  <option value="">Select a menu...</option>
                  {menus.map((menu) => (
                    <option key={menu.id || menu.menuId} value={menu.menuId}>
                      {menu.name} ({menu.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Creating...' : 'Create Food Item'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/foods')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
