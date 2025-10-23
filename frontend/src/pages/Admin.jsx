import { useEffect, useState } from 'react'
import api from '../services/api'
import ProtectedRoute from '../components/ProtectedRoute'

const AdminContent = () => {
  const [users, setUsers] = useState([])
  const [pendingAuctions, setPendingAuctions] = useState([])
  const [stats, setStats] = useState({ users: 0, auctions: 0, bids: 0 })
  const [activeTab, setActiveTab] = useState('dashboard')

  const load = async () => {
    const [{ data: usersData }, { data: statsData }, { data: auctionsData }] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/stats'),
      api.get('/admin/pending-auctions'),
    ])
    setUsers(usersData)
    setStats(statsData)
    setPendingAuctions(auctionsData)
  }

  useEffect(() => { load() }, [])

  const toggle = async (id) => {
    await api.post(`/admin/users/${id}/toggle`)
    await load()
  }

  const approveAuction = async (id) => {
    await api.post(`/admin/auctions/${id}/approve`)
    await load()
  }

  const rejectAuction = async (id) => {
    await api.post(`/admin/auctions/${id}/reject`)
    await load()
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('auctions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auctions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Auctions ({pendingAuctions.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Management
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-indigo-600">{stats.users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-green-600">{stats.auctions}</div>
              <div className="text-sm text-gray-600">Total Auctions</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl font-bold text-blue-600">{stats.bids}</div>
              <div className="text-sm text-gray-600">Total Bids</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Auctions Tab */}
      {activeTab === 'auctions' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Pending Auction Approvals</h2>
          </div>
          
          {pendingAuctions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No pending auctions to review.</p>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {auction.seller_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(auction.start_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(auction.ends_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveAuction(auction.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md"
                          >
                            Approve
                          </button>
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

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">User Management</h2>
          </div>
          
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggle(user.id)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          user.is_active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const Admin = () => (
  <ProtectedRoute roles={[ 'ADMIN' ]}>
    <AdminContent />
  </ProtectedRoute>
)

export default Admin


