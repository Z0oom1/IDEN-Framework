// ===================================================================================
//          MÓDULO DE MAPAS CEGOS - V4.0 (Divergência Detalhada + Linhas Dinâmicas)
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

    const filteredMaps = mapData.filter(m => {
        if (m.date !== fd) return false;

        // Regra de Visibilidade Estrita por Setor
        const uRole = (typeof loggedUser !== 'undefined' && loggedUser.role) ? String(loggedUser.role).toUpperCase() : '';
        const uSector = (typeof userSector !== 'undefined' && userSector) ? String(userSector).toUpperCase() : '';
        const uSubType = (typeof userSubType !== 'undefined' && userSubType) ? String(userSubType).toUpperCase() : '';

        // Admin, Portaria e Recebimento veem tudo
        if (typeof isAdmin !== 'undefined' && isAdmin) return true;
        if (uRole === 'PORTARIA') return true;
        if (typeof isRecebimento !== 'undefined' && isRecebimento) return true;

        // Conferentes veem apenas seus setores (Isolamento)
        if (typeof isConferente !== 'undefined' && isConferente) {
            const userTargetSector = uSubType || uSector;
            if (!userTargetSector) return true;

            const mapSectorUpper = (m.setor || '').toUpperCase();
            
            // Caso especial Almoxarifado
            if (userTargetSector === 'ALM') {
                return mapSectorUpper.includes('ALM') || mapSectorUpper.includes('DOCA');
            }

            // Isolamento por setor
            return mapSectorUpper.includes(userTargetSector);
        }

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
    if (m.divergence) { 
        b.style.display = 'block'; 
        document.getElementById('divBannerText').innerHTML = `De: ${m.divergence.reporter}<br>"${m.divergence.reason}"`; 
        document.getElementById('divResolveBtn').innerHTML = isRecebimento ? `<button class="btn btn-save" onclick="resolveDivergence('${m.id}')">Resolver</button>` : ''; 
    }
    else b.style.display = 'none';
    
    const st = document.getElementById('mapStatus');
    
    if (m.launched && !m.forceUnlock) { 
        st.textContent = 'LANÇADO (Bloqueado)'; 
        st.style.color = 'green'; 
        document.getElementById('btnLaunch').style.display = 'none'; 
        document.getElementById('btnRequestEdit').style.display = isConferente ? 'inline-block' : 'none'; 
    }
    else { 
        st.textContent = m.forceUnlock ? 'EM EDIÇÃO (Desbloqueado)' : 'Rascunho'; 
        st.style.color = m.forceUnlock ? 'orange' : '#666'; 
        document.getElementById('btnLaunch').style.display = 'inline-block'; 
        document.getElementById('btnRequestEdit').style.display = 'none'; 
    }
    
    // Renderizar assinaturas múltiplas
    renderSignatures(m);
    
    renderRows(m); 
    renderMapList(); 
    updateMapState();
}

function renderSignatures(m) {
    const sigRecebCont = document.getElementById('sigReceb');
    const sigConfCont = document.getElementById('sigConf');
    
    if (sigRecebCont) {
        const sigs = m.signatures.receb_list || (m.signatures.receb ? [m.signatures.receb] : []);
        sigRecebCont.innerHTML = sigs.map(s => `<div style="border-bottom:1px solid #eee; padding:2px 0;">${s}</div>`).join('');
    }
    
    if (sigConfCont) {
        const sigs = m.signatures.conf_list || (m.signatures.conf ? [m.signatures.conf] : []);
        sigConfCont.innerHTML = sigs.map(s => `<div style="border-bottom:1px solid #eee; padding:2px 0;">${s}</div>`).join('');
    }
}

function openMapContextMenu(x, y, id) {
    contextMapId = id;
    const m = mapData.find(x => x.id === id);
    if (!m) return;

    const inWeighing = mpData.some(w => w.id === id);
    const menu = document.getElementById('ctxMenu');

    let html = `<div class="ctx-header">Mapa: ${m.placa}</div>`;
    html += `<div class="ctx-item" style="color:red" onclick="openDivergenceModal('${id}')"><i class="fas fa-exclamation-triangle"></i> Divergência</div>`;
    
    // Botão Ver no Pátio (Sempre visível no menu de contexto)
    html += `<div class="ctx-item" onclick="navTo('patio'); setTimeout(() => { const el = document.getElementById('truck-${id}'); if(el) el.scrollIntoView({behavior:'smooth', block:'center'}); }, 500)"><i class="fas fa-truck"></i> Ver no Pátio</div>`;

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
    const isMobile = window.innerWidth <= 768;

    // Garantir que o mapa tenha pelo menos 8 linhas internamente se for novo/manual
    if (!locked && m.rows.length < 8) {
        for (let i = m.rows.length; i < 8; i++) {
            m.rows.push({ id: m.id + '_' + Date.now() + i, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} });
        }
    }

    // Filtramos as linhas para exibição:
    // No Desktop: Mostramos todas as linhas (incluindo as 8 padrão vazias)
    // No Mobile: Ocultamos as vazias para economizar espaço
    let rowsToRender = m.rows;
    if (isMobile) {
        rowsToRender = m.rows.filter(r => r.desc || r.nf || r.qty || r.qty_nf || r.forn);
        if (rowsToRender.length === 0 && !locked) {
            rowsToRender = [m.rows[0]]; 
        }
    }

    rowsToRender.forEach(r => {
        const tr = document.createElement('tr');
        
        // Se houver divergência marcada para esta linha, destaca
        if (m.divergence && m.divergence.items && m.divergence.items.includes(r.id)) {
            tr.style.background = '#fff5f5';
        }

        const createCell = (f, role) => {
            let ro = locked;
            if (!locked) {
                if (role === 'conf' && !isConferente) ro = true;
                if (role === 'receb' && !isRecebimento) ro = true;
                
                // Regra de Edição Forçada: Somente quem inseriu pode editar
                if (m.forceUnlock && r.owners && r.owners[f] && r.owners[f] !== loggedUser.username && !isAdmin) {
                    ro = true;
                }
            }
            
            let val = r[f] || '';
            if (isConferente && f === 'qty_nf') { val = '---'; ro = true; }

            const owner = (r.owners && r.owners[f]) ? `<div style="font-size:0.65rem; color:#94a3b8; margin-top:-5px; padding:0 10px;">${r.owners[f]}</div>` : '';
            
            const labels = {
                'desc': 'Descrição',
                'qty_nf': 'Qtd. NF',
                'qty': 'Contada',
                'nf': 'Nota Fiscal',
                'forn': 'Fornecedor'
            };
            const label = labels[f] || '';

            if (f === 'desc') {
                return `<td data-label="${label}">
                    <input type="text" class="cell" value="${val}" ${ro ? 'readonly' : ''} onchange="updateRow('${r.id}','${f}',this.value)" style="width:100%; cursor:pointer; color:var(--primary); font-weight:600;" onclick="showProductCodePopup(this.value)" title="Clique para ver o código">
                    ${owner}
                </td>`;
            }

            return `<td data-label="${label}">
                <input type="text" class="cell" value="${val}" ${ro ? 'readonly' : ''} onchange="updateRow('${r.id}','${f}',this.value)" style="width:100%">
                ${owner}
            </td>`;
        };

        let html = `${createCell('desc', 'receb')} ${createCell('qty_nf', 'receb')} ${createCell('qty', 'conf')} ${createCell('nf', 'receb')} ${createCell('forn', 'receb')}`;
        
        // Botão de remover linha (apenas se não estiver bloqueado)
        if (!locked && isRecebimento) {
            html += `<td class="actions-cell" style="width:40px; text-align:center;">
                <button class="btn-remove-row" onclick="removeMapRow('${r.id}')" title="Remover Linha" style="background:none; border:none; color:#ef4444; cursor:pointer;">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>`;
        }

        tr.innerHTML = html;
        tb.appendChild(tr);
    });
    
    // Área de ações do rodapé (Adicionar Linha)
    const footerActions = document.getElementById('mapFooterActions');
    if (footerActions) {
        footerActions.innerHTML = '';
        if (!locked && isRecebimento) {
            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn btn-edit';
            btnAdd.innerHTML = '<i class="fas fa-plus"></i> Adicionar Linha';
            btnAdd.onclick = addMapRow;
            footerActions.appendChild(btnAdd);
        }
    }
}

