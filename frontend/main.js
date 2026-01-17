const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

function createWindow() {
    // Configuração Estética da Janela
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Mantém o design sem borda padrão
        autoHideMenuBar: true,
        backgroundColor: '#1a1a1a', // Ajustado para um dark mode suave enquanto carrega
        icon: path.join(__dirname, 'Imgs', 'logo.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // [CORREÇÃO] Porta alterada para 2006 para coincidir com o server.js
    const port = 2006;
    const serverUrl = `http://localhost:${port}/`; 

    // Tenta carregar do servidor local
    win.loadURL(serverUrl).catch((err) => {
        console.log(`❌ Erro ao conectar na porta ${port}. Carregando modo offline...`);
        // Fallback para arquivo local caso o servidor não esteja rodando
        win.loadFile(path.join(__dirname, 'pages', 'login.html'));
    });

    // --- CONTROLES DE JANELA (IPC) ---
    ipcMain.on('minimize-app', () => win.minimize());
    
    ipcMain.on('maximize-app', () => {
        win.isMaximized() ? win.unmaximize() : win.maximize();
    });

    ipcMain.on('close-app', () => win.close());

    // Limpeza de listeners para evitar vazamento de memória
    win.on('closed', () => {
        ipcMain.removeAllListeners('minimize-app');
        ipcMain.removeAllListeners('maximize-app');
        ipcMain.removeAllListeners('close-app');
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});