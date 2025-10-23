import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { Link } from 'react-router-dom'
import api from '../services/api'

const BidderContent = () => {
  const { user } = useAuth()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadBids()
  }, [])

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

  const getBidStatus = (auction) => {
    const now = new Date()
    const endTime = new Date(auction.ends_at)
    
    if (endTime < now) {
      return auction.current_price === auction.bid_amount ? 'Won' : 'Lost'
    }
    return 'Active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Won': return 'bg-green-100 text-green-800'
      case 'Lost': return 'bg-red-100 text-red-800'
      case 'Active': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Bids</h1>
        <p className="text-gray-600 mt-1">Track your bidding activity and auction results</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Bidding History</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading bids...</p>
          </div>
        ) : bids.length === 0 ? (
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
        ) : (
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
                  const status = getBidStatus(bid.auction)
                  return (
                    <tr key={bid.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${Number(bid.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(bid.auction.current_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bid.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/auction/${bid.auction.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Auction
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics */}
      {bids.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-indigo-600">
              {bids.length}
            </div>
            <div className="text-sm text-gray-600">Total Bids</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-green-600">
              {bids.filter(bid => getBidStatus(bid.auction) === 'Won').length}
            </div>
            <div className="text-sm text-gray-600">Auctions Won</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-blue-600">
              {bids.filter(bid => getBidStatus(bid.auction) === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Bids</div>
          </div>
        </div>
      )}
    </div>
  )
}

const Bidder = () => (
  <ProtectedRoute roles={['BIDDER']}>
    <BidderContent />
  </ProtectedRoute>
)

export default Bidder
