import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { Link } from 'react-router-dom'
import api from '../services/api'
import formatCurrency from '../utils/currency'
import socket from '../services/socket'

const BidderContent = () => {
  // Authentication context to get current user info
  const { user } = useAuth()
  const { addToast } = useToast()
  
  // State for managing bids data and loading status
  const [bids, setBids] = useState([]) // Array of user's bids
  const [loading, setLoading] = useState(false) // Loading state for API calls

  // Load bids when component mounts
  useEffect(() => {
    loadBids()
    // connect socket to receive auction_closed events and refresh bids
    socket.connect()
    const closedHandler = (payload) => {
      // If any auction closed, refresh user's bids to reflect winner/refunds
      try { loadBids() } catch (e) { console.warn('Failed to reload bids after auction_closed', e) }
      // If current user won, show a toast
      if (payload?.winnerId && Number(payload.winnerId) === Number(user?.id)) {
        try { addToast({ message: `You won auction ${payload.auctionId}`, type: 'success' }) } catch (e) {}
      }
    }
    socket.on('auction_closed', closedHandler)
    return () => {
      socket.off('auction_closed', closedHandler)
      socket.disconnect()
    }
  }, [])

  // Function to fetch user's bids from API
  const loadBids = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/bids/my-bids')
      setBids(data)
    } catch (error) {
      console.error('Failed to load bids:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determine the status of a bid based on auction end time, auction status, and winner info
  const getBidStatus = (bid) => {
    const auction = bid.auction
    const now = new Date()
    const endTime = new Date(auction.ends_at)

    // If auction explicitly closed, prefer winner_id check
    if (auction.status === 'CLOSED' || endTime < now) {
      // If backend provides winner_id, compare with current user id
      if (auction.winner_id !== null && auction.winner_id !== undefined) {
        return Number(auction.winner_id) === Number(user?.id) ? 'Won' : 'Lost'
      }

      // Fallback: compare the user's bid amount to the final/current price
      const bidAmount = Number(bid.amount)
      const finalPrice = auction.final_price ? Number(auction.final_price) : Number(auction.current_price)
      return bidAmount === finalPrice ? 'Won' : 'Lost'
    }
    return 'Active' // Auction is still ongoing
  }

  // Helper function to get CSS classes based on bid status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Won': return 'bg-green-100 text-green-800' // Green for won auctions
      case 'Lost': return 'bg-red-100 text-red-800'    // Red for lost auctions
      case 'Active': return 'bg-blue-100 text-blue-800' // Blue for active auctions
      default: return 'bg-gray-100 text-gray-800'      // Gray for unknown status
    }
  }

  // Simulate payment for a won auction
  const payForAuction = async (auction) => {
    const confirmPay = window.confirm(`Pay ${formatCurrency(auction.current_price)} for ${auction.title}?`)
    if (!confirmPay) return
    try {
      const { data } = await api.post('/payments', { auction_id: auction.id, amount: auction.current_price, method: 'card' })
      addToast({ message: data.message || 'Payment successful (simulated)', type: 'success' })
      loadBids()
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Payment failed', type: 'error' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Bids</h1>
        <p className="text-gray-600 mt-1">Track your bidding activity and auction results</p>
      </div>

      {/* Main Bids Table Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Bidding History</h2>
        </div>
        
        {/* Loading State */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bids...</p>
          </div>
        ) : 
        
        /* Empty State - No bids placed */
        bids.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No bids placed yet.</p>
            <p className="text-sm">Start bidding on auctions to see your activity here!</p>
            <Link 
              to="/" 
              className="inline-block mt-3 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Browse Auctions
            </Link>
          </div>
        ) : 
        
        /* Bids Table */
        (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    My Bid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bids.map((bid) => {
                  const status = getBidStatus(bid)
                  return (
                    <tr key={bid.id} className="hover:bg-gray-50">
                      {/* Auction Item Column with Image and Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={bid.auction.image_url}
                            alt={bid.auction.title}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {bid.auction.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bid.auction.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* User's Bid Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(bid.amount)}
                      </td>
                      
                      {/* Current Auction Price */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(bid.auction.current_price)}
                      </td>
                      {/* Deposit Paid */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bid.deposit_paid ? formatCurrency(bid.deposit_paid) : '-'}
                      </td>
                      {/* Refund Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bid.deposit_refunded ? `Refunded (${formatCurrency(bid.refund_amount)})` : (bid.deposit_paid ? 'Held' : '-')}
                      </td>
                      
                      {/* Bid Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                      
                      {/* Bid Placement Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bid.created_at).toLocaleString()}
                      </td>
                      
                      {/* Action Link to View Auction or Pay if won */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {getBidStatus(bid) === 'Won' ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => payForAuction(bid.auction)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                            >
                              Pay
                            </button>
                            <Link to={`/auction/${bid.auction.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                          </div>
                        ) : (
                          <Link
                            to={`/auction/${bid.auction.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Auction
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Cards - Only shown when user has bids */}
      {bids.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Bids Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-indigo-600">
              {bids.length}
            </div>
            <div className="text-sm text-gray-600">Total Bids</div>
          </div>
          
          {/* Auctions Won Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-green-600">
              {bids.filter(bid => getBidStatus(bid) === 'Won').length}
            </div>
            <div className="text-sm text-gray-600">Auctions Won</div>
          </div>
          
          {/* Active Bids Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-blue-600">
              {bids.filter(bid => getBidStatus(bid) === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Bids</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Protected route wrapper - only BIDDER role can access
const Bidder = () => (
  <ProtectedRoute roles={['BIDDER']}>
    <BidderContent />
  </ProtectedRoute>
)

export default Bidder