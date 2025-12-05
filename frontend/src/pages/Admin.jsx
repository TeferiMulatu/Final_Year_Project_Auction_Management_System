import { useEffect, useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import socket from '../services/socket'
import api from '../services/api'
import formatCurrency from '../utils/currency'
import ProtectedRoute from '../components/ProtectedRoute'

const AdminContent = () => {
  // State for managing admin data
  const [users, setUsers] = useState([]) // All users for management
  const [pendingAuctions, setPendingAuctions] = useState([]) // Auctions awaiting approval
  const [stats, setStats] = useState({ users: 0, auctions: 0, bids: 0 }) // System statistics
  const [activeTab, setActiveTab] = useState('dashboard') // Current active tab
  const { user: currentUser } = useAuth()
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { addToast } = useToast()

  /**
   * Load all admin data from API endpoints
   * Uses Promise.all for parallel requests to improve performance
   */
  const load = async () => {
    const [{ data: usersData }, { data: statsData }, { data: auctionsData }] = await Promise.all([
      api.get('/admin/users'),           // Get all users
      api.get('/admin/stats'),           // Get system statistics
      api.get('/admin/pending-auctions'), // Get pending auctions for approval
    ])
    setUsers(usersData)
    setStats(statsData)
    setPendingAuctions(auctionsData)
  }

  // Load data when component mounts
  useEffect(() => { load() }, [])

  // Listen for new user registrations via socket and refresh list
  useEffect(() => {
    const handler = (payload) => {
      // Only refresh if admin page is active
      if (activeTab === 'users') load()
      else {
        // still update users array so badge count is accurate
        load()
      }
    }
    try {
      socket.on('user_registered', handler)
    } catch (e) { /* ignore socket errors */ }
    return () => {
      try { socket.off('user_registered', handler) } catch (e) {}
    }
  }, [activeTab])

  // Listen for newly created pending auctions so admins see them in real-time
  useEffect(() => {
    const pendingHandler = (auction) => {
      // Update pending auctions list and stats
      setPendingAuctions(prev => {
        if (!auction) return prev
        if (prev.some(a => Number(a.id) === Number(auction.id))) return prev
        return [auction, ...prev]
      })
      // Refresh stats to reflect new pending count
      setStats(s => ({ ...s, auctions: Number(s.auctions || 0) + 1 }))
      // If admin is viewing auctions tab, also reload (to ensure consistent server-side state)
      if (activeTab === 'auctions') load()
    }
    try {
      socket.on('auction_pending', pendingHandler)
    } catch (e) {}
    return () => { try { socket.off('auction_pending', pendingHandler) } catch (e) {} }
  }, [activeTab])

  const pendingUsersCount = users.filter(u => !u.is_active).length

  /**
   * Toggle user active/inactive status
   * @param {number} id - User ID to toggle
   */
  const toggle = async (id) => {
    await api.post(`/admin/users/${id}/toggle`)
    await load() // Reload data to reflect changes
  }

  /**
   * Reset a user's password (admin action). Prompts for new password.
   * @param {number} id
   */
  const resetPassword = async (id) => {
    const newPass = window.prompt('Enter new password for user (min 6 chars)')
    if (!newPass) return
    try {
      await api.post(`/admin/users/${id}/reset-password`, { password: newPass })
      addToast({ message: 'Password reset successfully', type: 'success' })
      await load()
    } catch (err) {
      addToast({ message: err.response?.data?.message || 'Failed to reset password', type: 'error' })
    }
  }

  /**
   * Approve a pending auction
   * @param {number} id - Auction ID to approve
   */
  const approveAuction = async (id) => {
    await api.post(`/admin/auctions/${id}/approve`)
    await load() // Reload data to reflect changes
  }

  /**
   * Reject a pending auction
   * @param {number} id - Auction ID to reject
   */
  const rejectAuction = async (id) => {
    await api.post(`/admin/auctions/${id}/reject`)
    await load() // Reload data to reflect changes
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600' // Active tab styles
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' // Inactive tab styles
            }`}
          >
            Dashboard
          </button>
          
          {/* Pending Auctions Tab */}
          <button
            onClick={() => setActiveTab('auctions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auctions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Auctions ({pendingAuctions.length}) {/* Show count of pending auctions */}
          </button>
          
          {/* User Management Tab */}
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="inline-flex items-center">
              <span>User Management</span>
              {pendingUsersCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                  {pendingUsersCount}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>

      {/* Dashboard Tab Content */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Users Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-indigo-600">{stats.users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            
            {/* Total Auctions Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-600">{stats.auctions}</div>
              <div className="text-sm text-gray-600">Total Auctions</div>
            </div>
            
            {/* Total Bids Card */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600">{stats.bids}</div>
              <div className="text-sm text-gray-600">Total Bids</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Auctions Tab Content */}
      {activeTab === 'auctions' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Pending Auction Approvals</h2>
          </div>
          
          {/* Empty State */}
          {pendingAuctions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No pending auctions to review.</p>
            </div>
          ) : (
            /* Pending Auctions Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Starting Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ends At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingAuctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-gray-50">
                      {/* Auction Details Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={auction.image_url}
                            alt={auction.title}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {auction.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {auction.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Seller Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {auction.seller_name}
                      </td>
                      
                      {/* Starting Price Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(auction.start_price)}
                      </td>
                      
                      {/* End Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(auction.ends_at).toLocaleString()}
                      </td>
                      
                      {/* Action Buttons Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Approve Button */}
                          <button
                            onClick={() => approveAuction(auction.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md"
                          >
                            Approve
                          </button>
                          
                          {/* Reject Button */}
                          <button
                            onClick={() => rejectAuction(auction.id)}
                            className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* User Management Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">User Management</h2>
          </div>
          
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Images
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {/* User Name Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    
                    {/* Email Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    
                    {/* Role Column with Color-coded Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800' // BIDDER role
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    {/* FIN Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.fin_number || '-'}
                    </td>
                    {/* ID Images Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {user.id_front_url ? (
                          <button onClick={() => { setSelectedUser(user); setModalOpen(true) }} className="focus:outline-none">
                            <img src={user.id_front_url} alt="id-front" className="h-12 w-16 object-cover rounded-md" />
                          </button>
                        ) : <span className="text-xs text-gray-400">No</span>}
                        {user.id_back_url ? (
                          <button onClick={() => { setSelectedUser(user); setModalOpen(true) }} className="focus:outline-none">
                            <img src={user.id_back_url} alt="id-back" className="h-12 w-16 object-cover rounded-md" />
                          </button>
                        ) : <span className="text-xs text-gray-400">No</span>}
                      </div>
                    </td>
                    
                    {/* Status Column with Color-coded Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    
                      {/* Action Column - Toggle User Status + Reset Password */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggle(user.id)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            user.is_active 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' // Deactivate button
                              : 'bg-green-100 text-green-700 hover:bg-green-200' // Activate button
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => resetPassword(user.id)}
                          className="px-3 py-1 rounded-md text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* User Details Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-xl z-10 max-w-3xl w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">{selectedUser.name} — ID images</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-600 hover:text-gray-900">Close</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Front</div>
                {selectedUser.id_front_url ? (
                  <img src={selectedUser.id_front_url} alt="front-large" className="w-full rounded-md object-contain" />
                ) : <div className="text-xs text-gray-400">No front image</div>}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Back</div>
                {selectedUser.id_back_url ? (
                  <img src={selectedUser.id_back_url} alt="back-large" className="w-full rounded-md object-contain" />
                ) : <div className="text-xs text-gray-400">No back image</div>}
              </div>
            </div>
            <div className="p-4 border-t text-right">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Protected route wrapper - only ADMIN role can access
const Admin = () => (
  <ProtectedRoute roles={[ 'ADMIN' ]}>
    <AdminContent />
  </ProtectedRoute>
)

export default Admin