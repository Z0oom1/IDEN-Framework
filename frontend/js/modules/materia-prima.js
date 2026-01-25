// ===================================================================================
//          MÓDULO DE MATÉRIA-PRIMA (PESAGEM E CONTROLE)
// ===================================================================================

let contextMPId = null;

function renderMateriaPrima() {
    const tb = document.getElementById('mpBody');
    tb.innerHTML = '';
    const d = document.getElementById('mpDateFilter').value;

    mpData.filter(m => m.date === d).forEach(m => {
        const tr = document.createElement('tr');
        tr.className = 'interactive-row';
        tr.oncontextmenu = function (e) {
            e.preventDefault();
            contextMPId = m.id;
            openMPContextMenu(e.pageX, e.pageY);
        };

        const manualBadge = m.isManual ? '<span class="badge-manual" title="Inserido Manualmente">MANUAL</span>' : '';
        const diffFormatted = Number(m.difKg).toFixed(2);

        let nfDisplay = m.nf || 'S/N';
        let multiBtn = '';

        const truck = patioData.find(t => t.id === m.id);

        if (truck && truck.cargas && truck.cargas.length > 0) {
            const produtos = truck.cargas[0].produtos;
            const uniqueNFs = new Set(produtos.map(p => p.nf).filter(n => n && n.trim() !== '' && n !== 'S/N'));

            if (uniqueNFs.size > 1) {
                nfDisplay = `${m.nf} <small style="color:#666">(+${uniqueNFs.size - 1})</small>`;
                multiBtn = `<button class="btn-more-nf" onclick="showTruckNFs('${m.id}')" title="Ver todas as NFs/Produtos">+</button>`;
            }
        }

        tr.innerHTML = `
        <td>${new Date(m.date).toLocaleDateString()}</td>
        <td><b>${m.produto}</b> ${manualBadge}<br><small>${m.empresa}</small></td>
        <td>${m.placa}</td>
        <td>${m.local}</td>
        <td>${m.chegada ? m.chegada.slice(11, 16) : '-'}</td>
        <td>${m.entrada ? m.entrada.slice(11, 16) : '-'}</td>
        <td><input type="number" class="cell" style="width:100px" value="${m.tara}" onchange="updateWeights('${m.id}','tara',this.value)"></td>
        <td><input type="number" class="cell" style="width:100px" value="${m.bruto}" onchange="updateWeights('${m.id}','bruto',this.value)"></td>
        <td style="font-weight:bold">${m.liq}</td>
        <td><input type="number" class="cell" style="width:100px" value="${m.pesoNF}" onchange="updateWeights('${m.id}','pesoNF',this.value)"></td>
        <td style="color:${m.difKg < 0 ? 'red' : 'green'}">${diffFormatted}</td>
        <td>${m.difPerc}%</td>
        <td>${m.saida ? m.saida.slice(11, 16) : '-'}</td>
        <td style="display:flex; align-items:center; justify-content:space-between;">
            <div>
                ${nfDisplay} 
                ${m.notes ? '<i class="fas fa-sticky-note" style="color:#f59e0b; margin-left:5px;" title="' + m.notes + '"></i>' : ''}
            </div>
            ${multiBtn}
        </td>`;
        tb.appendChild(tr);
    });
}

function updateWeights(id, f, v) {
    const i = mpData.findIndex(m => m.id === id); 
    if (i > -1) {
        mpData[i][f] = parseFloat(v) || 0; 
        mpData[i].liq = mpData[i].bruto - mpData[i].tara;
        mpData[i].difKg = mpData[i].liq - mpData[i].pesoNF; 
        mpData[i].difPerc = mpData[i].pesoNF ? ((mpData[i].difKg / mpData[i].pesoNF) * 100).toFixed(2) : 0;
        saveAll(); 
        renderMateriaPrima();
    }
}

function openMPContextMenu(x, y) {
    const m = document.getElementById('ctxMenuMP');
    const hasMap = mapData.some(map => map.id === contextMPId);

    let mapOption = '';
    if (hasMap) {
        mapOption = `<div class="ctx-item" onclick="goToMapFromContext('${contextMPId}')"><i class="fas fa-map"></i> Abrir Mapa Cego</div><hr style="margin:5px 0; border-color:var(--border-color);">`;
    }

    m.innerHTML = `
        <div class="ctx-item" onclick="openEditMPModal()"><i class="fas fa-edit"></i> Editar Dados</div>
        <div class="ctx-item" onclick="openNoteMPModal()"><i class="fas fa-sticky-note"></i> Observação</div>
        ${mapOption}
        <div class="ctx-item" onclick="openManualMPModal()"><i class="fas fa-plus-circle"></i> Adicionar Manualmente</div>
        <div class="ctx-item" onclick="deleteMateriaPrima()" style="color:red;"><i class="fas fa-trash"></i> Excluir Linha</div>
    `;

    let posX = x;
    let posY = y;
    if (x + 220 > window.innerWidth) posX = window.innerWidth - 230;

    m.style.left = posX + 'px';
    m.style.top = posY + 'px';
    m.style.display = 'block';
}

