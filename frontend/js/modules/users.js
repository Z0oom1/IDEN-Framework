// ===================================================================================
//          MÓDULO DE USUÁRIOS (GESTÃO E PERFIL)
// ===================================================================================

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
        const removeBtn = isMe ? '<span style="color:#999; font-size:0.8rem;">(Você)</span>' : `<button class="btn btn-edit btn-small" onclick="removeUser('${u.username}')" style="color:red; border-color:red; margin-left:5px;">Remover</button>`;
        const editPermsBtn = isAdmin ? `<button class="btn btn-edit btn-small" onclick="openPermissionEditor('${u.username}')" title="Permissões" style="margin-right:5px; background:var(--primary); color:white; border:none;"><i class="fas fa-user-shield"></i></button>` : '';
        
        let secDisplay = u.sector; 
        if (u.subType) secDisplay += ` (${u.subType})`;
        
        tbody.innerHTML += `
            <tr>
                <td><b>${u.username}</b></td>
                <td>${u.role}</td>
                <td>${secDisplay}</td>
                <td style="display:flex; align-items:center;">
                    ${editPermsBtn}
                    ${removeBtn}
                </td>
            </tr>`;
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
