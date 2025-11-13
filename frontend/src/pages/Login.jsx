import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  // State for login form data - only email and password needed
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  })
  
  // State for error messages and loading status
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Navigation hook for redirecting after successful login
  const navigate = useNavigate()
  
  // Authentication function from context
  const { login } = useAuth()

  // Handle input changes and clear any existing errors
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('') // Clear error when user starts typing
  }

  // Handle form submission for user login
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent default form submission
    setLoading(true) // Start loading state
    setError('') // Reset error state

    // Attempt to login with provided credentials
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      // Redirect user based on their role after successful login
      if (result.user.role === 'ADMIN') {
        navigate('/admin') // Admin dashboard
      } else if (result.user.role === 'SELLER') {
        navigate('/seller') // Seller dashboard
      } else {
        navigate('/') // Default route for BIDDER - auction listing
      }
    } else {
      // Display login error from API
      setError(result.error, "cant login")
    }
    
    setLoading(false) // End loading state
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Input Fields Container with rounded corners */}
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email Input Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            {/* Password Input Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Demo Accounts Section - Helpful for testing */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Demo accounts:</p>
            <p>Admin: admin@gmail.com / admin@123</p>
            <p>Seller: seller@gmail.com / seller@123</p>
            <p>Bidder: bidder@gmail.com / bidder@123</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login