function removeMapRow(rowId) {
    const m = mapData.find(x => x.id === currentMapId);
    if (!m) return;
    
    // Regra mínima: Todo caminhão deve possuir no mínimo 1 produto
    const activeRows = m.rows.filter(r => r.desc || r.nf || r.qty || r.qty_nf || r.forn);
    if (activeRows.length <= 1 && m.rows.find(r => r.id === rowId && (r.desc || r.nf))) {
        return alert('Operação não permitida: O caminhão deve possuir no mínimo 1 produto cadastrado.');
    }

    if (confirm('Deseja realmente remover esta linha? Esta ação refletirá em todo o sistema.')) {
        const rowToRemove = m.rows.find(r => r.id === rowId);
        const productName = rowToRemove ? rowToRemove.desc : '';
        
        m.rows = m.rows.filter(r => r.id !== rowId);

        // SINCRONIZAÇÃO EM CASCATA: Remover do Pátio e Pesagem
        const truck = patioData.find(t => t.id === m.id);
        if (truck && truck.cargas) {
            truck.cargas.forEach(carga => {
                if (carga.produtos) {
                    carga.produtos = carga.produtos.filter(p => p.nome !== productName);
                }
            });
        }

        const mp = mpData.find(x => x.id === m.id);
        if (mp && mp.produtos) {
            mp.produtos = mp.produtos.filter(p => p.nome !== productName);
        }

        saveAll();
        renderRows(m);
    }
}

