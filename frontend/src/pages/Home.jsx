import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import CountdownTimer from '../components/CountdownTimer'

const Home = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/auctions')
        setItems(data)
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category))]
        setCategories(uniqueCategories)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Auctions</h1>
        <p className="text-gray-600">Discover amazing items up for auction</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search auctions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} auctions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading auctions...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'No auctions are currently available'
            }
          </p>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(auction => (
            <Link 
              key={auction.id} 
              to={`/auction/${auction.id}`} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
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
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {auction.title}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-bold text-indigo-600">
                      ${Number(auction.current_price).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Left</span>
                    <CountdownTimer endTime={auction.ends_at} />
                  </div>
                  
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


