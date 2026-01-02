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
  const [showPassword, setShowPassword] = useState(false)
  
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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.965 9.965 0 012.223-3.338M6.6 6.6A9.958 9.958 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.943 9.943 0 01-1.481 3.035M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

          <div className="text-center">
            <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">Forgot password?</a>
          </div>

          {/* Demo Accounts Section - Helpful for testing
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Demo accounts:</p>
            <p>Admin: admin@gmail.com / admin@123</p>
            <p>Seller: seller@gmail.com / seller@123</p>
            <p>Bidder: bidder@gmail.com / bidder@123</p>
          </div>
           */}
        </form>
      </div>
    </div>
  )
}

export default Login