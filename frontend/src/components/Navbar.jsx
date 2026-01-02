import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
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
  const [showBadgeActivity, setShowBadgeActivity] = useState(false)

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
      setShowBadgeActivity(true)
    }
    const decHandler = (payload) => {
      setAdminBadge(prev => Math.max(0, Number(prev || 0) - 1))
      setShowBadgeActivity(true)
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

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <div className="w-full navbar-wrapper">
      <div className="max-w-6xl mx-auto card glass navbar-inner px-4 py-3">
        {/* Logo/Brand */}
        <Link to="/" className="font-semibold text-indigo-700 text-2xl flex items-center">
          <img src={logo} alt="MAU logo" className="brand-logo mr-3" />
          <span className="text-xl text-gray-900">MAU Auction</span>
        </Link>
        
        {/* Navigation Menu */}
        <nav className="flex items-center gap-6">
          {/* Home Link - Always visible */}
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          
          {/* About and FAQ - public pages */}
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            About
          </NavLink>

          <NavLink to="/faq" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            FAQ
          </NavLink>
          
          {/* Role-Based Navigation Links - Only show when user is logged in */}
          {user && (
            <>
              {/* Seller Dashboard Link - Only for SELLER role */}
              {hasRole('SELLER') && (
                <NavLink to="/seller" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Seller Dashboard
                </NavLink>
              )}
              
              {/* My Bids Link - Only for BIDDER role */}
              {hasRole('BIDDER') && (
                <NavLink to="/bidder" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  My Bids
                </NavLink>
              )}
              {/*{hasRole('BIDDER') && (
                <NavLink to="/topup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Top Up
                </NavLink>
              )}*/}
              {/* Wallet - visible to any authenticated user */}
              {user && (
                <NavLink to="/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Wallet
                </NavLink>
              )}
              
              {/* Admin Dashboard Link - Only for ADMIN role */}
              {hasRole('ADMIN') && (
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span className="inline-flex items-center">
                    Admin
                    {adminBadge > 0 && showBadgeActivity && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                        {adminBadge}
                      </span>
                    )}
                  </span>
                </NavLink>
              )}
              {hasRole('ADMIN') && (
                <NavLink to="/admin/topups" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Top-ups
                </NavLink>
              )}
            </>
          )}
          
          {/* User Authentication Section */}
          <div className="flex items-center gap-4">
            {user ? (
              /* Logged In User Menu */
                <div className="flex items-center gap-3">
                    <div className="relative" ref={userMenuRef}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowUserMenu(s => !s)}>
                        <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-lg">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>

                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                          <div className="p-3">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500 mb-2">{user.email}</div>
                            <div className="text-xs text-gray-600 mb-3">Role: <span className="font-semibold">{user.role}</span></div>
                            <div className="flex gap-2">
                              <button onClick={handleLogout} className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Logout</button>
                              <a href="/profile" className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">Profile</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                <Link to="/register" className="btn btn-primary">
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