import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user payload to request
 */
export function authenticate(req, res, next) {
  // Extract token from Authorization header (format: "Bearer <token>")
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  // Reject request if no token provided
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    // Verify token signature and decode payload
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // Attach user data to request object { id, role }
    next(); // Proceed to next middleware/route handler
  } catch (err) {
    // Handle invalid or expired tokens
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Role-Based Authorization Middleware
 * Checks if authenticated user has required role(s) to access the route
 */
export function authorize(roles = []) {
  // Convert single role to array for consistent processing
  const allowed = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    // Check if user's role is in allowed roles list
    if (allowed.length && !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next(); // User has required role, proceed to route handler
  };
}

