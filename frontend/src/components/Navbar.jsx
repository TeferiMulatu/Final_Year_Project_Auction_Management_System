import { Link, NavLink } from 'react-router-dom'
import logo from '../assets/MAL.png'
import { useAuth } from '../contexts/AuthContext'

/**
 * Navigation Bar Component
 * 
 * Provides main navigation for the application with role-based menu items
 * and user authentication state management.
 */
const Navbar = () => {
  // Get authentication state and methods from AuthContext
  const { user, logout, hasRole } = useAuth()

  /**
   * Handle user logout
   * Clears authentication state and redirects user
   */
  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-full border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link to="/" className="font-semibold text-indigo-600 text-xl flex items-center">
          <img src={logo} alt="MAU logo" className="h-16 w-auto mr-2" />
          <span>MAU Auction Management System</span>
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
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              `hover:text-indigo-600 transition-colors ${
                isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
              }`
            }
          >
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
              {hasRole('ADMIN') && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${
                      isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
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
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors"
                >
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