import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import socket from '../services/socket'
import CountdownTimer from '../components/CountdownTimer'

const AuctionDetail = () => {
  const { id } = useParams()
  const { user, hasRole } = useAuth()
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/auctions/${id}`)
        setAuction(data.auction)
        setBids(data.bids)
        
        // Check if auction has ended
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

  useEffect(() => {
    socket.connect()
    socket.emit('join_auction', id)
    const handler = (payload) => {
      if (String(payload.auctionId) === String(id)) {
        setBids(prev => [{ 
          id: Math.random(), 
          amount: payload.amount, 
          created_at: new Date().toISOString(), 
          bidder_name: 'Live Bid' 
        }, ...prev])
        setAuction(prev => ({ ...prev, current_price: payload.amount }))
      }
    }
    socket.on('bid_update', handler)
    return () => {
      socket.off('bid_update', handler)
      socket.disconnect()
    }
  }, [id])

  const handleEnd = () => {
    setIsEnded(true)
  }

  const placeBid = async (e) => {
    e.preventDefault()
    if (!amount || !user) return
    
    setError('')
    try {
      await api.post('/bids', { auction_id: Number(id), amount: Number(amount) })
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid')
    }
  }

  const canBid = user && hasRole('BIDDER') && !isEnded && auction?.status === 'APPROVED'

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <img 
            src={auction.image_url} 
            alt={auction.title} 
            className="w-full h-96 object-cover rounded-lg shadow-md" 
          />
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

        {/* Bidding Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
            <p className="text-gray-600 mb-4">{auction.description}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                ${Number(auction.current_price).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mb-4">Current Highest Bid</div>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-sm text-gray-600">Time Remaining:</span>
                <CountdownTimer endTime={auction.ends_at} onEnd={handleEnd} />
              </div>

              {isEnded && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium">
                  This auction has ended
                </div>
              )}
            </div>

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
                
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
              </form>
            ) : !user ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please log in to place bids</p>
                <a href="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                  Login
                </a>
              </div>
            ) : !hasRole('BIDDER') ? (
              <div className="text-center text-gray-600">
                Only bidders can place bids
              </div>
            ) : isEnded ? (
              <div className="text-center text-gray-600">
                This auction has ended
              </div>
            ) : (
              <div className="text-center text-gray-600">
                This auction is not active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bidding History */}
      <div className="mt-8 bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Bidding History</h2>
        </div>
        
        {bids.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No bids placed yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bids.map((bid, index) => (
              <div key={bid.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">#{bids.length - index}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      ${Number(bid.amount).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      by {bid.bidder_name || 'Anonymous'}
                    </div>
                  </div>
                </div>
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


