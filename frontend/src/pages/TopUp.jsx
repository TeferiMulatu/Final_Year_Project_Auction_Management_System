import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AMOUNTS = [1000, 2500, 5000, 10000, 50000]

const TopUp = () => {
  const [amount, setAmount] = useState(AMOUNTS[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const amt = Number(amount)
    if (!amt || amt <= 0) return setError('Enter a valid amount')
    setLoading(true)
    try {
      await api.post('/wallet/topup', { amount: amt, note })
      setSuccess('Top-up request submitted — awaiting admin approval')
      // navigate back to wallet after short delay
      setTimeout(() => navigate('/wallet'), 1200)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit top-up')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Add Funds</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select amount (ETB)</label>
          <div className="mt-2 flex gap-2 flex-wrap">
            {AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={`px-4 py-2 rounded border ${amount === a ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                {a.toLocaleString()} ETB
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded" />
        </div>

        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}

        <div>
          <button disabled={loading} className="btn btn-primary">{loading ? 'Submitting...' : `Add Funds (${Number(amount).toLocaleString()} ETB)`}</button>
        </div>
      </form>
    </div>
  )
}

export default TopUp