function addMapRow() {
    const m = mapData.find(x => x.id === currentMapId);
    if (!m) return;
    
    const newId = m.id + '_' + Date.now(); // ID mais único
    m.rows.push({ id: newId, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} });
    saveAll();
    renderRows(m);
}

function updateRow(rid, f, v) { 
    const m = mapData.find(x => x.id === currentMapId); 
    const r = m.rows.find(x => x.id === rid); 
    if (r) { 
        r[f] = v; 
        if (!r.owners) r.owners = {};
        r.owners[f] = loggedUser.username; // Registra quem alterou
        saveAll(); 
        // Não renderiza tudo de novo para não perder o foco, mas atualiza o owner visualmente se necessário
        // Para simplificar neste MVP, vamos renderizar apenas se o valor mudou de vazio para algo
        if (v) renderRows(m);
    } 
}

function saveCurrentMap() { const m = mapData.find(x => x.id === currentMapId); if (m) { m.date = document.getElementById('mapDate').value; m.placa = document.getElementById('mapPlaca').value; m.setor = document.getElementById('mapSetor').value; saveAll(); alert('Salvo.'); renderMapList(); } }

function launchMap() { 
    const m = mapData.find(x => x.id === currentMapId); 
    const hasReceb = (m.signatures.receb_list && m.signatures.receb_list.length > 0) || m.signatures.receb;
    const hasConf = (m.signatures.conf_list && m.signatures.conf_list.length > 0) || m.signatures.conf;
    
    if (!hasReceb || !hasConf) { 
        alert('Assinaturas obrigatórias (Recebimento e Conferência).'); 
        return; 
    } 
    if (confirm('Lançar Definitivo? O mapa será bloqueado para edições comuns.')) { 
        m.launched = true; 
        m.forceUnlock = false; 
        saveAll(); 
        loadMap(currentMapId); 
    } 
}

function signMap(role) { 
    const m = mapData.find(x => x.id === currentMapId); 
    if (!m) return; 
    const canSignReceb = isRecebimento || (loggedUser && loggedUser.role && loggedUser.role.toUpperCase() === 'OPERADOR');
    if (role === 'receb' && !canSignReceb) return alert('Apenas usuários do Recebimento ou Operadores podem assinar aqui.'); 
    if (role === 'conf' && !isConferente) return alert('Apenas Conferentes podem assinar aqui.'); 
    
    const sigName = loggedUser.username + ' (' + new Date().toLocaleTimeString().slice(0, 5) + ')';
    
    if (role === 'receb') {
        if (!m.signatures.receb_list) m.signatures.receb_list = m.signatures.receb ? [m.signatures.receb] : [];
        if (!m.signatures.receb_list.includes(sigName)) m.signatures.receb_list.push(sigName);
        m.signatures.receb = sigName; // Fallback para compatibilidade
    } else {
        if (!m.signatures.conf_list) m.signatures.conf_list = m.signatures.conf ? [m.signatures.conf] : [];
        if (!m.signatures.conf_list.includes(sigName)) m.signatures.conf_list.push(sigName);
        m.signatures.conf = sigName; // Fallback para compatibilidade
    }
    
    saveAll(); 
    loadMap(currentMapId); 
}

function createNewMap() { 
    const id = Date.now().toString(); 
    const rows = []; 
    
    // Lista de setores para seleção
    const setores = [
        { val: 'DOCA (ALM)', label: 'ALMOXARIFADO' },
        { val: 'GAVA', label: 'GAVA' },
        { val: 'INFRAESTRUTURA', label: 'INFRAESTRUTURA' },
        { val: 'MANUTENÇÃO', label: 'MANUTENÇÃO' },
        { val: 'LABORATÓRIO', label: 'LABORATÓRIO' },
        { val: 'SALA DE PESAGEM', label: 'SALA DE PESAGEM' },
        { val: 'SST', label: 'SST' },
        { val: 'CD', label: 'CD' },
        { val: 'COMPRAS', label: 'COMPRAS' },
        { val: 'OUTROS', label: 'OUTROS' }
    ];

    let options = setores.map(s => `${s.label}`).join('\n');
    const sel = prompt("Selecione o Setor Responsável por este Mapa:\n\n" + options);
    
    if (!sel) return;

    const chosen = setores.find(s => s.label.toUpperCase() === sel.toUpperCase() || s.val.toUpperCase() === sel.toUpperCase());
    const finalSector = chosen ? chosen.val : 'OUTROS';

    for (let i = 0; i < 8; i++) rows.push({ id: id + '_' + i, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} }); 
    mapData.push({ id, date: getBrazilTime().split('T')[0], rows, placa: '', setor: finalSector, launched: false, signatures: {}, divergence: null }); 
    saveAll(); 
    renderMapList(); 
    loadMap(id); 
}

