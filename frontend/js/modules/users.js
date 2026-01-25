// ===================================================================================
//          MÓDULO DE USUÁRIOS (GESTÃO E PERFIL)
// ===================================================================================

let currentEditingProfile = null;
let systemPermissions = JSON.parse(localStorage.getItem('system_permissions') || '{}');
let adminLogs = JSON.parse(localStorage.getItem('admin_logs') || '[]');

// Definição dos módulos e permissões granulares
const APP_MODULES = [
    { id: 'patio', name: 'Controle de Pátio', icon: 'fa-truck' },
    { id: 'mapas', name: 'Mapas Cegos', icon: 'fa-clipboard-check' },
    { id: 'materia-prima', name: 'Pesagem', icon: 'fa-weight-hanging' },
    { id: 'carregamento', name: 'Carregamento', icon: 'fa-dolly' },
    { id: 'relatorios', name: 'Relatórios', icon: 'fa-chart-pie' },
    { id: 'dashboard', name: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'cadastros', name: 'Cadastros', icon: 'fa-address-book' },
    { id: 'produtos', name: 'Produtos', icon: 'fa-boxes' },
    { id: 'notificacoes', name: 'Notificações / Req', icon: 'fa-bell' }
];

// Permissões padrão baseadas no script original
const DEFAULT_PERMISSIONS = {
    'Administrador': {
        'patio': { view: true, edit: true, delete: true },
        'mapas': { view: true, edit: true, delete: true },
        'materia-prima': { view: true, edit: true, delete: true },
        'carregamento': { view: true, edit: true, delete: true },
        'relatorios': { view: true, edit: true, delete: true },
        'dashboard': { view: true, edit: true, delete: true },
        'cadastros': { view: true, edit: true, delete: true },
        'produtos': { view: true, edit: true, delete: true },
        'notificacoes': { view: true, edit: true, delete: true }
    },
    'Encarregado': {
        'patio': { view: true, edit: true, delete: true },
        'mapas': { view: true, edit: true, delete: true },
        'materia-prima': { view: true, edit: true, delete: true },
        'carregamento': { view: true, edit: true, delete: true },
        'relatorios': { view: true, edit: true, delete: true },
        'dashboard': { view: true, edit: true, delete: true },
        'cadastros': { view: true, edit: true, delete: true },
        'produtos': { view: true, edit: true, delete: true },
        'notificacoes': { view: true, edit: true, delete: true }
    },
    'Funcionario': {
        // As permissões de Funcionário são dinâmicas baseadas no setor (Recebimento vs Conferencia)
        // Se mainSector === 'Recebimento'
        'recebimento': {
            'patio': { view: true, edit: true, delete: true },
            'mapas': { view: true, edit: true, delete: true },
            'materia-prima': { view: true, edit: true, delete: true },
            'carregamento': { view: true, edit: true, delete: true },
            'relatorios': { view: true, edit: true, delete: true },
            'dashboard': { view: false, edit: false, delete: false },
            'cadastros': { view: true, edit: true, delete: true },
            'produtos': { view: true, edit: true, delete: true },
            'notificacoes': { view: true, edit: true, delete: true }
        },
        // Se mainSector === 'Conferencia'
        'conferencia': {
            'patio': { view: true, edit: false, delete: false },
            'mapas': { view: true, edit: true, delete: false },
            'materia-prima': { view: false, edit: false, delete: false },
            'carregamento': { view: false, edit: false, delete: false },
            'relatorios': { view: true, edit: false, delete: false },
            'dashboard': { view: false, edit: false, delete: false },
            'cadastros': { view: false, edit: false, delete: false },
            'produtos': { view: true, edit: false, delete: false },
            'notificacoes': { view: false, edit: false, delete: false }
        }
    }
};

function checkPermission(moduleId, action = 'view') {
    if (isAdmin) return true;
    
    const role = loggedUser.role;
    const perms = systemPermissions[role];
    
    // 1. Se houver permissão customizada salva pelo ADM, usa ela
    if (perms && perms[moduleId]) {
        return perms[moduleId][action] !== false;
    }
    
    // 2. Caso contrário, usa a permissão padrão
    let defaultSet = DEFAULT_PERMISSIONS[role];
    if (role === 'Funcionario') {
        const sector = (perms && perms.mainSector) || loggedUser.sector || 'Conferencia';
        defaultSet = (sector === 'Recebimento') ? DEFAULT_PERMISSIONS.Funcionario.recebimento : DEFAULT_PERMISSIONS.Funcionario.conferencia;
    }
    
    if (defaultSet && defaultSet[moduleId]) {
        return defaultSet[moduleId][action] !== false;
    }
    
    return true; // Fallback: permite se nada for definido
}

