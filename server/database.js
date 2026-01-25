import mysql from 'mysql2/promise';
import { hashPassword } from './auth.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wilson_control',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Initialize database tables
 */
export async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        role ENUM('admin', 'encarregado', 'operador', 'conferente') DEFAULT 'operador',
        sector VARCHAR(100),
        subType VARCHAR(100),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_role (role)
      )
    `);

    // App data table (para compatibilidade com sistema antigo)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key (key)
      )
    `);

    // Activity logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        action VARCHAR(255),
        entity VARCHAR(100),
        entityId VARCHAR(255),
        changes LONGTEXT,
        ipAddress VARCHAR(45),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        INDEX idx_userId (userId),
        INDEX idx_createdAt (createdAt)
      )
    `);

    console.log('[Database] Tables initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing tables:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Create default users
 */
export async function createDefaultUsers() {
  const connection = await pool.getConnection();
  try {
    const defaultUsers = [
      {
        username: 'admin',
        password: '123456',
        name: 'Administrador',
        email: 'admin@wilson.local',
        role: 'admin',
        sector: 'admin',
      },
      {
        username: 'encarregado',
        password: '123456',
        name: 'Encarregado',
        email: 'encarregado@wilson.local',
        role: 'encarregado',
        sector: 'recebimento',
      },
      {
        username: 'operador',
        password: '123456',
        name: 'Operador',
        email: 'operador@wilson.local',
        role: 'operador',
        sector: 'recebimento',
      },
      {
        username: 'conferente',
        password: '123456',
        name: 'Conferente',
        email: 'conferente@wilson.local',
        role: 'conferente',
        sector: 'conferente',
        subType: 'ALM',
      },
      // Legacy test accounts
      { username: 'Fabricio', password: '123', name: 'Fabricio', role: 'conferente', sector: 'conferente', subType: 'ALM' },
      { username: 'Clodoaldo', password: '123', name: 'Clodoaldo', role: 'conferente', sector: 'conferente', subType: 'ALM' },
      { username: 'Guilherme', password: '123', name: 'Guilherme', role: 'conferente', sector: 'conferente', subType: 'GAVA' },
      { username: 'Wayner', password: '123', name: 'Wayner', role: 'conferente', sector: 'conferente', subType: 'INFRA' },
      { username: 'Caio', password: '123', name: 'Caio', role: 'operador', sector: 'recebimento' },
      { username: 'Balanca', password: '123', name: 'Balança', role: 'operador', sector: 'recebimento' },
      { username: 'EncarRec', password: 'enc123', name: 'Encarregado Recebimento', role: 'encarregado', sector: 'recebimento' },
      { username: 'EncarConf', password: 'enc123', name: 'Encarregado Conferência', role: 'encarregado', sector: 'conferente' },
    ];

    for (const user of defaultUsers) {
      try {
        const existing = await connection.execute('SELECT id FROM users WHERE username = ?', [user.username]);
        if (existing[0].length === 0) {
          const hashedPassword = await hashPassword(user.password);
          await connection.execute(
            'INSERT INTO users (username, password, name, email, role, sector, subType, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
            [
              user.username,
              hashedPassword,
              user.name || user.username,
              user.email || `${user.username}@wilson.local`,
              user.role || 'operador',
              user.sector || 'recebimento',
              user.subType || null,
            ]
          );
          console.log(`[Database] Created user: ${user.username}`);
        }
      } catch (error) {
        console.error(`[Database] Error creating user ${user.username}:`, error.message);
      }
    }
  } finally {
    connection.release();
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, username, name, email, role, sector, subType, isActive, createdAt FROM users');
    return rows;
  } finally {
    connection.release();
  }
}

/**
 * Get app data by key
 */
export async function getAppData(key) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT value FROM app_data WHERE key = ?', [key]);
    if (rows.length === 0) return null;
    try {
      return JSON.parse(rows[0].value);
    } catch {
      return rows[0].value;
    }
  } finally {
    connection.release();
  }
}

/**
 * Get all app data
 */
export async function getAllAppData() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT key, value FROM app_data');
    const data = {};
    rows.forEach(row => {
      try {
        data[row.key] = JSON.parse(row.value);
      } catch {
        data[row.key] = row.value;
      }
    });
    return data;
  } finally {
    connection.release();
  }
}

/**
 * Set app data
 */
export async function setAppData(key, value) {
  const connection = await pool.getConnection();
  try {
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    await connection.execute(
      'INSERT INTO app_data (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [key, jsonStr]
    );
    return true;
  } finally {
    connection.release();
  }
}

/**
 * Delete app data
 */
export async function deleteAppData(key) {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM app_data WHERE key = ?', [key]);
    return true;
  } finally {
    connection.release();
  }
}

/**
 * Clear all app data
 */
export async function clearAllAppData() {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM app_data');
    return true;
  } finally {
    connection.release();
  }
}

/**
 * Log activity
 */
export async function logActivity(userId, action, entity, entityId, changes, ipAddress) {
  const connection = await pool.getConnection();
  try {
    const changesStr = typeof changes === 'string' ? changes : JSON.stringify(changes);
    await connection.execute(
      'INSERT INTO activity_logs (userId, action, entity, entityId, changes, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, action, entity, entityId, changesStr, ipAddress]
    );
    return true;
  } finally {
    connection.release();
  }
}

export default pool;
