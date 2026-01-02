import { useState } from 'react'
import api from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setStatus({ ok: true, message: 'If that email exists, a reset link has been sent.' })
    } catch (e) {
      setStatus({ ok: false, message: e?.response?.data?.message || 'Failed to request reset' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Forgot password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Enter the email for your account and we'll send a reset link.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {status && (
            <div className={`text-sm text-center ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.message}</div>
          )}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
