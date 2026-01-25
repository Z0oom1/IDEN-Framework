import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByUsername, getUserById } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token
 */
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username, password) {
  try {
    const user = await getUserByUsername(username);

    if (!user) {
      console.warn(`[Auth] User not found: ${username}`);
      return null;
    }

    if (!user.isActive) {
      console.warn(`[Auth] User inactive: ${username}`);
      return null;
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      console.warn(`[Auth] Invalid password for user: ${username}`);
      return null;
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      sector: user.sector,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        sector: user.sector,
        subType: user.subType,
      },
      token,
    };
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return null;
  }
}

/**
 * Get user from token
 */
export async function getUserFromToken(token) {
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.id);

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(user, requiredRole) {
  if (!user) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return hasRole(user, 'admin');
}

/**
 * Check if user is encarregado or admin
 */
export function isEncarregado(user) {
  return hasRole(user, ['admin', 'encarregado']);
}
