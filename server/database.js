import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { hashPassword } from './auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexão com SQLite
let db;

async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, 'wilson.sqlite'),
      driver: sqlite3.Database
    });
  }
  return db;
}

/**
 * Initialize database tables
 */
export async function initDatabase() {
  const database = await getDb();
  try {
    // Users table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT CHECK(role IN ('admin', 'encarregado', 'operador', 'conferente')) DEFAULT 'operador',
        sector TEXT,
        subType TEXT,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // App data table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Activity logs table
    await database.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT,
        entity TEXT,
        entityId TEXT,
        changes TEXT,
        ipAddress TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    console.log('[Database] SQLite tables initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing tables:', error);
    throw error;
  }
}

/**
 * Create default users
 */
export async function createDefaultUsers() {
  const database = await getDb();
  try {
    const defaultUsers = [
      { username: 'Admin', password: '123', name: 'Administrador', role: 'admin', sector: 'recebimento' },
      { username: 'Fabricio', password: '123', name: 'Fabricio', role: 'conferente', sector: 'conferente', subType: 'ALM' },
      { username: 'Clodoaldo', password: '123', name: 'Clodoaldo', role: 'conferente', sector: 'conferente', subType: 'ALM' },
      { username: 'Guilherme', password: '123', name: 'Guilherme', role: 'conferente', sector: 'conferente', subType: 'GAVA' },
      { username: 'Wayner', password: '123', name: 'Wayner', role: 'conferente', sector: 'conferente', subType: 'INFRA' },
      { username: 'Outros', password: '123', name: 'Outros', role: 'conferente', sector: 'conferente', subType: 'OUT' },
      { username: 'Caio', password: '123', name: 'Caio', role: 'operador', sector: 'recebimento' },
      { username: 'Balanca', password: '123', name: 'Balanca', role: 'operador', sector: 'recebimento' },
      { username: 'EncarRec', password: 'enc123', name: 'Encarregado Recebimento', role: 'encarregado', sector: 'recebimento' },
      { username: 'EncarConf', password: 'enc123', name: 'Encarregado Conferencia', role: 'encarregado', sector: 'conferente' }
    ];

    for (const user of defaultUsers) {
      const existing = await database.get('SELECT id FROM users WHERE username = ?', [user.username]);
      if (!existing) {
        const hashedPassword = await hashPassword(user.password);
        await database.run(
          'INSERT INTO users (username, password, name, role, sector, subType, isActive) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
          [user.username, hashedPassword, user.name, user.role, user.sector, user.subType]
        );
        console.log(`[Database] Created user: ${user.username}`);
      }
    }
  } catch (error) {
    console.error('[Database] Error creating default users:', error);
  }
}

export async function getUserByUsername(username) {
  const database = await getDb();
  // Usando COLLATE NOCASE para busca case-insensitive no SQLite
  return await database.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
}

export async function getUserById(id) {
  const database = await getDb();
  return await database.get('SELECT * FROM users WHERE id = ?', [id]);
}

export async function getAllUsers() {
  const database = await getDb();
  return await database.all('SELECT id, username, name, email, role, sector, subType, isActive, createdAt FROM users');
}

export async function getAppData(key) {
  const database = await getDb();
  const row = await database.get('SELECT value FROM app_data WHERE key = ?', [key]);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export async function getAllAppData() {
  const database = await getDb();
  const rows = await database.all('SELECT key, value FROM app_data');
  const data = {};
  rows.forEach(row => {
    try {
      data[row.key] = JSON.parse(row.value);
    } catch {
      data[row.key] = row.value;
    }
  });
  return data;
}

export async function setAppData(key, value) {
  const database = await getDb();
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
  await database.run(
    'INSERT INTO app_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, jsonStr]
  );
  return true;
}

export async function clearAllAppData() {
  const database = await getDb();
  await database.run('DELETE FROM app_data');
  return true;
}

export async function logActivity(userId, action, entity, entityId, changes, ipAddress) {
  const database = await getDb();
  const changesStr = typeof changes === 'string' ? changes : JSON.stringify(changes);
  await database.run(
    'INSERT INTO activity_logs (userId, action, entity, entityId, changes, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, action, entity, entityId, changesStr, ipAddress]
  );
  return true;
}

export default { getDb };
