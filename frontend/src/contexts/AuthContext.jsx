import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import socket from '../services/socket'
import { useToast } from './ToastContext'

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
  const { addToast } = useToast()

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')
    const role = sessionStorage.getItem('role')

  // If authentication data exists in sessionStorage, restore user session
    if (token && userData && role) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser({ ...parsedUser, role }) // Combine user data with role
        // Connect socket and join user-specific room for notifications
        try {
          socket.connect()
          socket.emit('join_user', parsedUser.id)
          if (parsedUser.role === 'ADMIN') {
            try { socket.emit('join_admin') } catch (e) { console.warn('join_admin failed', e) }
          }
          // Use toast for incoming notifications
          socket.on('notification', (payload) => {
            try { addToast({ message: payload.message, type: 'info' }) } catch (e) {}
          })
        } catch (e) { console.warn('Socket join_user failed', e) }
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
      
  // Store authentication data in sessionStorage so session ends on browser/tab close
  sessionStorage.setItem('token', data.token)
  sessionStorage.setItem('user', JSON.stringify(data.user))
  sessionStorage.setItem('role', data.user.role)
      
      // Update global user state
      setUser(data.user)
      // Connect to socket and join personal room for notifications
      try {
        socket.connect()
        socket.emit('join_user', data.user.id)
        if (data.user.role === 'ADMIN') {
          try { socket.emit('join_admin') } catch (e) { console.warn('join_admin failed', e) }
        }
        socket.on('notification', (payload) => {
          try { addToast({ message: payload.message, type: 'info' }) } catch (e) {}
        })
      } catch (e) { console.warn('Socket join_user failed', e) }
      
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
  // Remove all authentication data from sessionStorage
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('role')
    
    // Clear user state
    setUser(null)
    try {
      socket.off('notification')
      socket.emit('leave_user', user?.id)
      socket.disconnect()
    } catch (e) {}
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} - True if user is logged in and has valid token
   */
  const isAuthenticated = () => {
    // Check sessionStorage for token so session ends when browser/tab closes
    return !!user && !!sessionStorage.getItem('token')
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