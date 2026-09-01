const jwt = require('jsonwebtoken');
const { get } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'seqa-retest-execution-logger-college-key-2026';

/**
 * Middleware to authenticate requests using JWT Bearer token
 * Fetches user fresh from SQLite database to guarantee current role & existence
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

/**
 * Middleware to restrict access to specific roles
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRoles,
  JWT_SECRET
};
