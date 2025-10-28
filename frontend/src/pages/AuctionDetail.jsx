import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import socket from '../services/socket'
import CountdownTimer from '../components/CountdownTimer'

const AuctionDetail = () => {
  // Get auction ID from URL parameters
  const { id } = useParams()
  
  // Authentication context for user info and role checking
  const { user, hasRole } = useAuth()
  
  // State for managing auction data and UI states
  const [auction, setAuction] = useState(null) // Auction details
  const [bids, setBids] = useState([]) // Bidding history
  const [amount, setAmount] = useState('') // Current bid input value
  const [loading, setLoading] = useState(false) // Loading state for API calls
  const [error, setError] = useState('') // Error messages
  const [isEnded, setIsEnded] = useState(false) // Auction end status

  // Load auction details and bids when component mounts or ID changes
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/auctions/${id}`)
        setAuction(data.auction)
        setBids(data.bids)
        
        // Check if auction has ended based on end time
        const now = new Date()
        const endTime = new Date(data.auction.ends_at)
        setIsEnded(now > endTime)
      } catch (err) {
        setError('Failed to load auction details')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // WebSocket connection for real-time bid updates
  useEffect(() => {
    // Connect to socket and join this specific auction room
    socket.connect()
    socket.emit('join_auction', id)
    
    // Handle real-time bid updates from server
    const handler = (payload) => {
      if (String(payload.auctionId) === String(id)) {
        // Add new bid to the top of the list with temporary ID
        setBids(prev => [{ 
          id: Math.random(), // Temporary ID for local state
          amount: payload.amount, 
          created_at: new Date().toISOString(), 
          bidder_name: 'Live Bid' // Indicator for real-time bids
        }, ...prev])
        
        // Update current price in auction data
        setAuction(prev => ({ ...prev, current_price: payload.amount }))
      }
    }
    
    // Subscribe to bid updates and cleanup on unmount
    socket.on('bid_update', handler)
    return () => {
      socket.off('bid_update', handler)
      socket.disconnect()
    }
  }, [id])

  // Handler for when auction timer ends
  const handleEnd = () => {
    setIsEnded(true)
  }

  // Place a new bid
  const placeBid = async (e) => {
    e.preventDefault()
    if (!amount || !user) return
    
    setError('')
    try {
      await api.post('/bids', { 
        auction_id: Number(id), 
        amount: Number(amount) 
      })
      setAmount('') // Clear input after successful bid
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid')
    }
  }

  // Determine if user can place bids
  const canBid = user && 
                hasRole('BIDDER') && 
                !isEnded && 
                auction?.status === 'APPROVED'

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading auction...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !auction) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Auction</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!auction) return null

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Image and Details */}
        <div className="space-y-4">
          {/* Auction Image */}
          <img 
            src={auction.image_url} 
            alt={auction.title} 
            className="w-full h-96 object-cover rounded-lg shadow-md" 
          />
          
          {/* Auction Details Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-2">Auction Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{auction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Starting Price:</span>
                <span className="font-medium">${Number(auction.start_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seller:</span>
                <span className="font-medium">{auction.seller_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Interface */}
        <div className="space-y-6">
          {/* Auction Title and Description */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
            <p className="text-gray-600 mb-4">{auction.description}</p>
          </div>

          {/* Bidding Card */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="text-center mb-6">
              {/* Current Price Display */}
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                ${Number(auction.current_price).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mb-4">Current Highest Bid</div>
              
              {/* Countdown Timer */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-sm text-gray-600">Time Remaining:</span>
                <CountdownTimer endTime={auction.ends_at} onEnd={handleEnd} />
              </div>

              {/* Ended Auction Indicator */}
              {isEnded && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium">
                  This auction has ended
                </div>
              )}
            </div>

            {/* Bid Form - Conditionally Rendered Based on User Status */}
            {canBid ? (
              <form onSubmit={placeBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Bid Amount
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      min={Number(auction.current_price) + 0.01}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Min: $${(Number(auction.current_price) + 0.01).toFixed(2)}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Place Bid
                    </button>
                  </div>
                </div>
                
                {/* Bid Error Display */}
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
              </form>
            ) : !user ? (
              // Not Logged In State
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please log in to place bids</p>
                <a href="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                  Login
                </a>
              </div>
            ) : !hasRole('BIDDER') ? (
              // Wrong Role State
              <div className="text-center text-gray-600">
                Only bidders can place bids
              </div>
            ) : isEnded ? (
              // Auction Ended State
              <div className="text-center text-gray-600">
                This auction has ended
              </div>
            ) : (
              // Auction Not Active State
              <div className="text-center text-gray-600">
                This auction is not active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bidding History Section */}
      <div className="mt-8 bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Bidding History</h2>
        </div>
        
        {/* Empty Bids State */}
        {bids.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No bids placed yet
          </div>
        ) : (
          /* Bids List */
          <div className="divide-y divide-gray-200">
            {bids.map((bid, index) => (
              <div key={bid.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {/* Bid Rank Indicator */}
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">#{bids.length - index}</span>
                  </div>
                  <div>
                    {/* Bid Amount */}
                    <div className="font-medium text-gray-900">
                      ${Number(bid.amount).toFixed(2)}
                    </div>
                    {/* Bidder Name */}
                    <div className="text-sm text-gray-500">
                      by {bid.bidder_name || 'Anonymous'}
                    </div>
                  </div>
                </div>
                {/* Bid Time */}
                <div className="text-sm text-gray-500">
                  {new Date(bid.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuctionDetail