import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import api from '../services/api'
import formatCurrency from '../utils/currency'

const SellerContent = () => {
  // Authentication context to get current user info
  const { user } = useAuth()
  
  // State for managing auctions data and UI states
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // State for new auction form data
  const [newAuction, setNewAuction] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    image_file: null,
    start_price: '',
    ends_at: '',
    min_increment: '1.00',
    max_increment: ''
    ,reserve_price: '',
    buy_now_price: ''
  })
  const [formError, setFormError] = useState('')

  // Load auctions when component mounts
  useEffect(() => {
    loadAuctions()
  }, [])

  // Function to fetch seller's auctions from API
  const loadAuctions = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/auctions/my-auctions')
      setAuctions(data)
    } catch (error) {
      console.error('Failed to load auctions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission for creating new auction
  const handleCreateAuction = async (e) => {
    e.preventDefault()
    setFormError('')
    // Validate increments on client-side
    const minIncVal = newAuction.min_increment !== '' ? Number(newAuction.min_increment) : undefined
    const maxIncVal = newAuction.max_increment !== '' ? Number(newAuction.max_increment) : undefined
    if (minIncVal !== undefined) {
      if (Number.isNaN(minIncVal) || minIncVal <= 0) {
        setFormError('Minimum increment must be a number greater than 0')
        return
      }
    }
    if (maxIncVal !== undefined) {
      if (Number.isNaN(maxIncVal) || maxIncVal < 0) {
        setFormError('Maximum increment must be a non-negative number')
        return
      }
    }
    if (minIncVal !== undefined && maxIncVal !== undefined) {
      if (maxIncVal < minIncVal) {
        setFormError('Maximum increment must be greater than or equal to Minimum increment')
        return
      }
    }
    try {
      // Normalize values we'll send
      const normalizedMin = newAuction.min_increment ? newAuction.min_increment : '';
      const normalizedMax = newAuction.max_increment ? newAuction.max_increment : '';

      // If an image file is selected, use FormData to upload and include min/max increments
      if (newAuction.image_file) {
        const form = new FormData()
        form.append('title', newAuction.title)
        form.append('description', newAuction.description)
        form.append('category', newAuction.category)
        form.append('start_price', newAuction.start_price)
        form.append('ends_at', newAuction.ends_at)
        form.append('image', newAuction.image_file)
        // Always include increment fields (empty string will be ignored server-side)
        form.append('min_increment', normalizedMin)
        form.append('max_increment', normalizedMax)
        form.append('reserve_price', newAuction.reserve_price)
        form.append('buy_now_price', newAuction.buy_now_price)
        await api.post('/auctions', form)
      } else {
        const payload = {
          title: newAuction.title,
          description: newAuction.description,
          category: newAuction.category,
          image_url: newAuction.image_url,
          start_price: newAuction.start_price ? Number(newAuction.start_price) : undefined,
          ends_at: newAuction.ends_at,
          // send numeric values where provided; undefined will let server use defaults
          min_increment: newAuction.min_increment !== '' ? Number(newAuction.min_increment) : undefined,
          max_increment: newAuction.max_increment !== '' ? Number(newAuction.max_increment) : undefined,
          reserve_price: newAuction.reserve_price !== '' ? Number(newAuction.reserve_price) : undefined,
          buy_now_price: newAuction.buy_now_price !== '' ? Number(newAuction.buy_now_price) : undefined,
        }
        await api.post('/auctions', payload)
      }
      // Reset form and refresh auctions list
      setNewAuction({
        title: '',
        description: '',
        category: '',
        image_url: '',
        image_file: null,
        start_price: '',
        ends_at: '',
        min_increment: '1.00',
        max_increment: '',
        reserve_price: '',
        buy_now_price: ''
      })
      setShowCreateForm(false)
      loadAuctions()
    } catch (error) {
      const apiData = error.response?.data
      const message = apiData?.errors?.[0]?.msg || apiData?.message || 'Failed to create auction'
      console.error('Failed to create auction:', error)
      setFormError(message)
    }
  }

  // Helper function to get CSS classes based on auction status
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate remaining time for auction countdown
  const calculateTimeLeft = (endsAt) => {
    const endTime = new Date(endsAt).getTime()
    const now = new Date().getTime()
    const difference = endTime - now
    
    if (difference <= 0) return 'Ended'
    
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)
    
    return `${hours}h ${minutes}m ${seconds}s`
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header section with dashboard title and create button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New Auction'}
        </button>
      </div>

      {/* Create Auction Form - Conditionally rendered */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium mb-4">Create New Auction</h2>
          <form onSubmit={handleCreateAuction} className="space-y-4">
            {formError && (
              <div className="text-sm text-red-600">{formError}</div>
            )}
            {/* Title and Category inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.title}
                  onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                  placeholder="e.g., Dell Latitude 7420"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.category}
                  onChange={(e) => setNewAuction({ ...newAuction, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Books">Books</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Art">Art</option>
                  <option value="Collectibles">Collectibles</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Description textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newAuction.description}
                onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                placeholder="Describe your item..."
              />
            </div>
            
            {/* Image URL, Starting Price, and End Date inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  value={newAuction.image_url}
                  onChange={(e) => setNewAuction({ ...newAuction, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="text-sm text-gray-500 mb-1">Or upload an image from your device</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewAuction({ ...newAuction, image_file: e.target.files?.[0] || null })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Price (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.start_price}
                  onChange={(e) => setNewAuction({ ...newAuction, start_price: e.target.value })}
                  placeholder="300.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.ends_at}
                  onChange={(e) => setNewAuction({ ...newAuction, ends_at: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Increment (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.min_increment}
                  onChange={(e) => setNewAuction({ ...newAuction, min_increment: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Increment (ETB) (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.max_increment}
                  onChange={(e) => setNewAuction({ ...newAuction, max_increment: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reserve Price (ETB) - minimum acceptable price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.reserve_price}
                  onChange={(e) => setNewAuction({ ...newAuction, reserve_price: e.target.value })}
                />
                <div className="text-sm text-gray-500">If bids don't reach this amount, the item won't be sold.</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buy-It-Now Price (ETB) - optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAuction.buy_now_price}
                  onChange={(e) => setNewAuction({ ...newAuction, buy_now_price: e.target.value })}
                />
                <div className="text-sm text-gray-500">If a bidder pays this price, the auction ends immediately and item is sold.</div>
              </div>
              {/* Deposit is auto-calculated as 25% of starting price; no input required */}
            </div>
            
            {/* Form action buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create Auction
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Auctions List Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">My Auctions</h2>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading auctions...</p>
          </div>
        ) : auctions.length === 0 ? (
          /* Empty state */
          <div className="p-6 text-center text-gray-500">
            <p>No auctions created yet.</p>
            <p className="text-sm">Create your first auction to get started!</p>
          </div>
        ) : (
          /* Auctions grid */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <div key={auction.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Auction image with status badge */}
                  <div className="relative">
                    <img
                      src={auction.image_url}
                      alt={auction.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Auction details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {auction.category}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {auction.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {auction.description}
                    </p>
                    
                    {/* Auction metrics */}
                    <div className="space-y-2 border-t pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Current Price</span>
                                <span className="text-lg font-bold text-indigo-600">
                                  {formatCurrency(auction.current_price || auction.start_price)}
                                </span>
                              </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Time Left</span>
                        <span className="text-sm font-semibold text-red-600">
                          {calculateTimeLeft(auction.ends_at)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>By {user?.name || 'You'}</span>
                        <span>{formatDate(auction.ends_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Protected route wrapper - only SELLER role can access
const Seller = () => (
  <ProtectedRoute roles={['SELLER']}>
    <SellerContent />
  </ProtectedRoute>
)

export default Seller