function renderProfileArea() {
    const content = document.getElementById('profileContent');
    if (!content) return;

    if (!loggedUser) {
        content.innerHTML = '<p style="text-align:center; color:#999">Faça login para ver seu perfil.</p>';
        return;
    }

    const isSupervisor = loggedUser.role === 'Supervisor';
    const isEncarregado = loggedUser.role === 'Encarregado';

    content.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
            <div class="settings-card">
                <h4><i class="fas fa-user-circle"></i> Meu Perfil</h4>
                <p><b>Usuário:</b> ${loggedUser.username}</p>
                <p><b>Cargo:</b> ${loggedUser.role}</p>
                <p><b>Setor:</b> ${loggedUser.sector}</p>
            </div>
            <div class="settings-card">
                <h4><i class="fas fa-chart-bar"></i> Estatísticas Hoje</h4>
                <p>Caminhões no Pátio: <b>${patioData.filter(x => x.status !== 'SAIU').length}</b></p>
                <p>Entradas Totais: <b>${patioData.filter(x => (x.chegada || '').startsWith(getBrazilTime().split('T')[0])).length}</b></p>
            </div>
        </div>

        ${isSupervisor ? `
        <div class="settings-card" style="margin-top:20px;">
            <h4><i class="fas fa-users-cog"></i> Administração de Usuários</h4>
            <table class="modern-table">
                <thead><tr><th>Usuário</th><th>Cargo</th><th>Setor</th><th>Ações</th></tr></thead>
                <tbody id="adminUserList"></tbody>
            </table>
            <hr style="margin:20px 0">
            <h5>Adicionar Novo Usuário</h5>
            <div class="form-grid">
                <div><label>Usuário:</label><input type="text" id="newUsername" class="form-control"></div>
                <div><label>Senha:</label><input type="password" id="newPassword" class="form-control"></div>
                <div><label>Cargo:</label><select id="newRole" class="form-control">
                    <option value="Funcionario">Funcionário</option>
                    <option value="Encarregado">Encarregado</option>
                    <option value="Supervisor">Supervisor</option>
                </select></div>
                <div><label>Setor:</label><select id="newSector" class="form-control">
                    <option value="recebimento">Recebimento</option>
                    <option value="conferente">Conferente</option>
                    <option value="ALM">Almoxarifado</option>
                    <option value="GAVA">Gava</option>
                </select></div>
            </div>
            <button class="btn btn-save" onclick="addNewUser()"><i class="fas fa-user-plus"></i> Criar Usuário</button>
        </div>
        ` : ''}

        ${isEncarregado ? `
        <div class="settings-card" style="margin-top:20px;">
            <h4><i class="fas fa-user-plus"></i> Solicitações de Conta Pendentes</h4>
            <div id="encReqList"></div>
            <hr style="margin:20px 0">
            <h5>Criar Nova Conta Manualmente</h5>
            <div class="form-grid">
                <div><label>Nome Completo:</label><input id="new_fullname" class="form-control"></div>
                <div><label>Nome de Exibição:</label><input id="new_display" class="form-control"></div>
                <div><label>Usuário (Login):</label><input id="new_username" class="form-control"></div>
                <div><label>Senha Inicial:</label><input id="new_password" type="password" class="form-control"></div>
            </div>
            <button class="btn btn-save" onclick="createAccountByEncarregado()">Criar Conta</button>
        </div>
        ` : ''}
    `;

    if (isSupervisor) renderUserList();
    if (isEncarregado) loadAccountRequests();
}

function renderUserList() {
    const tbody = document.getElementById('adminUserList');
    if (!tbody) return;
    tbody.innerHTML = '';
    usersData.forEach(u => {
        const isMe = u.username === loggedUser.username;
        const btn = isMe ? '<span style="color:#999; font-size:0.8rem;">(Você)</span>' : `<button class="btn btn-edit btn-small" onclick="removeUser('${u.username}')" style="color:red; border-color:red;">Remover</button>`;
        let secDisplay = u.sector; 
        if (u.subType) secDisplay += ` (${u.subType})`;
        tbody.innerHTML += `<tr><td><b>${u.username}</b></td><td>${u.role}</td><td>${secDisplay}</td><td>${btn}</td></tr>`;
    });
}

function addNewUser() {
    const u = document.getElementById('newUsername').value;
    const p = document.getElementById('newPassword').value;
    const r = document.getElementById('newRole').value;
    const sRaw = document.getElementById('newSector').value;

    if (!u || !p) return alert("Preencha usuário e senha.");
    if (usersData.find(x => x.username.toLowerCase() === u.toLowerCase())) return alert("Usuário já existe.");

    let sector = 'recebimento';
    let subType = null;
    if (sRaw === 'recebimento') { sector = 'recebimento'; }
    else if (sRaw === 'conferente') { sector = 'conferente'; subType = null; }
    else { sector = 'conferente'; subType = sRaw; }

    usersData.push({ username: u, password: p, role: r, sector: sector, subType: subType });
    saveAll();
    renderUserList();
    document.getElementById('newUsername').value = ''; 
    document.getElementById('newPassword').value = ''; 
    alert("Usuário criado.");
}

function removeUser(username) {
    if (confirm(`Remover usuário "${username}"?`)) {
        usersData = usersData.filter(x => x.username !== username);
        saveAll();
        renderUserList();
    }
}

// ===================================================================================
//          ADMINISTRAÇÃO DE PERMISSÕES (EXCLUSIVO ADM)
// ===================================================================================

function renderAdminArea() {
    if (!isAdmin) return;
    
    const list = document.getElementById('adminProfileList');
    
    // Lista de perfis padrão do sistema + perfis encontrados nos usuários
    const defaultProfiles = ['Administrador', 'Supervisor', 'Encarregado', 'Funcionario'];
    const userProfiles = usersData.map(u => u.role);
    const profiles = [...new Set([...defaultProfiles, ...userProfiles])].filter(p => p && p !== 'null');
    
    list.innerHTML = profiles.map(p => `
        <div class="menu-item ${currentEditingProfile === p ? 'active' : ''}" onclick="selectProfileForEdit('${p}')" style="cursor:pointer; padding:10px; border-radius:6px; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-user-tag" style="font-size:0.8rem; opacity:0.7;"></i> 
            <span>${p}</span>
        </div>
    `).join('');

    if (currentEditingProfile) {
        document.getElementById('adminEmptyState').style.display = 'none';
        document.getElementById('adminPermissionEditor').style.display = 'block';
        document.getElementById('adminCurrentProfileName').innerText = currentEditingProfile.toUpperCase();
        
        // Mostrar configuração de setor se for perfil Funcionário
        const sectorConfig = document.getElementById('adminSectorConfig');
        if (currentEditingProfile === 'Funcionario') {
            sectorConfig.style.display = 'block';
            const perms = systemPermissions[currentEditingProfile] || {};
            document.getElementById('adminMainSector').value = perms.mainSector || 'Conferencia';
            document.getElementById('adminSubSector').value = perms.subSector || 'Infraestrutura';
            updateSubSectorOptions();
        } else {
            sectorConfig.style.display = 'none';
        }
        
        renderModulePermissions();
    } else {
        document.getElementById('adminEmptyState').style.display = 'block';
        document.getElementById('adminPermissionEditor').style.display = 'none';
    }
}

function updateSubSectorOptions() {
    const main = document.getElementById('adminMainSector').value;
    const subContainer = document.getElementById('adminSubSectorContainer');
    if (main === 'Recebimento') {
        subContainer.style.opacity = '0.5';
        subContainer.style.pointerEvents = 'none';
    } else {
        subContainer.style.opacity = '1';
        subContainer.style.pointerEvents = 'auto';
    }
}

function selectProfileForEdit(profile) {
    currentEditingProfile = profile;
    renderAdminArea();
}

function renderModulePermissions() {
    const container = document.getElementById('adminModulesContainer');
    const savedPerms = systemPermissions[currentEditingProfile] || {};
    
    // Determinar qual set de permissões padrão usar para exibição
    let defaultSet = DEFAULT_PERMISSIONS[currentEditingProfile];
    if (currentEditingProfile === 'Funcionario') {
        const sector = savedPerms.mainSector || 'Conferencia';
        defaultSet = (sector === 'Recebimento') ? DEFAULT_PERMISSIONS.Funcionario.recebimento : DEFAULT_PERMISSIONS.Funcionario.conferencia;
    }
    
    container.innerHTML = APP_MODULES.map(mod => {
        // Prioridade: 1. Salvo pelo ADM, 2. Padrão do Sistema, 3. Tudo true
        const defMod = (defaultSet && defaultSet[mod.id]) || { view: true, edit: true, delete: true };
        const modPerm = savedPerms[mod.id] || defMod;
        
        return `
            <div style="background:#fff; border:1px solid #e2e8f0; padding:15px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
                    <i class="fas ${mod.icon}" style="color:var(--primary);"></i>
                    <strong style="font-size:0.9rem;">${mod.name}</strong>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <label style="display:flex; justify-content:space-between; font-size:0.85rem; cursor:pointer;">
                        Visualizar <input type="checkbox" ${modPerm.view !== false ? 'checked' : ''} onchange="updateTempPerm('${mod.id}', 'view', this.checked)">
                    </label>
                    <label style="display:flex; justify-content:space-between; font-size:0.85rem; cursor:pointer;">
                        Editar <input type="checkbox" ${modPerm.edit !== false ? 'checked' : ''} onchange="updateTempPerm('${mod.id}', 'edit', this.checked)">
                    </label>
                    <label style="display:flex; justify-content:space-between; font-size:0.85rem; cursor:pointer;">
                        Excluir <input type="checkbox" ${modPerm.delete !== false ? 'checked' : ''} onchange="updateTempPerm('${mod.id}', 'delete', this.checked)">
                    </label>
                </div>
            </div>
        `;
    }).join('');
}

function updateTempPerm(modId, action, value) {
    if (!currentEditingProfile) return;
    
    // Inicializa o objeto de permissões para o perfil se não existir
    if (!systemPermissions[currentEditingProfile]) {
        // Se for um novo perfil, começa com as permissões padrão
        let defaultSet = DEFAULT_PERMISSIONS[currentEditingProfile];
        if (currentEditingProfile === 'Funcionario') {
            const sector = document.getElementById('adminMainSector').value || 'Conferencia';
            defaultSet = (sector === 'Recebimento') ? DEFAULT_PERMISSIONS.Funcionario.recebimento : DEFAULT_PERMISSIONS.Funcionario.conferencia;
        }
        systemPermissions[currentEditingProfile] = JSON.parse(JSON.stringify(defaultSet || {}));
    }
    
    if (!systemPermissions[currentEditingProfile][modId]) {
        systemPermissions[currentEditingProfile][modId] = { view: true, edit: true, delete: true };
    }
    
    systemPermissions[currentEditingProfile][modId][action] = value;
    console.log(`Temp Perm Updated: ${currentEditingProfile} -> ${modId}.${action} = ${value}`);
}

function savePermissions() {
    if (!currentEditingProfile) return;

    // Garantir que o objeto de permissões existe
    if (!systemPermissions[currentEditingProfile]) {
        systemPermissions[currentEditingProfile] = {};
    }

    // Salvar configurações de setor se for Funcionário
    if (currentEditingProfile === 'Funcionario') {
        systemPermissions[currentEditingProfile].mainSector = document.getElementById('adminMainSector').value;
        systemPermissions[currentEditingProfile].subSector = document.getElementById('adminSubSector').value;
    }

    // Persistir no LocalStorage e Servidor
    localStorage.setItem('system_permissions', JSON.stringify(systemPermissions));
    if (typeof saveToServer === 'function') {
        saveToServer('system_permissions', systemPermissions);
    }
    
    // Log de alteração
    const log = {
        id: Date.now(),
        admin: loggedUser.username,
        profile: currentEditingProfile,
        date: new Date().toLocaleString(),
        action: `Alteração de permissões para ${currentEditingProfile}`
    };
    adminLogs.push(log);
    localStorage.setItem('admin_logs', JSON.stringify(adminLogs));
    
    document.getElementById('adminLogBadge').innerText = `Última alteração: ${log.date} por ${log.admin}`;
    
    // Aplicar imediatamente se o usuário logado for do perfil editado
    if (loggedUser.role === currentEditingProfile) {
        updateMenuVisibility();
    }

    alert(`Permissões para o perfil "${currentEditingProfile}" salvas e aplicadas!`);
    
    // Notificar outros terminais
    if (window.socket && socket.connected) {
        socket.emit('permissions_updated', { profile: currentEditingProfile, permissions: systemPermissions });
    }
}

function loadAccountRequests() {
    const local = JSON.parse(localStorage.getItem('account_requests') || '[]');
    renderAccountRequests(local);
    if (window.location.protocol !== 'file:') {
        fetch(`${API_URL}/api/account-requests`).then(r => r.ok ? r.json() : null).then(body => {
            if (body && body.requests) renderAccountRequests(body.requests);
        }).catch(() => { });
    }
}

function renderAccountRequests(arr) {
    const listEl = document.getElementById('encReqList');
    if (!listEl) return;
    if (!arr || arr.length === 0) { 
        listEl.innerHTML = '<div style="color:var(--text-muted)">Nenhuma solicitação pendente.</div>'; 
        return; 
    }

    const mine = arr.filter(r => (r.sectorRequested || r.sector || '').toLowerCase() === (loggedUser.sector || '').toLowerCase() && r.status === 'pending');
    if (mine.length === 0) { 
        listEl.innerHTML = '<div style="color:var(--text-muted)">Nenhuma solicitação pendente para seu setor.</div>'; 
        return; 
    }
    listEl.innerHTML = mine.map(r => `
        <div style="padding:8px; border-bottom:1px solid rgba(0,0,0,0.04); display:flex; justify-content:space-between; align-items:center;">
            <div><b>${r.fullName}</b> <div style="font-size:0.85rem; color:var(--text-muted)">${r.username}</div></div>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-save btn-small" onclick="approveAccountRequest('${r.id}')">Aprovar</button>
                <button class="btn btn-edit btn-small" onclick="rejectAccountRequest('${r.id}')">Rejeitar</button>
            </div>
        </div>
    `).join('');
}

function updateAccountRequestBadge() {
    const ls = JSON.parse(localStorage.getItem('account_requests') || '[]');
    const count = (ls.filter(r => r.status === 'pending' && (r.sectorRequested || r.sector || '').toLowerCase() === (loggedUser.sector || '').toLowerCase())).length;
    const b = document.getElementById('badgeNotif');
    if (b) { 
        if (count > 0) { 
            b.innerText = count; 
            b.style.display = 'inline-block'; 
        } else {
            b.style.display = 'none'; 
        }
    }
}

async function approveAccountRequest(id) {
    const arr = JSON.parse(localStorage.getItem('account_requests') || '[]');
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return alert('Solicitação não encontrada.');
    const reqObj = arr[idx];

    if (!usersData.find(u => u.username === reqObj.username)) {
        usersData.push({ 
            username: reqObj.username, 
            password: reqObj.password || 'changeme', 
            role: reqObj.roleRequested || 'Funcionario', 
            sector: reqObj.sectorRequested, 
            firstLogin: false 
        });
        saveAll();
    }

    arr[idx].status = 'approved';
    localStorage.setItem('account_requests', JSON.stringify(arr));

    alert('Solicitação aprovada e conta criada.');
    loadAccountRequests();
}

function rejectAccountRequest(id) {
    const arr = JSON.parse(localStorage.getItem('account_requests') || '[]');
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return alert('Solicitação não encontrada.');
    arr[idx].status = 'rejected';
    localStorage.setItem('account_requests', JSON.stringify(arr));
    alert('Solicitação rejeitada.');
    loadAccountRequests();
}

async function createAccountByEncarregado() {
    const fullName = (document.getElementById('new_fullname') || {}).value || '';
    const display = (document.getElementById('new_display') || {}).value || fullName;
    const username = (document.getElementById('new_username') || {}).value;
    const password = (document.getElementById('new_password') || {}).value;
    const role = 'Funcionario';
    const sector = loggedUser.sector || 'recebimento';

    if (!username || !password) return alert('Preencha usuário e senha.');
    if (usersData.find(u => u.username === username)) return alert('Usuário já existe.');

    usersData.push({ username, password, role, sector, name: fullName, displayName: display, firstLogin: true });
    saveAll();

    alert('Usuário criado com sucesso.');
    document.getElementById('new_fullname').value = ''; 
    document.getElementById('new_display').value = ''; 
    document.getElementById('new_username').value = ''; 
    document.getElementById('new_password').value = '';
    loadAccountRequests();
}
