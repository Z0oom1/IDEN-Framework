const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')

const PORT = 2006
const DB_FILE = 'database.sqlite'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] }
})

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app.use(express.static(path.join(__dirname, '../frontend')))

app.get('/', (req, res) => {
    const loginPath = path.join(__dirname, '../frontend/pages/login.html')
    res.sendFile(loginPath, (err) => {
        if (err) res.status(500).send(`Erro ao carregar login: ${err.message}`)
    })
})

const dbPath = path.join(__dirname, DB_FILE)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir banco de dados:", err.message)
    } else {
        initDb()
    }
})

function initDb() {
    db.run('PRAGMA journal_mode = WAL;')
    db.run(`CREATE TABLE IF NOT EXISTS app_data (
        key TEXT PRIMARY KEY,
        value TEXT
    )`)
}

io.on('connection', (socket) => {
    socket.on('pedir_dados', () => io.emit('atualizar_sistema'))
})

app.get('/api/status', (req, res) => {
    res.set('Cache-Control', 'no-store')
    res.json({ status: 'online', uptime: process.uptime() })
})

app.get('/api/sync', (req, res) => {
    db.all(`SELECT * FROM app_data`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message })
        const data = {}
        rows.forEach(row => {
            try { data[row.key] = JSON.parse(row.value) } 
            catch { data[row.key] = row.value }
        })
        res.json(data)
    })
})

app.post('/api/sync', (req, res) => {
    const { key, data } = req.body
    if (!key || data === undefined) return res.status(400).json({ error: 'Parâmetros inválidos' })
    
    let jsonStr
    try { jsonStr = typeof data === 'string' ? data : JSON.stringify(data) } 
    catch { return res.status(400).json({ error: 'JSON inválido' }) }

    const sql = `INSERT INTO app_data (key, value) VALUES (?, ?) 
                 ON CONFLICT(key) DO UPDATE SET value=excluded.value`

    db.run(sql, [key, jsonStr], (err) => {
        if (err) return res.status(500).json({ error: err.message })
        io.emit('atualizar_sistema', { updatedKey: key })
        res.json({ success: true })
    })
})

app.post('/api/restore', (req, res) => {
    const fullData = req.body;
    db.serialize(() => {
        db.run('DELETE FROM app_data');
        const stmt = db.prepare('INSERT INTO app_data (key, value) VALUES (?, ?)');
        Object.keys(fullData).forEach(key => {
            stmt.run(key, JSON.stringify(fullData[key]));
        });
        stmt.finalize(() => {
            io.emit('atualizar_sistema');
            res.json({ success: true });
        });
    });
});

app.delete('/api/reset', (req, res) => {
    db.run('DELETE FROM app_data', [], (err) => {
        if (err) return res.status(500).json({ error: err.message })
        io.emit('atualizar_sistema')
        res.json({ success: true })
    })
})

server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor rodando na porta ${PORT}`))
process.on('SIGINT', () => db.close(() => process.exit(0)))