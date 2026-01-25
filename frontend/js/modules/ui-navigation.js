// ===================================================================================
//          MÓDULO DE UI E NAVEGAÇÃO
// ===================================================================================

function toggleMobileMenu() { const sb = document.querySelector('.main-sidebar'); if (sb) sb.classList.toggle('show-mobile'); }
function toggleMapListMobile() { const mm = document.getElementById('mobileMapList'); if (mm) mm.classList.toggle('open'); }

function navTo(view, el) {
    // Verificar permissão de visualização (exceto para Admin que tem acesso total)
    if (view !== 'perfil' && view !== 'configuracoes' && view !== 'admin') {
        if (!checkPermission(view, 'view')) {
            alert('Acesso negado: Você não tem permissão para acessar este módulo.');
            return;
        }
    }

    // Bloqueia acesso ao cadastro para usuários do almoxarifado (Regra Legada)
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
        appTitle.innerText = `CONTROLADORIA AW - ${currentTitle.toUpperCase()}`;
    }

    if (view === 'patio') renderPatio();
    if (view === 'mapas') { renderMapList(); updateMapState(); }
    if (view === 'materia-prima') renderMateriaPrima();
    if (view === 'carregamento') renderCarregamento();
    if (view === 'cadastros') renderCadastros();
    if (view === 'notificacoes') renderRequests();
    if (view === 'perfil') renderProfileArea();
    if (view === 'admin') renderAdminArea();
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
    updateAccountRequestBadge();
}

function logout() { sessionStorage.removeItem('loggedInUser'); window.location.href = 'login.html'; }

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

    // Atualizar visibilidade dos menus baseada em permissões
    updateMenuVisibility();
}

function updateMenuVisibility() {
    // Exibir menu Admin apenas para Administradores
    const mAdmin = document.getElementById('menuAdmin');
    if (mAdmin) mAdmin.style.display = isAdmin ? 'flex' : 'none';

    // Obter hierarquia do funcionário
    const perms = systemPermissions[loggedUser.role] || {};
    const mainSector = perms.mainSector || loggedUser.sector || '';
    const isUserRecebimento = mainSector === 'Recebimento';

    // Aplicar restrições de permissões granulares nos menus para usuários não-admin
    if (!isAdmin) {
        APP_MODULES.forEach(mod => {
            const menuEl = document.querySelector(`.menu-item[onclick*="'${mod.id}'"]`);
            if (menuEl) {
                // 1. Regra de Dashboard: Apenas Encarregados e ADM
                if (mod.id === 'dashboard' && !loggedUser.role.toLowerCase().includes('encarregado')) {
                    menuEl.style.display = 'none';
                    return;
                }

                // 2. Regra de Permissões Granulares (ADM configurou)
                if (!checkPermission(mod.id, 'view')) {
                    menuEl.style.display = 'none';
                    return;
                }

                // 3. Regras de Hierarquia (Recebimento vs Conferência)
                if (loggedUser.role === 'Funcionario') {
                    if (isUserRecebimento) {
                        // Recebimento vê tudo exceto Dashboard (já tratado acima)
                        menuEl.style.display = 'flex';
                    } else {
                        // Conferência vê: Fila, Mapas, Relatórios, Produtos, Notificações, Perfil
                        const allowedForConf = ['patio', 'mapas', 'relatorios', 'produtos', 'notificacoes', 'perfil'];
                        if (allowedForConf.includes(mod.id)) {
                            menuEl.style.display = 'flex';
                        } else {
                            menuEl.style.display = 'none';
                        }
                    }
                } else {
                    // Respeitar regras legadas de visibilidade para outros perfis
                    if (mod.id === 'patio' && !isRecebimento) {
                        menuEl.style.display = 'none';
                    } else {
                        menuEl.style.display = 'flex';
                    }
                }
            }
        });
    }
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
