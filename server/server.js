import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, createDefaultUsers, getAllAppData, setAppData, clearAllAppData, getAllUsers, logActivity } from './database.js';
import { authenticateUser, createToken, verifyToken, getUserFromToken } from './auth.js';
import { authMiddleware, requireAuth, requireAdmin, requireEncarregado, logActivityMiddleware } from './middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 2006;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'DELETE', 'PUT'] },
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ============ AUTHENTICATION ROUTES ============

/**
 * POST /api/auth/login
 * Login with username and password
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const authResult = await authenticateUser(username, password);

    if (!authResult) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const { user, token } = authResult;

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Log activity
    logActivity(user.id, 'LOGIN', 'AUTH', 'login', {}, req.ip || req.connection.remoteAddress).catch(err =>
      console.error('[Activity Log] Error logging login:', err)
    );

    res.json({ user, token });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    res.clearCookie('token');

    // Log activity
    logActivity(req.user.id, 'LOGOUT', 'AUTH', 'logout', {}, req.ip || req.connection.remoteAddress).catch(err =>
      console.error('[Activity Log] Error logging logout:', err)
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ============ DATA SYNC ROUTES (Compatibilidade com sistema antigo) ============

/**
 * GET /api/status
 * Server status
 */
app.get('/api/status', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'online', uptime: process.uptime() });
});

/**
 * GET /api/sync
 * Get all app data (requires authentication)
 */
app.get('/api/sync', authMiddleware, async (req, res) => {
  try {
    const data = await getAllAppData();
    res.json(data);
  } catch (error) {
    console.error('[Sync] Error getting data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sync
 * Save app data (requires authentication)
 */
app.post('/api/sync', authMiddleware, logActivityMiddleware('SAVE', 'APP_DATA'), async (req, res) => {
  try {
    const { key, data } = req.body;

    if (!key || data === undefined) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    await setAppData(key, data);

    // Emit update to all connected clients
    io.emit('atualizar_sistema', { updatedKey: key, user: req.user.username });

    res.json({ success: true });
  } catch (error) {
    console.error('[Sync] Error saving data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/restore
 * Restore all data (admin only)
 */
app.post('/api/restore', authMiddleware, requireAdmin, logActivityMiddleware('RESTORE', 'APP_DATA'), async (req, res) => {
  try {
    const fullData = req.body;

    // Clear existing data
    await clearAllAppData();

    // Insert new data
    for (const [key, value] of Object.entries(fullData)) {
      await setAppData(key, value);
    }

    // Emit update to all connected clients
    io.emit('atualizar_sistema', { action: 'restore', user: req.user.username });

    res.json({ success: true });
  } catch (error) {
    console.error('[Restore] Error restoring data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/reset
 * Reset all data (admin only)
 */
app.delete('/api/reset', authMiddleware, requireAdmin, logActivityMiddleware('RESET', 'APP_DATA'), async (req, res) => {
  try {
    await clearAllAppData();

    // Emit update to all connected clients
    io.emit('atualizar_sistema', { action: 'reset', user: req.user.username });

    res.json({ success: true });
  } catch (error) {
    console.error('[Reset] Error resetting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
app.get('/api/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('[Admin] Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('pedir_dados', () => {
    io.emit('atualizar_sistema', { action: 'sync_request' });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ============ SERVE FRONTEND ============

app.get('/', (req, res) => {
  const loginPath = path.join(__dirname, '../frontend/pages/login.html');
  res.sendFile(loginPath, (err) => {
    if (err) res.status(500).send(`Error loading login: ${err.message}`);
  });
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============

async function startServer() {
  try {
    console.log('[Database] Initializing database...');
    await initDatabase();

    console.log('[Database] Creating default users...');
    await createDefaultUsers();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [Server] Running on port ${PORT}`);
      console.log(`📊 [Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('SIGINT', () => {
      console.log('[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] Closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
