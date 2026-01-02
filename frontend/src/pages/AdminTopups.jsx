import { useEffect, useState } from 'react'
import api from '../services/api'
import formatCurrency from '../utils/currency'

const AdminTopups = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin/wallet-topups')
      setRows(data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handle = async (id, action) => {
    try {
      await api.post(`/admin/wallet-topups/${id}/${action}`)
      load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Action failed')
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Pending Top-up Requests</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b">
            <div className="text-sm text-gray-600">Showing {rows.length} request{rows.length !== 1 ? 's' : ''}</div>
          </div>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No pending top-up requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Note</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 border-b">
                      <td className="px-4 py-3 align-top text-sm font-medium">#{r.id}</td>
                      <td className="px-4 py-3 align-top text-sm">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-900">{formatCurrency(Number(r.amount))}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700">{r.note || '-'}</td>
                      <td className="px-4 py-3 align-top text-sm text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 align-top text-sm">
                        {r.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (window.confirm('Approve this top-up request?')) handle(r.id, 'approve')
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Reject this top-up request?')) handle(r.id, 'reject')
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{r.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminTopups
