import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logo from '../assets/MAL.png'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import socket from '../services/socket'

/**
 * Navigation Bar Component
 * 
 * Provides main navigation for the application with role-based menu items
 * and user authentication state management.
 */
const Navbar = () => {
  // Get authentication state and methods from AuthContext
  const { user, logout, hasRole } = useAuth()
  const [adminBadge, setAdminBadge] = useState(0)

  useEffect(() => {
    // Fetch initial badge counts (public endpoint)
    let mounted = true
    const load = async () => {
      try {
        const { data } = await api.get('/public/admin-badge')
        if (!mounted) return
        const total = Number(data.pendingAuctions || 0) + Number(data.pendingUsers || 0)
        setAdminBadge(total)
      } catch (e) {
        // ignore; public endpoint may be blocked in some envs
      }
    }
    load()

    const incHandler = (payload) => {
      setAdminBadge(prev => Number(prev || 0) + 1)
    }
    const decHandler = (payload) => {
      setAdminBadge(prev => Math.max(0, Number(prev || 0) - 1))
    }

    try {
      socket.on('admin_badge_increment', incHandler)
      socket.on('admin_badge_decrement', decHandler)
    } catch (e) {}

    return () => {
      mounted = false
      try { socket.off('admin_badge_increment', incHandler); socket.off('admin_badge_decrement', decHandler) } catch (e) {}
    }
  }, [])

  /**
   * Handle user logout
   * Clears authentication state and redirects user
   */
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-full bg-gradient-to-r from-indigo-50 to-white soft-shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between glass">
        {/* Logo/Brand */}
        <Link to="/" className="font-semibold text-indigo-700 text-2xl flex items-center">
          <img src={logo} alt="MAU logo" className="brand-logo mr-3" />
          <span>MAU Auction</span>
        </Link>
        
        {/* Navigation Menu */}
        <nav className="flex items-center gap-6">
          {/* Home Link - Always visible */}
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `hover:text-indigo-600 transition-colors ${
                isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
              }`
            }
          >
            Home
          </NavLink>
          
          {/* About and FAQ - public pages */}
          <NavLink to="/about" className={({ isActive }) => `hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
            About
          </NavLink>

          <NavLink 
            to="/faq" 
            className={({ isActive }) => 
              `hover:text-indigo-600 transition-colors ${
                isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
              }`
            }
          >
            FAQ
          </NavLink>
          
          {/* Role-Based Navigation Links - Only show when user is logged in */}
          {user && (
            <>
              {/* Seller Dashboard Link - Only for SELLER role */}
              {hasRole('SELLER') && (
                <NavLink 
                  to="/seller" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${
                      isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
                    }`
                  }
                >
                  Seller Dashboard
                </NavLink>
              )}
              
              {/* My Bids Link - Only for BIDDER role */}
              {hasRole('BIDDER') && (
                <NavLink 
                  to="/bidder" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${
                      isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
                    }`
                  }
                >
                  My Bids
                </NavLink>
              )}
              
              {/* Admin Dashboard Link - Only for ADMIN role */}
              <NavLink 
                to="/admin" 
                className={({ isActive }) => 
                  `hover:text-indigo-600 transition-colors ${
                    isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
                  }`
                }
              >
                <span className="inline-flex items-center">
                  Admin
                  {adminBadge > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                      {adminBadge}
                    </span>
                  )}
                </span>
              </NavLink>
            </>
          )}
          
          {/* User Authentication Section */}
          <div className="flex items-center gap-4">
            {user ? (
              /* Logged In User Menu */
              <div className="flex items-center gap-3">
                {/* User Welcome Message with Role Badge */}
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.name}</span>
                  {/* Role Badge with Color Coding */}
                  <span className="ml-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    {user.role}
                  </span>
                </span>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              /* Guest User Menu */
              <div className="flex items-center gap-3">
                {/* Login Link */}
                <Link 
                  to="/login" 
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                
                {/* Register Button with Prominent Styling */}
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default Navbar