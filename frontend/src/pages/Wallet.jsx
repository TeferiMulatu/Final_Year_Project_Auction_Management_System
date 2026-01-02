import { useEffect, useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import formatCurrency from '../utils/currency'

const Wallet = () => {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [topups, setTopups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/wallet')
        setBalance(data.balance)
        setTransactions(data.transactions || [])
        setTopups(data.topups || [])
      } catch (e) {
        console.error('Failed to load wallet', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-4">Loading wallet...</div>

  return (
    <ProtectedRoute roles={["BIDDER","SELLER","ADMIN"]}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Wallet</h1>
        <div className="mb-6 p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Available balance</div>
          <div className="text-3xl font-bold">{formatCurrency(balance)}</div>
          <div className="mt-4">
            {user?.role === 'BIDDER' && (
              <a href="/topup" className="btn btn-primary">Add Funds</a>
            )}
          </div>
        </div>

        {/* Top-up request history (for bidders) */}
        {user?.role === 'BIDDER' && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-medium mb-3">Top-up Requests</h2>
            {transactions && transactions.length === 0 && (!Array.isArray(topups) || topups.length === 0) ? (
              <div className="text-gray-500">No activity yet.</div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(topups) && topups.length > 0 ? (
                  <div className="divide-y">
                    {topups.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2">
                        <div>
                          <div className="text-sm font-medium">{formatCurrency(t.amount)}</div>
                          <div className="text-xs text-gray-500">Requested: {new Date(t.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-sm">
                          {t.status === 'PENDING' && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">Pending</span>}
                          {t.status === 'APPROVED' && <span className="px-3 py-1 rounded-full bg-green-100 text-green-800">Approved</span>}
                          {t.status === 'REJECTED' && <span className="px-3 py-1 rounded-full bg-red-100 text-red-800">Rejected</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No top-up requests yet.</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <div className="text-gray-500">No transactions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-t">
                    <td className="py-2">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="py-2">{tx.type}</td>
                    <td className="py-2">{formatCurrency(tx.amount)}</td>
                    <td className="py-2">{tx.note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Wallet
