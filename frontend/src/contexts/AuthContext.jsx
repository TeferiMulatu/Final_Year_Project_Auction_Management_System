import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

// Create authentication context for global state management
const AuthContext = createContext()

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider component
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Authentication Provider Component
 * Manages global authentication state and provides auth methods to entire app
 */
export const AuthProvider = ({ children }) => {
  // State for current user data and loading status
  const [user, setUser] = useState(null) // Currently logged in user
  const [loading, setLoading] = useState(true) // Initial loading state

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const role = localStorage.getItem('role')

    // If authentication data exists in localStorage, restore user session
    if (token && userData && role) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({ ...parsedUser, role }) // Combine user data with role
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout() // Clear corrupted data
      }
    }
    setLoading(false) // Initial loading complete
  }, [])

  /**
   * Login function - authenticates user and stores session data
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Object} - Success status and user data or error message
   */
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      
      // Store authentication data in localStorage for persistence
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('role', data.user.role)
      
      // Update global user state
      setUser(data.user)
      
      return { success: true, user: data.user }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  /**
   * Register function - creates new user account
   * @param {Object} userData - User registration data (name, email, password, role)
   * @returns {Object} - Success status and user data or error message
   */
 const register = async (userData) => {
  try {
    console.log('Sending registration data:', userData);
    const { data } = await api.post('/auth/register', userData);
    return { success: true, user: data };
  } catch (error) {
    console.error('Full registration error:', error);
    console.error('Error response:', error.response?.data);

    const apiData = error.response?.data;
    let message = apiData?.message || 'Registration failed';
    if (apiData?.errors && Array.isArray(apiData.errors) && apiData.errors.length > 0) {
      message = apiData.errors[0].msg || message;
    }

    return { 
      success: false, 
      error: message 
    };
  }
};

  /**
   * Logout function - clears user session and authentication data
   */
  const logout = () => {
    // Remove all authentication data from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    
    // Clear user state
    setUser(null)
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} - True if user is logged in and has valid token
   */
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token')
  }

  /**
   * Check if current user has required role(s)
   * @param {string|string[]} roles - Single role or array of roles to check against
   * @returns {boolean} - True if user has at least one of the required roles
   */
  const hasRole = (roles) => {
    if (!user) return false // No user = no roles
    
    // Convert single role to array for consistent processing
    const userRoles = Array.isArray(roles) ? roles : [roles]
    
    // Check if user's role is included in required roles
    return userRoles.includes(user.role)
  }

  // Value object provided to context consumers
  const value = {
    user,           // Current user object
    loading,        // Initial loading state
    login,          // Login function
    register,       // Register function
    logout,         // Logout function
    isAuthenticated, // Authentication check
    hasRole         // Role-based access control
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}