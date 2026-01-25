// ===================================================================================
//          MÓDULO DE MATÉRIA-PRIMA (PESAGEM E CONTROLE)
// ===================================================================================

let contextMPId = null;

function loadMP(id) {
    const item = mpData.find(m => m.id === id);
    if (item) {
        document.getElementById('mpDateFilter').value = item.date;
        renderMateriaPrima();
        // Opcional: Scroll até o item ou destaque visual
        setTimeout(() => {
            const el = Array.from(document.querySelectorAll('#mpBody tr')).find(tr => tr.innerHTML.includes(item.placa));
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

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
    const emp = document.getElementById('manMPEmp').value;
    
    if (!pl || !pr) return alert("Placa e Produto são obrigatórios.");

    // Sistema de Requisições para Pesagem Manual
    const prodExists = productsData.some(p => p.nome.toUpperCase() === pr.toUpperCase());
    const empExists = suppliersData.some(s => s.nome.toUpperCase() === emp.toUpperCase());

    if (!prodExists || !empExists) {
        const missing = [];
        if (!prodExists) missing.push(`Produto: ${pr}`);
        if (!empExists) missing.push(`Empresa: ${emp}`);
        
        if (confirm(`As seguintes informações não estão cadastradas:\n\n${missing.join('\n')}\n\nDeseja enviar uma requisição para o administrador cadastrar?`)) {
            requests.push({
                id: Date.now(),
                user: loggedUser.username,
                target: 'Admin',
                type: 'CADASTRO',
                msg: `Solicitação de cadastro manual na Pesagem:\n${missing.join('\n')}`,
                status: 'pending',
                date: getBrazilTime()
            });
            alert("Requisição enviada ao administrador.");
        }
    }

    const id = 'MAN_' + Date.now();
    const d = document.getElementById('mpDateFilter').value || getBrazilTime().split('T')[0];
    
    mpData.push({
        id: id, date: d, produto: pr, empresa: emp,
        placa: pl, local: 'MANUAL', chegada: getBrazilTime(), entrada: getBrazilTime(),
        tara: parseFloat(document.getElementById('manMPTara').value) || 0, bruto: 0, liq: 0, pesoNF: 0, difKg: 0, difPerc: 0,
        nf: document.getElementById('manMPNF').value, notes: '', isManual: true
    });
    
    saveAll(); 
    renderMateriaPrima(); 
    document.getElementById('modalManualMP').style.display = 'none';
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

// ===================================================================================
//  NOVO SISTEMA DE PESAGEM MANUAL COM REQUISIÇÕES COMPLEXAS
// ===================================================================================

let weighingState = {
    selectedSupplierId: null,
    selectedDriverId: null,
    selectedPlateId: null,
    selectedProductId: null
};

function openManualWeighingModal() {
    // Reset state
    weighingState = {
        selectedSupplierId: null,
        selectedDriverId: null,
        selectedPlateId: null,
        selectedProductId: null
    };

    // Clear inputs
    ['mwForn', 'mwProd', 'mwPlaca', 'mwMot', 'mwNF', 'mwPesoNF'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('input-warning');
        }
    });

    // Hide warning and show save button
    document.getElementById('mwWarningBox').style.display = 'none';
    document.getElementById('btnSaveMW').style.display = 'inline-block';
    document.getElementById('btnReqMW').style.display = 'none';

    // Populate datalists
    populateDatalist('dlForn', suppliersData);
    populateDatalist('dlMot', driversData);
    populateDatalist('dlPlaca', platesData, 'numero');
    populateDatalist('prodListSuggestions', productsData);

    document.getElementById('modalManualWeighing').style.display = 'flex';
}

function filterWeighingChain(step) {
    const inForn = document.getElementById('mwForn');
    const inProd = document.getElementById('mwProd');
    const inPlaca = document.getElementById('mwPlaca');
    const inMot = document.getElementById('mwMot');

    const findId = (arr, val, field = 'nome') => {
        if (!val) return null;
        const vUpper = val.toUpperCase().trim();
        return arr.find(x => {
            const fieldVal = x[field] || x.nome || x.numero;
            return fieldVal && fieldVal.toUpperCase() === vUpper;
        })?.id || null;
    };

    if (step === 'fornecedor') {
        inForn.value = Validators.cleanName(inForn.value);
        weighingState.selectedSupplierId = findId(suppliersData, inForn.value);
        checkFieldStatus('mwForn', weighingState.selectedSupplierId);
    }

    if (step === 'produto') {
        inProd.value = inProd.value.toUpperCase().trim();
        weighingState.selectedProductId = findId(productsData, inProd.value);
        checkFieldStatus('mwProd', weighingState.selectedProductId);
    }

    if (step === 'placa') {
        inPlaca.value = Validators.validatePlate(inPlaca.value);
        const raw = inPlaca.value.replace(/[^A-Z0-9]/g, '');
        weighingState.selectedPlateId = platesData.find(p => p.numero.replace('-', '') === raw)?.id || null;
        checkFieldStatus('mwPlaca', weighingState.selectedPlateId);

        // Auto-populate driver if plate is found
        if (weighingState.selectedPlateId) {
            const plate = platesData.find(p => p.id === weighingState.selectedPlateId);
            if (plate && plate.driverId) {
                const driver = driversData.find(d => d.id === plate.driverId);
                if (driver) {
                    inMot.value = driver.nome;
                    weighingState.selectedDriverId = driver.id;
                    checkFieldStatus('mwMot', weighingState.selectedDriverId);
                }
            }
        }
    }

    if (step === 'motorista') {
        inMot.value = Validators.cleanName(inMot.value);
        weighingState.selectedDriverId = findId(driversData, inMot.value);
        checkFieldStatus('mwMot', weighingState.selectedDriverId);

        // Filter plates by driver
        if (weighingState.selectedDriverId) {
            const validPlates = platesData.filter(p => p.driverId === weighingState.selectedDriverId);
            populateDatalist('dlPlaca', validPlates, 'numero');
        } else {
            populateDatalist('dlPlaca', platesData, 'numero');
        }
    }

    evaluateWeighingRequestNecessity();
}

function evaluateWeighingRequestNecessity() {
    const inForn = document.getElementById('mwForn');
    const inProd = document.getElementById('mwProd');
    const inPlaca = document.getElementById('mwPlaca');
    const inMot = document.getElementById('mwMot');

    const isNewForn = inForn.value && !weighingState.selectedSupplierId;
    const isNewProd = inProd.value && !weighingState.selectedProductId;
    const isNewPlaca = inPlaca.value && !weighingState.selectedPlateId;
    const isNewMot = inMot.value && !weighingState.selectedDriverId;

    const btnSave = document.getElementById('btnSaveMW');
    const btnReq = document.getElementById('btnReqMW');
    const warnBox = document.getElementById('mwWarningBox');

    if (isNewForn || isNewProd || isNewPlaca || isNewMot) {
        if (warnBox) warnBox.style.display = 'block';
        if (btnSave) btnSave.style.display = 'none';
        if (btnReq) btnReq.style.display = 'inline-block';
    } else {
        if (warnBox) warnBox.style.display = 'none';
        if (btnSave) btnSave.style.display = 'inline-block';
        if (btnReq) btnReq.style.display = 'none';
    }
}

function saveManualWeighing() {
    const fornVal = document.getElementById('mwForn').value.toUpperCase().trim();
    const prodVal = document.getElementById('mwProd').value.toUpperCase().trim();
    const placaVal = document.getElementById('mwPlaca').value.toUpperCase().trim();
    const motVal = document.getElementById('mwMot').value.toUpperCase().trim();
    const nfVal = document.getElementById('mwNF').value.trim();
    const pesoNFVal = parseFloat(document.getElementById('mwPesoNF').value) || 0;

    if (!fornVal || !prodVal || !placaVal) {
        return alert("Fornecedor, Produto e Placa são obrigatórios.");
    }

    const id = 'MW_' + Date.now();
    const d = document.getElementById('mpDateFilter').value || getBrazilTime().split('T')[0];

    mpData.push({
        id: id,
        date: d,
        produto: prodVal,
        empresa: fornVal,
        placa: placaVal,
        local: 'PESAGEM MANUAL',
        chegada: getBrazilTime(),
        entrada: getBrazilTime(),
        tara: 0,
        bruto: 0,
        liq: 0,
        pesoNF: pesoNFVal,
        difKg: 0 - pesoNFVal,
        difPerc: pesoNFVal ? (((0 - pesoNFVal) / pesoNFVal) * 100).toFixed(2) : 0,
        nf: nfVal || 'S/N',
        notes: motVal ? `Motorista: ${motVal}` : '',
        isManual: true
    });

    saveAll();
    renderMateriaPrima();
    document.getElementById('modalManualWeighing').style.display = 'none';
    alert("Pesagem manual registrada com sucesso!");
}

function submitWeighingRequest() {
    const fornVal = document.getElementById('mwForn').value.toUpperCase().trim();
    const prodVal = document.getElementById('mwProd').value.toUpperCase().trim();
    const placaVal = document.getElementById('mwPlaca').value.toUpperCase().trim();
    const motVal = document.getElementById('mwMot').value.toUpperCase().trim();
    const nfVal = document.getElementById('mwNF').value.trim();
    const pesoNFVal = parseFloat(document.getElementById('mwPesoNF').value) || 0;

    if (!fornVal || !prodVal || !placaVal) {
        return alert("Fornecedor, Produto e Placa são obrigatórios.");
    }

    const reqId = 'REQ_WEIGH_' + Date.now();
    const newProducts = [];
    
    if (prodVal && !weighingState.selectedProductId) {
        newProducts.push(prodVal);
    }

    // Create complex request
    requests.push({
        id: reqId,
        type: 'complex_entry',
        status: 'PENDENTE',
        user: (typeof loggedUser !== 'undefined' ? loggedUser.username : 'Operador'),
        timestamp: getBrazilTime(),
        source: 'PESAGEM_MANUAL',
        data: {
            supplier: { name: fornVal, id: weighingState.selectedSupplierId },
            carrier: { name: '', id: null },
            driver: { name: motVal, id: weighingState.selectedDriverId },
            plate: { number: placaVal, id: weighingState.selectedPlateId },
            newProducts: newProducts,
            additionalInfo: {
                nf: nfVal,
                pesoNF: pesoNFVal
            }
        }
    });

    // Send notification
    if (typeof sendSystemNotification === 'function') {
        sendSystemNotification("Nova Requisição", "Pesagem manual pendente de aprovação.", "cadastros");
    }

    // Still create the weighing record
    const id = 'MW_' + Date.now();
    const d = document.getElementById('mpDateFilter').value || getBrazilTime().split('T')[0];

    mpData.push({
        id: id,
        date: d,
        produto: prodVal,
        empresa: fornVal,
        placa: placaVal,
        local: 'PESAGEM MANUAL (PENDENTE)',
        chegada: getBrazilTime(),
        entrada: getBrazilTime(),
        tara: 0,
        bruto: 0,
        liq: 0,
        pesoNF: pesoNFVal,
        difKg: 0 - pesoNFVal,
        difPerc: pesoNFVal ? (((0 - pesoNFVal) / pesoNFVal) * 100).toFixed(2) : 0,
        nf: nfVal || 'S/N',
        notes: motVal ? `Motorista: ${motVal} | REQ: ${reqId}` : `REQ: ${reqId}`,
        isManual: true
    });

    saveAll();
    renderMateriaPrima();
    document.getElementById('modalManualWeighing').style.display = 'none';
    alert("Requisição enviada ao administrador e pesagem registrada!");
}