function forceUnlockMap(id) { const m = mapData.find(x => x.id === id); if (m) { m.forceUnlock = true; saveAll(); loadMap(id); closeContextMenu(); } }

// ===================================================================================
//  SISTEMA DE DIVERGÊNCIA DETALHADA
// ===================================================================================

function openDivergenceModal(id) { 
    contextMapId = id; 
    const m = mapData.find(x => x.id === id);
    if (!m) return;

    // Info do Mapa
    document.getElementById('divMapInfo').innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:0.9rem;">
            <div><b>Placa:</b> ${m.placa || '---'}</div>
            <div><b>Setor:</b> ${m.setor || '---'}</div>
            <div><b>Data:</b> ${m.date}</div>
            <div><b>Status:</b> ${m.launched ? 'Lançado' : 'Rascunho'}</div>
        </div>
    `;

    // Tabela de Itens para Seleção
    const tbody = document.getElementById('divItemsTable');
    tbody.innerHTML = '';
    m.rows.forEach(r => {
        if (!r.desc && !r.nf) return; // Pula linhas vazias
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center"><input type="checkbox" class="div-item-check" value="${r.id}"></td>
            <td>${r.desc || '(Sem descrição)'}</td>
            <td>${r.nf || '---'}</td>
            <td>${r.qty_nf || '---'}</td>
            <td>${r.qty || '---'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Lista de Usuários para Notificar
    document.getElementById('divUserList').innerHTML = ['Caio', 'Balanca', 'Fabricio', 'Admin'].map(u => `
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem;">
            <input type="checkbox" class="div-user-check" value="${u}"> ${u}
        </label>
    `).join(''); 
    
    document.getElementById('divReason').value = ''; 
    document.getElementById('modalDivergence').style.display = 'flex'; 
    closeContextMenu(); 
}

function submitDivergence() { 
    const m = mapData.find(x => x.id === contextMapId); 
    const reason = document.getElementById('divReason').value.trim();
    const selectedItems = Array.from(document.querySelectorAll('.div-item-check:checked')).map(el => el.value);
    const selectedUsers = Array.from(document.querySelectorAll('.div-user-check:checked')).map(el => el.value);

    if (!reason) return alert('Por favor, descreva o motivo da divergência.');
    if (selectedItems.length === 0) {
        if (!confirm('Nenhum item específico foi selecionado. Deseja registrar a divergência no mapa como um todo?')) return;
    }

    if (m) { 
        m.divergence = { 
            active: true, 
            reason: reason, 
            reporter: loggedUser.username,
            items: selectedItems,
            timestamp: new Date().toISOString()
        }; 
        
        // Criar requisições para os usuários selecionados
        selectedUsers.forEach(u => {
            requests.push({ 
                id: Date.now() + Math.random(), 
                type: 'divergence', 
                user: loggedUser.username, 
                target: u, 
                mapId: contextMapId, 
                msg: `DIVERGÊNCIA: ${reason} (Mapa: ${m.placa})`, 
                status: 'pending' 
            });
        });

        saveAll(); 
        document.getElementById('modalDivergence').style.display = 'none'; 
        loadMap(contextMapId); 
        alert('Divergência registrada com sucesso!');
    } 
}

function resolveDivergence(id) { 
    if (confirm('Confirmar a resolução desta divergência? Isso removerá o alerta vermelho do mapa e as notificações pendentes.')) { 
        const m = mapData.find(x => x.id === id); 
        if (m) { 
            m.divergence = null; 
            
            // Remove notificações relacionadas a este mapa
            for (let i = requests.length - 1; i >= 0; i--) {
                if (requests[i].mapId === id && requests[i].type === 'divergence') {
                    requests[i].status = 'resolved';
                }
            }
            
            saveAll(); 
            loadMap(id); 
            if (typeof renderRequests === 'function') renderRequests();
        } 
    } 
}

function triggerRequest(type, mid) { 
    const t = mid || currentMapId; 
    const u = prompt('Para quem deseja enviar esta solicitação?'); 
    const r = prompt('Qual o motivo da solicitação?'); 
    if (u && r) { 
        requests.push({ 
            id: Date.now(), 
            mapId: t, 
            user: loggedUser.username, 
            target: u, 
            type, 
            msg: r, 
            status: 'pending' 
        }); 
        saveAll(); 
        closeContextMenu(); 
        alert('Solicitação enviada com sucesso.'); 
    } 
}
