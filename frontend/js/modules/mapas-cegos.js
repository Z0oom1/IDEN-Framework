// ===================================================================================
//          MÓDULO DE MAPAS CEGOS
// ===================================================================================

let currentMapId = null;
let contextMapId = null;

function updateMapState() {
    const sheet = document.getElementById('mapSheet');
    const empty = document.getElementById('mapEmptyState');
    if (!sheet || !empty) return;
    if (currentMapId && mapData.find(m => m.id === currentMapId)) {
        sheet.style.display = 'block'; empty.style.display = 'none';
    } else {
        currentMapId = null; sheet.style.display = 'none'; empty.style.display = 'flex';
        document.querySelectorAll('.mc-item').forEach(el => el.classList.remove('selected'));
    }
}

function renderMapList() {
    const fd = document.getElementById('mapListDateFilter').value;
    const l = document.getElementById('mapList');
    l.innerHTML = '';

    // Obter permissões e setor do usuário logado
    const logged = (typeof loggedUser !== 'undefined' && loggedUser) ? loggedUser : { role: 'Portaria', sector: 'Recebimento' };
    const uRole = (logged.role || 'Portaria').toLowerCase();
    const perms = systemPermissions[logged.role] || {};
    const mainSector = perms.mainSector || logged.sector || '';
    const subSector = perms.subSector || logged.subType || '';
    const isAdmin = uRole.includes('admin') || uRole.includes('administrador') || uRole === 'portaria';
    const isRecebimento = mainSector === 'Recebimento' || uRole.includes('encarregado');

    const filteredMaps = mapData.filter(m => {
        // 1. Filtro de Data
        if (m.date !== fd) return false;

        // 2. Filtro de Hierarquia/Setor (Apenas para Funcionários)
        if (logged.role === 'Funcionario') {
            if (isRecebimento) return true; // Recebimento vê tudo
            
            if (!subSector) return false; // Conferente sem subtipo não vê nada
            
            const subUpper = subSector.toUpperCase();
            const mapSectorUpper = (m.setor || '').toUpperCase();
            
            // Verificação genérica por nome de setor
            if (mapSectorUpper.includes(subUpper)) return true;
            
            // Especial para Almoxarifado (ALM)
            if ((subUpper === 'ALMORARIFADO' || subUpper === 'ALM') && mapSectorUpper.includes('ALM')) return true;

            return false;
        }

        // 3. Admin e Recebimento veem tudo por padrão
        if (isAdmin || isRecebimento) return true;

        return true;
    }).slice().reverse();

    if (filteredMaps.length === 0) {
        l.innerHTML = '<div style="padding:15px; color:#999; text-align:center;">Nenhum mapa para esta data.</div>';
        return;
    }

    filteredMaps.forEach(m => {
        let fornDisplay = 'Diversos';
        if (m.rows && m.rows.length > 0 && m.rows[0].forn) {
            fornDisplay = m.rows[0].forn;
        }

        const el = document.createElement('div');
        el.className = `mc-item ${currentMapId === m.id ? 'selected' : ''}`;
        if (m.divergence) el.style.borderLeft = "4px solid red";

        el.innerHTML = `
            <div><b>${fornDisplay}</b></div>
            <small>${m.placa} • ${m.setor}</small>
            <div>${m.launched ? '<span style="color:green">Lançado</span>' : 'Rascunho'} ${m.divergence ? '<b style="color:red">(DIV)</b>' : ''}</div>
        `;

        el.onclick = () => { loadMap(m.id); };
        el.oncontextmenu = (e) => {
            e.preventDefault();
            openMapContextMenu(e.pageX, e.pageY, m.id);
        };
        l.appendChild(el);
    });
}

function loadMap(id) {
    currentMapId = id; const m = mapData.find(x => x.id === id); if (!m) return;
    document.getElementById('mapDate').value = m.date; document.getElementById('mapPlaca').value = m.placa; document.getElementById('mapSetor').value = m.setor;
    const b = document.getElementById('divBanner');
    if (m.divergence) { b.style.display = 'block'; document.getElementById('divBannerText').innerHTML = `De: ${m.divergence.reporter}<br>"${m.divergence.reason}"`; document.getElementById('divResolveBtn').innerHTML = isRecebimento ? `<button class="btn btn-save" onclick="resolveDivergence('${m.id}')">Resolver</button>` : ''; }
    else b.style.display = 'none';
    const st = document.getElementById('mapStatus');
    if (m.launched && !m.forceUnlock) { st.textContent = 'LANÇADO (Bloqueado)'; st.style.color = 'green'; document.getElementById('btnLaunch').style.display = 'none'; document.getElementById('btnRequestEdit').style.display = isConferente ? 'inline-block' : 'none'; }
    else { st.textContent = m.forceUnlock ? 'EM EDIÇÃO (Desbloqueado)' : 'Rascunho'; st.style.color = m.forceUnlock ? 'orange' : '#666'; document.getElementById('btnLaunch').style.display = 'inline-block'; document.getElementById('btnRequestEdit').style.display = 'none'; }
    document.getElementById('sigReceb').textContent = m.signatures.receb || ''; document.getElementById('sigConf').textContent = m.signatures.conf || '';
    renderRows(m); renderMapList(); updateMapState();
}

