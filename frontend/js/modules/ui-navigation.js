// ===================================================================================
//          MÓDULO DE UI E NAVEGAÇÃO
// ===================================================================================

function toggleMobileMenu() { const sb = document.querySelector('.main-sidebar'); if (sb) sb.classList.toggle('show-mobile'); }
function toggleMapListMobile() { const mm = document.getElementById('mobileMapList'); if (mm) mm.classList.toggle('open'); }

function navTo(view, el) {
    // Bloqueia acesso ao cadastro para usuários do almoxarifado
    if (view === 'cadastros' && typeof userSubType !== 'undefined' && userSubType === 'ALM') {
        alert('Acesso negado: Usuários do almoxarifado não têm permissão para acessar cadastros.');
        return;
    }

    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const t = document.getElementById('view-' + view);
    if (t) t.classList.add('active');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
        const link = document.querySelector(`.menu-item[onclick*="'${view}'"]`);
        if (link) link.classList.add('active');
    }

    const mainSide = document.querySelector('.main-sidebar'); if (mainSide) mainSide.classList.remove('show-mobile');

    const titles = {
        home: 'Dashboard Principal',
        patio: 'Controle de Pátio',
        mapas: 'Mapas Cegos',
        relatorios: 'Relatórios',
        notificacoes: 'Notificações',
        cadastros: 'Cadastros Gerais',
        produtos: 'Catálogo de Produtos',
        'materia-prima': 'Matéria Prima',
        'carregamento': 'Carregamento',
        'configuracoes': 'Configurações',
        'perfil': 'Área do Usuário',
        'dashboard': 'Dashboard'
    };

    if (view === 'produtos') renderProductsView();

    const currentTitle = titles[view] || 'Home Page';
    const pt = document.getElementById('pageTitle');
    if (pt) pt.textContent = currentTitle;

    const appTitle = document.querySelector('.app-title');
    if (appTitle) {
        appTitle.innerText = `${currentTitle.toUpperCase()}`;
    }

    if (view === 'patio') renderPatio();
    if (view === 'mapas') { renderMapList(); updateMapState(); }
    if (view === 'materia-prima') renderMateriaPrima();
    if (view === 'carregamento') renderCarregamento();
    if (view === 'cadastros') renderCadastros();
    if (view === 'notificacoes') renderRequests();
    if (view === 'perfil') renderProfileArea();
    if (view === 'dashboard') { renderDashboard(); }
    if (view === 'configuracoes') updatePermissionStatus();

    localStorage.setItem('aw_last_view', view);
}

function refreshCurrentView() {
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection) {
        const currentView = activeSection.id.replace('view-', '');
        // Bloqueia renderização de cadastros para usuários do almoxarifado
        if (currentView === 'cadastros' && typeof userSubType !== 'undefined' && userSubType === 'ALM') {
            navTo('patio', null);
            return;
        }
        if (currentView === 'patio') renderPatio();
        else if (currentView === 'mapas') { renderMapList(); updateMapState(); }
        else if (currentView === 'materia-prima') renderMateriaPrima();
        else if (currentView === 'carregamento') renderCarregamento();
        else if (currentView === 'cadastros') renderCadastros();
        else if (currentView === 'notificacoes') renderRequests();
        else if (currentView === 'dashboard') { renderDashboard(); }
    }
    updateBadge();
    if (typeof updateAccountRequestBadge === 'function') updateAccountRequestBadge();
}

function logout() {
    if (typeof AUTH_SYNC !== 'undefined' && AUTH_SYNC.logout) {
        AUTH_SYNC.logout();
    } else {
        sessionStorage.removeItem('loggedInUser');
        sessionStorage.removeItem('aw_token');
        window.location.href = 'login.html';
    }
}

function checkElectronEnvironment() {
    const isElectron = /electron/i.test(navigator.userAgent);
    const windowControls = document.querySelectorAll('.window-controls');
    
    windowControls.forEach(control => {
        if (isElectron) {
            control.style.display = 'flex';
        } else {
            control.style.display = 'none';
        }
    });
}

// Inicializa a visibilidade dos controles ao carregar o módulo
document.addEventListener('DOMContentLoaded', checkElectronEnvironment);

function closeContextMenu() { document.querySelectorAll('.context-menu').forEach(x => x.style.display = 'none'); }

window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = "none";
    }
    if (!event.target.closest('.context-menu') && !event.target.closest('.interactive-row') && !event.target.closest('.mc-item') && !event.target.closest('.truck-card')) {
        closeContextMenu();
    }
};
