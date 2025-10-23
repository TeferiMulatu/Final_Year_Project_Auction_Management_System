import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout, hasRole } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="w-full border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-indigo-600 text-xl">
          MAU Auctions
        </Link>
        
        <nav className="flex items-center gap-6">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'}`
            }
          >
            Home
          </NavLink>
          
          {user && (
            <>
              {hasRole('SELLER') && (
                <NavLink 
                  to="/seller" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'}`
                  }
                >
                  Seller Dashboard
                </NavLink>
              )}
              
              {hasRole('BIDDER') && (
                <NavLink 
                  to="/bidder" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'}`
                  }
                >
                  My Bids
                </NavLink>
              )}
              
              {hasRole('ADMIN') && (
                <NavLink 
                  to="/admin" 
                  className={({ isActive }) => 
                    `hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-700'}`
                  }
                >
                  Admin
                </NavLink>
              )}
            </>
          )}
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.name}</span>
                  <span className="ml-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                    {user.role}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
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