function showTruckNFs(id) {
    const truck = patioData.find(t => t.id === id);
    if (!truck) return;

    const list = document.getElementById('multiNFList');
    list.innerHTML = '';

    const produtos = truck.cargas[0].produtos;

    produtos.forEach(p => {
        list.innerHTML += `
            <li>
                <span>${p.nome}</span>
                <strong>NF: ${p.nf || 'S/N'}</strong>
            </li>`;
    });

    document.getElementById('modalMultiNF').style.display = 'flex';
}

function goToMapFromContext(id) {
    closeContextMenu();
    navTo('mapas');
    setTimeout(() => {
        loadMap(id);
    }, 100);
}

function deleteMateriaPrima() {
    if (confirm("Deseja excluir este registro de pesagem?")) {
        mpData = mpData.filter(x => x.id !== contextMPId);
        saveAll(); renderMateriaPrima();
    }
    closeContextMenu();
}

function openManualMPModal() {
    document.getElementById('manMPPlaca').value = '';
    document.getElementById('manMPProd').value = '';
    document.getElementById('manMPEmp').value = '';
    document.getElementById('manMPNF').value = '';
    document.getElementById('manMPTara').value = '0';
    document.getElementById('modalManualMP').style.display = 'flex';
    closeContextMenu();
}

function saveManualMP() {
    const pl = document.getElementById('manMPPlaca').value.toUpperCase();
    const pr = document.getElementById('manMPProd').value;
    if (!pl || !pr) return alert("Placa e Produto são obrigatórios.");
    const id = 'MAN_' + Date.now();
    const d = document.getElementById('mpDateFilter').value || getBrazilTime().split('T')[0];
    mpData.push({
        id: id, date: d, produto: pr, empresa: document.getElementById('manMPEmp').value,
        placa: pl, local: 'MANUAL', chegada: getBrazilTime(), entrada: getBrazilTime(),
        tara: parseFloat(document.getElementById('manMPTara').value) || 0, bruto: 0, liq: 0, pesoNF: 0, difKg: 0, difPerc: 0,
        nf: document.getElementById('manMPNF').value, notes: '', isManual: true
    });
    saveAll(); renderMateriaPrima(); document.getElementById('modalManualMP').style.display = 'none';
}

function openEditMPModal() { 
    const m = mpData.find(x => x.id === contextMPId); 
    document.getElementById('editMPId').value = m.id; 
    document.getElementById('editMPEmpresa').value = m.empresa; 
    document.getElementById('editMPPlaca').value = m.placa; 
    document.getElementById('editMPProduto').value = m.produto; 
    document.getElementById('modalEditMP').style.display = 'flex'; 
    closeContextMenu(); 
}

function saveEditMP() { 
    const id = document.getElementById('editMPId').value; 
    const i = mpData.findIndex(x => x.id === id); 
    if (i > -1) { 
        mpData[i].empresa = document.getElementById('editMPEmpresa').value; 
        mpData[i].placa = document.getElementById('editMPPlaca').value; 
        mpData[i].produto = document.getElementById('editMPProduto').value; 
        saveAll(); renderMateriaPrima(); 
    } 
    document.getElementById('modalEditMP').style.display = 'none'; 
}

function openNoteMPModal() { 
    const m = mpData.find(x => x.id === contextMPId); 
    document.getElementById('noteMPId').value = m.id; 
    document.getElementById('noteMPText').value = m.notes || ''; 
    document.getElementById('modalNoteMP').style.display = 'flex'; 
    closeContextMenu(); 
}

function saveNoteMP() { 
    const id = document.getElementById('noteMPId').value; 
    const i = mpData.findIndex(x => x.id === id); 
    if (i > -1) { 
        mpData[i].notes = document.getElementById('noteMPText').value; 
        saveAll(); renderMateriaPrima(); 
    } 
    document.getElementById('modalNoteMP').style.display = 'none'; 
}