function openMapContextMenu(x, y, id) {
    contextMapId = id;
    const m = mapData.find(x => x.id === id);
    if (!m) return;

    const inWeighing = mpData.some(w => w.id === id);
    const menu = document.getElementById('ctxMenu');

    let html = `<div class="ctx-header">Mapa: ${m.placa}</div>`;
    html += `<div class="ctx-item" style="color:red" onclick="openDivergenceModal('${id}')"><i class="fas fa-exclamation-triangle"></i> Divergência</div>`;
    
    if (isConferente) {
        html += `<div class="ctx-item" onclick="triggerRequest('edit','${id}')"><i class="fas fa-edit"></i> Solicitar Edição</div>`;
    } else {
        html += `<div class="ctx-item" onclick="forceUnlockMap('${id}')"><i class="fas fa-unlock"></i> Forçar Edição</div>`;
        html += `<div class="ctx-divider"></div>`;
        html += `<div class="ctx-item ${!inWeighing ? 'disabled' : ''}" onclick="${inWeighing ? `navTo('materia-prima'); loadMP('${id}')` : ''}"><i class="fas fa-weight"></i> Levar para Pesagem</div>`;
        html += `<div class="ctx-divider"></div>`;
        html += `<div class="ctx-item" style="color:red" onclick="confirmDeleteTruck('${id}')"><i class="fas fa-trash"></i> Excluir...</div>`;
    }

    menu.innerHTML = html;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
}

function renderRows(m) {
    const tb = document.getElementById('mapBody'); tb.innerHTML = '';
    const locked = m.launched && !m.forceUnlock;

    m.rows.forEach(r => {
        const tr = document.createElement('tr');

        const createCell = (f, role) => {
            let ro = locked;
            if (!locked) {
                if (role === 'conf' && !isConferente) ro = true;
                if (role === 'receb' && !isRecebimento) ro = true;
            }
            let val = r[f];
            if (val === undefined || val === null) val = '';

            if (isConferente && f === 'qty_nf') { val = '---'; ro = true; }

            if (f === 'desc') {
                return `<td><input type="text" class="cell" value="${val}" ${ro ? 'readonly' : ''} onchange="updateRow('${r.id}','${f}',this.value)" style="width:100%; cursor:pointer; color:var(--primary); font-weight:600;" onclick="showProductCodePopup(this.value)" title="Clique para ver o código"></td>`;
            }

            return `<td><input type="text" class="cell" value="${val}" ${ro ? 'readonly' : ''} onchange="updateRow('${r.id}','${f}',this.value)" style="width:100%"></td>`;
        };

        tr.innerHTML = `${createCell('desc', 'receb')} ${createCell('qty_nf', 'receb')} ${createCell('qty', 'conf')} ${createCell('nf', 'receb')} ${createCell('forn', 'receb')}`;
        tb.appendChild(tr);
    });
}

function updateRow(rid, f, v) { const m = mapData.find(x => x.id === currentMapId); const r = m.rows.find(x => x.id === rid); if (r) { r[f] = v; saveAll(); } }
function saveCurrentMap() { const m = mapData.find(x => x.id === currentMapId); if (m) { m.date = document.getElementById('mapDate').value; m.placa = document.getElementById('mapPlaca').value; m.setor = document.getElementById('mapSetor').value; saveAll(); alert('Salvo.'); renderMapList(); } }
function launchMap() { const m = mapData.find(x => x.id === currentMapId); if (!m.signatures.receb || !m.signatures.conf) { alert('Assinaturas obrigatórias.'); return; } if (confirm('Lançar?')) { m.launched = true; m.forceUnlock = false; saveAll(); loadMap(currentMapId); } }
function signMap(role) { const m = mapData.find(x => x.id === currentMapId); if (!m) return; if (role === 'receb' && !isRecebimento) return alert('Só Recebimento'); if (role === 'conf' && !isConferente) return alert('Só Conferente'); m.signatures[role] = loggedUser.username + ' ' + new Date().toLocaleTimeString().slice(0, 5); saveAll(); loadMap(currentMapId); }
function createNewMap() { const id = Date.now().toString(); const rows = []; for (let i = 0; i < 8; i++) rows.push({ id: id + '_' + i, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} }); mapData.push({ id, date: getBrazilTime().split('T')[0], rows, placa: '', setor: '', launched: false, signatures: {}, divergence: null }); saveAll(); renderMapList(); loadMap(id); }
function forceUnlockMap(id) { const m = mapData.find(x => x.id === id); if (m) { m.forceUnlock = true; saveAll(); loadMap(id); closeContextMenu(); } }

function openDivergenceModal(id) { contextMapId = id; document.getElementById('divUserList').innerHTML = ['Caio', 'Balanca', 'Fabricio', 'Admin'].map(u => `<label style="display:block"><input type="checkbox" value="${u}"> ${u}</label>`).join(''); document.getElementById('divReason').value = ''; document.getElementById('modalDivergence').style.display = 'flex'; closeContextMenu(); }
function submitDivergence() { const m = mapData.find(x => x.id === contextMapId); if (m) { m.divergence = { active: true, reason: document.getElementById('divReason').value, reporter: loggedUser.username }; const t = Array.from(document.querySelectorAll('#divUserList input:checked')).map(x => x.value); t.forEach(u => requests.push({ id: Date.now() + Math.random(), type: 'divergence', user: loggedUser.username, target: u, mapId: contextMapId, msg: m.divergence.reason, status: 'pending' })); saveAll(); document.getElementById('modalDivergence').style.display = 'none'; loadMap(contextMapId); } }
function resolveDivergence(id) { if (confirm('Resolver?')) { const m = mapData.find(x => x.id === id); if (m) { m.divergence = null; saveAll(); loadMap(id); } } }
function triggerRequest(type, mid) { const t = mid || currentMapId; const u = prompt('Para quem?'); const r = prompt('Motivo'); if (u && r) { requests.push({ id: Date.now(), mapId: t, user: loggedUser.username, target: u, type, msg: r, status: 'pending' }); saveAll(); closeContextMenu(); alert('Solicitado'); } }
