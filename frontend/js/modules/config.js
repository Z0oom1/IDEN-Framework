// ===================================================================================
//          MÓDULO DE CONFIGURAÇÃO E INICIALIZAÇÃO
// ===================================================================================

let globalAudioCtx = null;

const getBaseUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = "2006"; // Porta ajustada conforme server.js
    
    // Configuração de IP do Servidor para clientes Electron Remotos
    // Tenta pegar do LocalStorage (configurado na UI) ou usa fallback
    const savedIP = localStorage.getItem('server_ip');
    const SERVER_IP_FALLBACK = savedIP || "localhost"; 

    if (protocol === 'file:') {
        return `http://${SERVER_IP_FALLBACK}:${port}`;
    } else {
        return `${protocol}//${hostname}:${port}`;
    }
};

const API_URL = getBaseUrl();
const API_BASE_URL = API_URL; // Alias para compatibilidade
console.log("Conectando ao servidor em:", API_URL);

let socket;

window.initRealTimeSystem = function() {
    try {
        if (typeof io !== 'undefined') {
            socket = io(API_URL);

            socket.on('connect', () => {
                console.log("Socket conectado!", socket.id);
                const statusEl = document.getElementById('socketStatus');
                if(statusEl) {
                    statusEl.innerHTML = '<div style="width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 5px #10b981;"></div> Online';
                    statusEl.style.color = '#10b981';
                }
                // Tenta carregar dados ao conectar
                if(typeof loadDataFromServer === 'function') loadDataFromServer();
                else if(typeof loadData === 'function') loadData();
            });

            socket.on('disconnect', () => {
                const statusEl = document.getElementById('socketStatus');
                if(statusEl) {
                    statusEl.innerHTML = '<div style="width:8px; height:8px; background:#ef4444; border-radius:50%;"></div> Offline';
                    statusEl.style.color = '#ef4444';
                }
            });

            socket.on('atualizar_sistema', (data) => {
                console.log("Recebida atualização do servidor:", data);
                if(typeof loadDataFromServer === 'function') loadDataFromServer();
                
                // Atualiza views ativas
                const activeView = document.querySelector('.view-section.active');
                if(activeView) {
                    if (activeView.id === 'view-patio' && typeof renderPatio === 'function') renderPatio();
                    if (activeView.id === 'view-mapas' && typeof renderMapList === 'function') renderMapList();
                    if (activeView.id === 'view-materia-prima' && typeof renderMateriaPrima === 'function') renderMateriaPrima();
                    if (activeView.id === 'view-carregamento' && typeof renderCarregamento === 'function') renderCarregamento();
                    if (activeView.id === 'view-cadastros' && typeof renderCadastros === 'function') renderCadastros();
                }
                
                if(typeof checkNotifications === 'function') checkNotifications();
            });
        } else {
            console.error("ERRO: Socket.io não foi carregado no HTML.");
        }
    } catch (e) {
        console.warn("Erro ao iniciar Socket:", e);
    }
};

function initRoleBasedUI() {
    if (localStorage.getItem('aw_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        const tg = document.getElementById('darkModeToggle');
        if (tg) tg.checked = true;
    }
    if (localStorage.getItem('aw_fast_mode') === 'true') {
        document.body.classList.add('fast-mode');
        const ftg = document.getElementById('fastModeToggle');
        if (ftg) ftg.checked = true;
    }

    if (typeof isConferente !== 'undefined' && isConferente) {
        const fab = document.getElementById('fabAddTruck'); if (fab) fab.style.display = 'none';
        const mc = document.getElementById('menuCarregamento'); if (mc) mc.style.display = 'none';
    } else {
        const fab = document.getElementById('fabAddTruck'); if (fab) fab.style.display = 'flex';
        const mc = document.getElementById('menuCarregamento'); if (mc) mc.style.display = 'flex';
    }

    const mmp = document.getElementById('menuMateriaPrima');
    if (typeof isRecebimento !== 'undefined') {
        if (mmp) mmp.style.display = isRecebimento ? 'flex' : 'none';
    }

    const menuDash = document.getElementById('menuDashboard');
    const isEnc = typeof isEncarregado !== 'undefined' ? isEncarregado : false;
    const isAdm = typeof isAdmin !== 'undefined' ? isAdmin : false;
    const canViewDash = isEnc || isAdm;

    if (menuDash) {
        menuDash.style.display = canViewDash ? 'flex' : 'none';
    }

    // Controle de acesso ao menu de cadastros - Almoxarifado não tem acesso
    const menuCadastros = document.getElementById('menuCadastros');
    const isAlmoxarifado = typeof userSubType !== 'undefined' && userSubType === 'ALM';
    if (menuCadastros) {
        menuCadastros.style.display = isAlmoxarifado ? 'none' : 'flex';
    }

    if (typeof isConferente !== 'undefined' && isConferente && typeof userSubType !== 'undefined' && userSubType) {
        const cA = document.getElementById('col-ALM');
        const cG = document.getElementById('col-GAVA');
        const cO = document.getElementById('col-OUT');

        if (cA) cA.style.display = 'none';
        if (cG) cG.style.display = 'none';
        if (cO) cO.style.display = 'none';

        if (userSubType === 'ALM') {
            if (cA) cA.style.display = 'flex';
            if (cG) cG.style.display = 'flex';
        } else if (userSubType === 'GAVA') {
            if (cG) cG.style.display = 'flex';
        } else {
            if (cO) cO.style.display = 'flex';
            const sn = { 'INFRA': 'INFRAESTRUTURA', 'MANUT': 'MANUTENÇÃO', 'LAB': 'LABORATÓRIO', 'PESAGEM': 'PESAGEM', 'SST': 'SST', 'CD': 'CD', 'COMPRAS': 'COMPRAS' };
            const tit = cO.querySelector('.col-header');
            if (tit && sn[userSubType]) tit.innerHTML = sn[userSubType] + ' <span id="count-OUT">0</span>';
        }
    }

    ['patioDateFilter', 'mapDate', 'mpDateFilter', 'carrDateFilter', 'mapListDateFilter', 'repDateStart', 'repDateEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = getBrazilTime().split('T')[0];
    });

    setInterval(() => { const el = document.getElementById('serverTime'); if (el) el.textContent = new Date().toLocaleTimeString(); }, 1000);
}

function toggleDarkMode() { const c = document.getElementById('darkModeToggle').checked; if (c) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode'); localStorage.setItem('aw_dark_mode', c); }

function toggleFastMode() {
    const isChecked = document.getElementById('fastModeToggle').checked;
    if (isChecked) {
        document.body.classList.add('fast-mode');
    } else {
        document.body.classList.remove('fast-mode');
    }
    localStorage.setItem('aw_fast_mode', isChecked);
}

function updatePermissionStatus() { loadPresets(); }

function manualRequestPermission() {
    if (!("Notification" in window)) {
        alert("Este navegador não suporta notificações de sistema.");
        return;
    }
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            playBeep();
            const notif = new Notification("Configuração", {
                body: "Notificações ativadas com sucesso!",
                icon: '../Imgs/logo-sf.png'
            });
        } else {
            alert("Permissão para notificações foi negada ou bloqueada pelo navegador.");
        }
    });
}

function saveServerIP() {
    const ip = document.getElementById('cfgServerIP').value;
    if(ip) {
        localStorage.setItem('server_ip', ip);
        alert("IP salvo! O sistema será recarregado para aplicar as alterações.");
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('cfgServerIP');
    if(el) el.value = localStorage.getItem('server_ip') || '';
});
