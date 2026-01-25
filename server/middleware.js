import { verifyToken, getUserFromToken } from './auth.js';

/**
 * Middleware to extract and verify JWT token
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to check if user has specific role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Middleware to check if user is encarregado or admin
 */
export function requireEncarregado(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!['admin', 'encarregado'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Encarregado or admin access required' });
  }

  next();
}

/**
 * Middleware to check if user is authenticated (any role)
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
}

/**
 * Middleware to log activity
 */
export function logActivityMiddleware(action, entity) {
  return async (req, res, next) => {
    // Capture original send function
    const originalSend = res.send;

    res.send = function (data) {
      // Log activity after response
      if (req.user) {
        const { logActivity } = await import('./database.js');
        const ipAddress = req.ip || req.connection.remoteAddress;
        logActivity(req.user.id, action, entity, req.body.id || 'unknown', req.body, ipAddress).catch(err =>
          console.error('[Activity Log] Error logging activity:', err)
        );
      }
      return originalSend.call(this, data);
    };

    next();
  };
}
