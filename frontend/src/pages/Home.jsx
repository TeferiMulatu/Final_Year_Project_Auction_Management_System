import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import socket from '../services/socket'
import CountdownTimer from '../components/CountdownTimer'
import formatCurrency from '../utils/currency'

const Home = () => {
  // State for managing auctions data and UI states
  const [items, setItems] = useState([]) // List of all auctions
  const [loading, setLoading] = useState(false) // Loading state for API calls
  const [searchTerm, setSearchTerm] = useState('') // Search input value
  const [selectedCategory, setSelectedCategory] = useState('') // Selected category filter
  const [categories, setCategories] = useState([]) // Unique categories from auctions

  // Load auctions data when component mounts
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Fetch all auctions from API
        const { data } = await api.get('/auctions')
        setItems(data)
        
        // Extract unique categories from auction data for filter dropdown
        const uniqueCategories = [...new Set(data.map(item => item.category))]
        setCategories(uniqueCategories)
      } finally {
        setLoading(false)
      }
    }
    load()
    // Ensure socket is connected for unauthenticated visitors and listen for new auctions
    try {
      socket.connect()
    } catch (e) {
      // ignore connect errors; other components may connect as well
    }

    const newAuctionHandler = (auction) => {
      // Only show auctions that are approved for public listing
      if (!auction || auction.status !== 'APPROVED') return
      // Prepend newly created auction so users see it immediately
      setItems(prev => {
        // Avoid duplicates if auction already present
        if (prev.some(a => Number(a.id) === Number(auction.id))) return prev
        const updated = [auction, ...prev]
        return updated
      })
      // update categories
      setCategories(prev => {
        if (!auction || !auction.category) return prev
        if (prev.includes(auction.category)) return prev
        return [auction.category, ...prev]
      })
    }

    socket.on('auction_created', newAuctionHandler)

    const closedHandler = (payload) => {
      if (!payload || !payload.auctionId) return
      setItems(prev => prev.map(a => {
        if (Number(a.id) === Number(payload.auctionId)) {
          return { ...a, status: 'CLOSED', ends_at: new Date().toISOString(), current_price: payload.finalPrice || a.current_price }
        }
        return a
      }))
    }

    socket.on('auction_closed', closedHandler)

    return () => {
      socket.off('auction_created', newAuctionHandler)
      socket.off('auction_closed', closedHandler)
    }
  }, [])

  // Filter auctions based on search term and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Auctions</h1>
        <p className="text-gray-600">Discover amazing items up for auction</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search auctions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Category Filter Dropdown */}
          <div className="md:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} auctions
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading auctions...</span>
        </div>
      ) : 
      
      /* Empty State */
      filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'No auctions are currently available'
            }
          </p>
          {/* Clear Filters Button - Only shown when filters are active */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : 
      
      /* Auctions Grid */
      (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(auction => (
            <Link 
              key={auction.id} 
              to={`/auction/${auction.id}`} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Auction Image with Category Badge */}
              <div className="relative">
                <img 
                  src={auction.image_url} 
                  alt={auction.title} 
                  className="w-full h-48 object-cover" 
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-indigo-600 text-white px-2 py-1 text-xs font-medium rounded-full">
                    {auction.category}
                  </span>
                </div>
              </div>
              
              {/* Auction Details */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {auction.title}
                </h3>
                
                {/* Auction Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(auction.current_price)}
                    </span>
                  </div>
                  {/* Min/Max increment display for visibility to all users */}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Min inc: {formatCurrency(auction.min_increment || 1)}</span>
                    <span>{auction.max_increment ? `Max inc: ${formatCurrency(auction.max_increment)}` : 'No max'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Left</span>
                    {/* Countdown Timer Component */}
                    <CountdownTimer endTime={auction.ends_at} />
                  </div>
                  
                  {/* Seller and End Date Info */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>By {auction.seller_name}</span>
                    <span>{new Date(auction.ends_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home