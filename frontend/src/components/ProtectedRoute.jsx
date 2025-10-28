import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute Component
 * 
 * A higher-order component that protects routes based on authentication and role-based access control.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - The child components to render if access is granted
 * @param {string[]} props.roles - Array of allowed roles for this route (optional)
 * @returns {ReactNode} - Either the children or a redirect component
 */
const ProtectedRoute = ({ children, roles }) => {
  // Get authentication state and methods from AuthContext
  const { isAuthenticated, hasRole, loading } = useAuth()

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Loading spinner animation */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated()) {
    /**
     * Navigate component redirects unauthenticated users to login page
     * replace: true - replaces current entry in history stack instead of adding new one
     */
    return <Navigate to="/login" replace />
  }

  // Check role-based access if roles are specified
  if (roles && roles.length && !hasRole(roles)) {
    /**
     * Redirect to home page if user doesn't have required role(s)
     * This prevents unauthorized access to role-specific routes
     */
    return <Navigate to="/" replace />
  }

  // User is authenticated and has required role (if specified) - render protected content
  return children
}

export default ProtectedRoute