// ===================================================================================
//  MÓDULO DE ENTRADA DE CAMINHÕES E GESTÃO DO PÁTIO
//  Controle completo de entrada, saída e movimentação de veículos no pátio
// ===================================================================================

let entryState = {
    selectedSupplierId: null,
    selectedCarrierId: null,
    selectedDriverId: null,
    selectedPlateId: null
};

let tmpItems = [];
let contextTruckId = null;
let deleteOptionSelected = 'queue';
let editTmpItems = [];
let isEditingMode = false;

const defaultProducts = ["CX PAP 125A", "AÇ CRISTAL", "AÇ LIQUIDO", "AÇ REFINADO", "SAL REFINADO"];

// ===================================================================================
//  FUNÇÕES AUXILIARES
// ===================================================================================

function populateDatalist(listId, dataArr, displayField = 'nome') {
    const dl = document.getElementById(listId);
    if (!dl) return;
    dl.innerHTML = '';
    dataArr.forEach(item => {
        const val = item[displayField] || item.nome;
        const opt = document.createElement('option');
        opt.value = val;
        dl.appendChild(opt);
    });
}

function toggleCarrierInput() {
    const chk = document.getElementById('chkUseCarrier');
    const input = document.getElementById('inTransp');

    if (chk.checked) {
        input.disabled = false;
        input.style.backgroundColor = 'var(--bg-input)';
        input.style.cursor = 'text';
        input.focus();
    } else {
        input.disabled = true;
        input.style.backgroundColor = '#f1f5f9';
        input.style.cursor = 'not-allowed';
        input.value = '';
        entryState.selectedCarrierId = null;
        input.classList.remove('input-warning');
        filterChain('transportadora');
    }
    
    evaluateRequestNecessity();
}

function filterChain(step) {
    const inForn = document.getElementById('inForn');
    const inTransp = document.getElementById('inTransp');
    const inMot = document.getElementById('inMot');
    const inPlaca = document.getElementById('inPlaca');
    const useCarrier = document.getElementById('chkUseCarrier').checked;

    const findId = (arr, val) => {
        if (!val) return null;
        const vUpper = val.toUpperCase().trim();
        return arr.find(x =>
            (x.nome && x.nome.toUpperCase() === vUpper) ||
            (x.apelido && x.apelido.toUpperCase() === vUpper) ||
            (x.numero && x.numero === vUpper)
        )?.id || null;
    };

    if (step === 'fornecedor') {
        inForn.value = Validators.cleanName(inForn.value);
        entryState.selectedSupplierId = findId(suppliersData, inForn.value);
        checkFieldStatus('inForn', entryState.selectedSupplierId);

        if (useCarrier) {
            let validCarriers = carriersData;
            if (entryState.selectedSupplierId) {
                validCarriers = carriersData.filter(c => c.supplierIds && c.supplierIds.includes(entryState.selectedSupplierId));
            }
            populateDatalist('dlTransp', validCarriers, 'apelido');
        }
    }

    if (step === 'transportadora' || step === 'fornecedor') {
        if (useCarrier) {
            inTransp.value = Validators.cleanName(inTransp.value);
            entryState.selectedCarrierId = findId(carriersData, inTransp.value);
            checkFieldStatus('inTransp', entryState.selectedCarrierId);

            if (entryState.selectedCarrierId) {
                const validDrivers = driversData.filter(d => d.carrierIds && d.carrierIds.includes(entryState.selectedCarrierId));
                populateDatalist('dlMot', validDrivers);
            } else {
                populateDatalist('dlMot', driversData);
            }
        } else {
            entryState.selectedCarrierId = null;
            populateDatalist('dlMot', driversData);
        }
    }

    if (step === 'motorista' || step === 'transportadora') {
        inMot.value = Validators.cleanName(inMot.value);
        entryState.selectedDriverId = findId(driversData, inMot.value);
        checkFieldStatus('inMot', entryState.selectedDriverId);

        let validPlates = platesData;
        if (entryState.selectedDriverId) {
            validPlates = platesData.filter(p => p.driverId === entryState.selectedDriverId);
        }
        populateDatalist('dlPlaca', validPlates, 'numero');
    }

    if (step === 'placa' || step === 'motorista') {
        inPlaca.value = Validators.validatePlate(inPlaca.value);
        const raw = inPlaca.value.replace(/[^A-Z0-9]/g, '');
        entryState.selectedPlateId = platesData.find(p => p.numero.replace('-', '') === raw)?.id || null;
        checkFieldStatus('inPlaca', entryState.selectedPlateId);
    }

    evaluateRequestNecessity();
}

function checkFieldStatus(inputId, idFound) {
    const el = document.getElementById(inputId);
    if (!el) return;
    if (el.value.trim() !== '' && !idFound) el.classList.add('input-warning');
    else el.classList.remove('input-warning');
}

// ===================================================================================
//  MODAL DE ENTRADA
// ===================================================================================

function modalTruckOpen() {
    entryState = { selectedSupplierId: null, selectedCarrierId: null, selectedDriverId: null, selectedPlateId: null };
    tmpItems = [];
    document.getElementById('tmpList').innerHTML = '';

    ['inForn', 'inTransp', 'inMot', 'inPlaca', 'tmpProd', 'tmpNF'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.classList.remove('input-warning'); }
    });

    document.getElementById('addDestino').value = 'DOCA';
    document.getElementById('chkBalan').checked = false;
    document.getElementById('chkLaudo').checked = false;

    const chkCarrier = document.getElementById('chkUseCarrier');
    chkCarrier.checked = false;
    toggleCarrierInput();

    document.getElementById('entryWarningBox').style.display = 'none';
    document.getElementById('btnSaveTruck').style.display = 'inline-block';
    document.getElementById('btnReqTruck').style.display = 'none';

    populateDatalist('dlForn', suppliersData);
    populateDatalist('dlTransp', []);
    populateDatalist('dlMot', driversData);
    populateDatalist('dlPlaca', []);
    populateDatalist('prodListSuggestions', productsData);

    document.getElementById('modalTruck').style.display = 'flex';
}

function openProdSelect() {
    const l = document.getElementById('prodList'); 
    l.innerHTML = '';
    defaultProducts.forEach(p => { 
        l.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; cursor:pointer;" onclick="selectProd('${p}')">${p}</div>`; 
    });
    document.getElementById('modalProductSelect').style.display = 'flex';
    const s = document.getElementById('prodSearch'); 
    s.value = ''; 
    s.focus();
}

function filterProducts() {
    const t = document.getElementById('prodSearch').value.toUpperCase(); 
    const l = document.getElementById('prodList'); 
    l.innerHTML = '';
    defaultProducts.filter(p => p.includes(t)).forEach(p => { 
        l.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; cursor:pointer;" onclick="selectProd('${p}')">${p}</div>`; 
    });
}

function selectProd(name) {
    if (isEditingMode) document.getElementById('editTmpProd').value = name; 
    else document.getElementById('tmpProd').value = name;
    document.getElementById('modalProductSelect').style.display = 'none'; 
    isEditingMode = false;
}

function addTmpItem() {
    const nfEl = document.getElementById('tmpNF');
    const prodEl = document.getElementById('tmpProd');
    
    const nf = nfEl.value.toUpperCase().trim();
    const prodVal = prodEl.value.toUpperCase().trim();

    if (prodVal) {
        const exists = productsData.find(p => p.nome === prodVal);
        const isNew = !exists;

        tmpItems.push({ nf: nf || 'S/N', prod: prodVal, isNew: isNew });

        const newBadge = isNew ? '<span style="background:#f59e0b; color:white; font-size:0.7rem; padding:1px 4px; border-radius:4px; margin-left:5px;">NOVO</span>' : '';

        document.getElementById('tmpList').innerHTML += `<li><b>${nf || 'S/N'}</b>: ${prodVal} ${newBadge}</li>`;

        prodEl.value = '';
        nfEl.value = '';
        prodEl.classList.remove('input-warning');
        prodEl.focus();

        evaluateRequestNecessity();
    }
}

function checkProductInput() {
    const el = document.getElementById('tmpProd');
    const val = el.value.toUpperCase();

    if (document.getElementById('prodListSuggestions').options.length === 0) {
        const dl = document.getElementById('prodListSuggestions');
        dl.innerHTML = '';
        productsData.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.nome;
            dl.appendChild(opt);
        });
    }

    const exists = productsData.find(p => p.nome === val);
    if (val.length > 0 && !exists) {
        el.classList.add('input-warning');
    } else {
        el.classList.remove('input-warning');
    }

    evaluateRequestNecessity();
}

function evaluateRequestNecessity() {
    const inForn = document.getElementById('inForn');
    const inTransp = document.getElementById('inTransp');
    const inMot = document.getElementById('inMot');
    const inPlaca = document.getElementById('inPlaca');
    const useCarrier = document.getElementById('chkUseCarrier').checked;

    const isNewForn = inForn.value && !entryState.selectedSupplierId;
    const isNewTransp = useCarrier && inTransp.value && !entryState.selectedCarrierId;
    const isNewMot = inMot.value && !entryState.selectedDriverId;
    const isNewPlaca = inPlaca.value && !entryState.selectedPlateId;
    const hasNewProd = tmpItems.some(i => i.isNew);

    const btnSave = document.getElementById('btnSaveTruck');
    const btnReq = document.getElementById('btnReqTruck');
    const warnBox = document.getElementById('entryWarningBox');

    if (isNewForn || isNewTransp || isNewMot || isNewPlaca || hasNewProd) {
        if (warnBox) warnBox.style.display = 'block';
        if (btnSave) btnSave.style.display = 'none';
        if (btnReq) btnReq.style.display = 'inline-block';
    } else {
        if (warnBox) warnBox.style.display = 'none';
        if (btnSave) btnSave.style.display = 'inline-block';
        if (btnReq) btnReq.style.display = 'none';
    }
}

// ===================================================================================
//  SALVAR ENTRADA NORMAL
// ===================================================================================

function saveTruckAndMap() {
    const placaVal = document.getElementById('inPlaca').value;
    if (!placaVal) return alert("A Placa é obrigatória.");
    if (tmpItems.length === 0 && document.getElementById('tmpProd').value) addTmpItem();
    if (tmpItems.length === 0) return alert("Adicione pelo menos um produto.");

    const dest = document.getElementById('addDestino').value;
    const useCarrier = document.getElementById('chkUseCarrier').checked;
    const transpVal = useCarrier ? document.getElementById('inTransp').value.toUpperCase() : '';

    const laudo = document.getElementById('chkLaudo').checked;
    const balan = document.getElementById('chkBalan').checked;

    const secMap = { 
        'DOCA': { n: 'DOCA (ALM)', c: 'ALM' }, 
        'GAVA': { n: 'GAVA', c: 'GAVA' }, 
        'MANUTENCAO': { n: 'MANUTENÇÃO', c: 'OUT' }, 
        'INFRA': { n: 'INFRAESTRUTURA', c: 'OUT' }, 
        'PESAGEM': { n: 'SALA DE PESAGEM', c: 'OUT' }, 
        'LAB': { n: 'LABORATÓRIO', c: 'OUT' }, 
        'SST': { n: 'SST', c: 'OUT' }, 
        'CD': { n: 'CD', c: 'OUT' }, 
        'OUT': { n: 'OUTROS', c: 'OUT' }, 
        'COMPRAS': { n: 'COMPRAS', c: 'OUT' } 
    };
    const sec = secMap[dest] || { n: 'OUTROS', c: 'OUT' };
    const id = Date.now().toString();
    const todayStr = getBrazilTime().split('T')[0];
    const dailyCount = patioData.filter(t => (t.chegada || '').startsWith(todayStr)).length;
    const seq = dailyCount + 1;

    let fornName = '';
    if (entryState.selectedSupplierId) {
        const s = suppliersData.find(x => x.id === entryState.selectedSupplierId);
        fornName = s ? s.nome : '';
    } else {
        fornName = document.getElementById('inForn').value.toUpperCase();
    }

    const displayCompany = transpVal || fornName;

    patioData.push({
        id,
        empresa: displayCompany,
        supplierId: entryState.selectedSupplierId,
        carrierId: useCarrier ? entryState.selectedCarrierId : null,
        driverId: entryState.selectedDriverId,
        plateId: entryState.selectedPlateId,
        placa: placaVal,
        local: sec.c,
        localSpec: sec.n,
        status: 'FILA',
        sequencia: seq,
        recebimentoNotified: false,
        saidaNotified: false,
        comLaudo: laudo,
        releasedBy: null,
        chegada: getBrazilTime(),
        saida: null,
        isProvisory: false,
        cargas: [{ numero: '1', produtos: tmpItems.map(i => ({ nome: i.prod, qtd: '-', nf: i.nf })) }]
    });

    const mapRows = tmpItems.map((item, idx) => ({ 
        id: id + '_' + idx, 
        desc: item.prod, 
        qty: '', 
        qty_nf: '', 
        nf: item.nf, 
        forn: fornName, 
        owners: {} 
    }));
    
    for (let i = mapRows.length; i < 8; i++) {
        mapRows.push({ id: id + '_x_' + i, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} });
    }

    mapData.push({ 
        id, 
        date: todayStr, 
        rows: mapRows, 
        placa: placaVal, 
        setor: sec.n, 
        launched: false, 
        signatures: {}, 
        forceUnlock: false, 
        divergence: null 
    });

    if (balan) {
        mpData.push({ 
            id, 
            date: todayStr, 
            produto: tmpItems[0].prod, 
            empresa: fornName, 
            placa: placaVal, 
            local: sec.n, 
            chegada: getBrazilTime(), 
            entrada: null, 
            tara: 0, 
            bruto: 0, 
            liq: 0, 
            pesoNF: 0, 
            difKg: 0, 
            difPerc: 0, 
            nf: tmpItems[0].nf, 
            notes: '' 
        });
    }

    saveAll();
    document.getElementById('modalTruck').style.display = 'none';
    renderPatio();
    tmpItems = [];
    alert(`Veículo #${seq} registrado!`);
}

// ===================================================================================
//  SALVAR REQUISIÇÃO COMPLEXA
// ===================================================================================

function submitComplexRequest() {
    const inForn = document.getElementById('inForn').value.toUpperCase();
    const useCarrier = document.getElementById('chkUseCarrier').checked;
    const inTransp = useCarrier ? document.getElementById('inTransp').value.toUpperCase() : '';
    const inMot = document.getElementById('inMot').value.toUpperCase();
    const inPlaca = document.getElementById('inPlaca').value.toUpperCase();

    if (document.getElementById('tmpProd').value) addTmpItem();
    if (tmpItems.length === 0) return alert("Adicione produto.");

    const reqId = 'REQ_' + Date.now();
    const id = Date.now().toString();
    const todayStr = getBrazilTime().split('T')[0];
    const newProducts = [...new Set(tmpItems.filter(i => i.isNew).map(i => i.prod))];

    requests.push({
        id: reqId,
        type: 'complex_entry',
        status: 'PENDENTE',
        user: (typeof loggedUser !== 'undefined' ? loggedUser.username : 'Portaria'),
        timestamp: getBrazilTime(),
        data: {
            supplier: { name: inForn, id: entryState.selectedSupplierId },
            carrier: { name: inTransp, id: entryState.selectedCarrierId },
            driver: { name: inMot, id: entryState.selectedDriverId },
            plate: { number: inPlaca, id: entryState.selectedPlateId },
            newProducts: newProducts
        }
    });

    sendSystemNotification("Nova Requisição", "Entrada pendente.", "cadastros");

    const visualForn = inForn || "Fornecedor Pendente";
    const visualEmpresa = inTransp || visualForn;

    const dest = document.getElementById('addDestino').value;
    const secMap = { 
        'DOCA': { n: 'DOCA (ALM)', c: 'ALM' }, 
        'GAVA': { n: 'GAVA', c: 'GAVA' }, 
        'MANUTENCAO': { n: 'MANUTENÇÃO', c: 'OUT' } 
    };
    const sec = secMap[dest] || { n: 'OUTROS', c: 'OUT' };
    const seq = patioData.filter(t => (t.chegada || '').startsWith(todayStr)).length + 1;

    patioData.push({
        id: id,
        empresa: visualEmpresa,
        supplierId: entryState.selectedSupplierId,
        carrierId: useCarrier ? entryState.selectedCarrierId : null,
        driverId: entryState.selectedDriverId,
        plateId: entryState.selectedPlateId,
        placa: inPlaca,
        local: sec.c,
        localSpec: sec.n,
        status: 'FILA',
        sequencia: seq,
        chegada: getBrazilTime(),
        isProvisory: true,
        linkedRequestId: reqId,
        cargas: [{ numero: '1', produtos: tmpItems.map(i => ({ nome: i.prod, qtd: '-', nf: i.nf })) }]
    });

    const mapRows = tmpItems.map((item, idx) => ({ 
        id: id + '_' + idx, 
        desc: item.prod, 
        qty: '', 
        nf: item.nf, 
        forn: visualForn, 
        owners: {} 
    }));
    
    for (let i = mapRows.length; i < 8; i++) {
        mapRows.push({ id: id + '_x_' + i, desc: '', qty: '', nf: '', forn: '', owners: {} });
    }
    
    mapData.push({ 
        id, 
        date: todayStr, 
        rows: mapRows, 
        placa: inPlaca, 
        setor: sec.n, 
        launched: false, 
        signatures: {}, 
        forceUnlock: false, 
        divergence: null 
    });

    if (document.getElementById('chkBalan').checked) {
        mpData.push({ 
            id, 
            date: todayStr, 
            produto: tmpItems[0].prod, 
            empresa: visualForn, 
            placa: inPlaca, 
            local: sec.n, 
            chegada: getBrazilTime(), 
            tara: 0, 
            bruto: 0, 
            liq: 0, 
            pesoNF: 0, 
            difKg: 0, 
            difPerc: 0, 
            nf: tmpItems[0].nf, 
            notes: 'Cadastro Pendente' 
        });
    }

    saveAll();
    document.getElementById('modalTruck').style.display = 'none';
    renderPatio();
    tmpItems = [];
    alert("Entrada liberada PROVISORIAMENTE.");
}

// ===================================================================================
//  RENDERIZAÇÃO DO PÁTIO
// ===================================================================================

function renderPatio() {
    const filterEl = document.getElementById('patioDateFilter');
    const fd = filterEl ? filterEl.value : getBrazilTime().split('T')[0];

    ['ALM', 'GAVA', 'OUT', 'SAIU'].forEach(c => {
        const list = document.getElementById('list-' + c);
        if (list) list.innerHTML = '';
        const count = document.getElementById('count-' + c);
        if (count && c !== 'SAIU') count.textContent = '0';
    });

    const badge = document.getElementById('totalTrucksBadge');
    if (badge) {
        const dailyActiveCount = patioData.filter(x => x.status !== 'SAIU' && (x.chegada || '').startsWith(fd)).length;
        badge.innerText = dailyActiveCount;
    }

    const list = patioData.filter(c => {
        if (c.status === 'SAIU') return (c.saida || '').startsWith(fd);
        return (c.chegada || '').split('T')[0] === fd;
    }).sort((a, b) => new Date(a.chegada) - new Date(b.chegada));

    list.forEach(c => {
        const isSaiu = c.status === 'SAIU';
        const colId = isSaiu ? 'SAIU' : (c.local || 'OUT');
        const container = document.getElementById('list-' + colId);
        if (!container) return;

        if (!isSaiu) {
            const cnt = document.getElementById('count-' + colId);
            if (cnt) cnt.textContent = parseInt(cnt.textContent) + 1;
        }

        const card = document.createElement('div');
        card.className = 'truck-card';
        if (c.isProvisory) card.style.borderLeft = "4px solid #f59e0b";

        card.oncontextmenu = (e) => { e.preventDefault(); openTruckContextMenu(e.pageX, e.pageY, c.id); };

        let displayName = c.empresa;
        if (c.supplierId) {
            const s = suppliersData.find(x => x.id === c.supplierId);
            if (s) displayName = s.nome;
        }

        const laudoHtml = !isSaiu ? `<div style="font-size:0.7rem; font-weight:bold; margin-top:5px; color:${c.comLaudo ? '#16a34a' : '#dc2626'}">${c.comLaudo ? '<i class="fas fa-check-circle"></i> COM LAUDO' : '<i class="fas fa-times-circle"></i> SEM LAUDO'}</div>` : '';

        let btn = '';
        if (!isSaiu) {
            if (c.status === 'FILA') btn = `<button onclick="changeStatus('${c.id}','LIBERADO')" class="btn btn-save" style="width:100%; margin-top:5px;">CHAMAR</button>`;
            else if (c.status === 'LIBERADO') btn = `<button onclick="changeStatus('${c.id}','ENTROU')" class="btn btn-launch" style="width:100%; margin-top:5px;">ENTRADA</button>`;
            else if (c.status === 'ENTROU') btn = `<button onclick="changeStatus('${c.id}','SAIU')" class="btn btn-edit" style="width:100%; margin-top:5px;">SAÍDA</button>`;
        }

        card.innerHTML = `
            <div class="card-basic">
                <div>
                    <div class="card-company">${displayName} <span style="font-weight:normal; font-size:0.8em; color:#666;">#${c.sequencia || ''}</span> ${c.isProvisory ? '<span style="font-size:0.6rem; background:orange; color:white; padding:2px">REQ</span>' : ''}</div>
                    <small>${c.placa} • ${c.chegada.slice(11, 16)}</small>
                    <div class="sector-tag">${c.localSpec}</div>
                    ${laudoHtml}
                </div>
            </div>
            <div class="status-badge st-${c.status === 'FILA' ? 'wait' : (c.status === 'LIBERADO' ? 'called' : (c.status === 'ENTROU' ? 'ok' : 'out'))}">${c.status}</div>
            <div class="card-expanded-content" style="display:none">
                ${(c.cargas && c.cargas[0] && c.cargas[0].produtos ? c.cargas[0].produtos.map(p => `<div>${p.nome}</div>`).join('') : '')}
                ${btn}
            </div>
        `;

        card.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                const exp = card.querySelector('.card-expanded-content');
                exp.style.display = exp.style.display === 'none' ? 'block' : 'none';
            }
        };
        container.appendChild(card);
    });
}

function changeStatus(id, st) {
    const i = patioData.findIndex(c => c.id === id); 
    if (i > -1) {
        patioData[i].status = st;
        if (st === 'LIBERADO') { 
            patioData[i].releasedBy = loggedUser.username; 
            patioData[i].recebimentoNotified = false; 
        }
        if (st === 'ENTROU') { 
            const m = mpData.find(x => x.id === id); 
            if (m) m.entrada = getBrazilTime(); 
        }
        if (st === 'SAIU') { 
            const now = getBrazilTime(); 
            patioData[i].saida = now; 
            const m = mpData.find(x => x.id === id); 
            if (m) m.saida = now; 
        }
        saveAll(); 
        renderPatio();
    }
}

// ===================================================================================
//  MENU DE CONTEXTO E EDIÇÃO
// ===================================================================================

function openTruckContextMenu(x, y, id) {
    contextTruckId = id;
    const m = document.getElementById('ctxMenuTruck');

    m.innerHTML = `
        <div class="ctx-item" onclick="openEditTruck('${id}')"><i class="fas fa-edit"></i> Editar Veículo</div>
        <div class="ctx-item" onclick="confirmDeleteTruck('${id}')" style="color:red"><i class="fas fa-trash"></i> Excluir...</div>
    `;

    let posX = x;
    let posY = y;
    if (x + 200 > window.innerWidth) posX = window.innerWidth - 220;

    m.style.left = posX + 'px';
    m.style.top = posY + 'px';
    m.style.display = 'block';
}

function confirmDeleteTruck(id) {
    contextTruckId = id;
    deleteOptionSelected = 'queue';
    document.querySelectorAll('.del-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('optQueue').classList.add('selected');
    document.getElementById('modalDeleteConfirm').style.display = 'flex';
    closeContextMenu();
}

function selectDeleteOption(opt) {
    deleteOptionSelected = opt;
    document.querySelectorAll('.del-option').forEach(el => el.classList.remove('selected'));
    if (opt === 'queue') document.getElementById('optQueue').classList.add('selected');
    else document.getElementById('optGeneral').classList.add('selected');
}

function executeDeleteTruck() {
    const id = contextTruckId;
    if (!id) return;

    if (deleteOptionSelected === 'queue') {
        patioData = patioData.filter(x => x.id !== id);
    }
    else if (deleteOptionSelected === 'general') {
        patioData = patioData.filter(x => x.id !== id);
        mapData = mapData.filter(x => x.id !== id);
        mpData = mpData.filter(x => x.id !== id);
        requests = requests.filter(r => true);
    }

    saveAll();
    renderPatio();
    if (document.getElementById('view-mapas').classList.contains('active')) renderMapList();
    if (document.getElementById('view-materia-prima').classList.contains('active')) renderMateriaPrima();

    document.getElementById('modalDeleteConfirm').style.display = 'none';
    alert("Registro excluído com sucesso.");
}

function openEditTruck(id) {
    const truck = patioData.find(t => t.id === id);
    if (!truck) return;

    document.getElementById('editTruckId').value = id;
    document.getElementById('editTruckPlaca').value = truck.placa;

    const secMapReverse = { 
        'DOCA (ALM)': 'DOCA', 
        'GAVA': 'GAVA', 
        'MANUTENÇÃO': 'MANUTENCAO', 
        'INFRAESTRUTURA': 'INFRA', 
        'SALA DE PESAGEM': 'PESAGEM', 
        'LABORATÓRIO': 'LAB' 
    };
    document.getElementById('editTruckDestino').value = secMapReverse[truck.localSpec] || 'OUT';

    document.getElementById('editTruckLaudo').checked = truck.comLaudo || false;

    editTmpItems = JSON.parse(JSON.stringify(truck.cargas[0].produtos));
    renderEditTmpList();

    document.getElementById('modalEditTruck').style.display = 'flex';
    closeContextMenu();
}

function renderEditTmpList() {
    const ul = document.getElementById('editTmpList');
    ul.innerHTML = '';
    editTmpItems.forEach((item, index) => {
        ul.innerHTML += `
            <li>
                <span><b>${item.nf || 'S/N'}</b> - ${item.nome}</span>
                <button class="btn-icon-remove" onclick="removeEditTmpItem(${index})"><i class="fas fa-trash"></i></button>
            </li>`;
    });
}

function addEditTmpItem() {
    const nf = document.getElementById('editTmpNF').value;
    const prod = document.getElementById('editTmpProd').value.toUpperCase();
    if (prod) {
        editTmpItems.push({ nf: nf || 'S/N', nome: prod });
        renderEditTmpList();
        document.getElementById('editTmpProd').value = '';
        document.getElementById('editTmpNF').value = '';
    }
}

function removeEditTmpItem(i) { 
    editTmpItems.splice(i, 1); 
    renderEditTmpList(); 
}

function openProdSelectForEdit() { 
    isEditingMode = true; 
    openProdSelect(); 
}

function saveEditTruck() {
    const id = document.getElementById('editTruckId').value;
    const placa = document.getElementById('editTruckPlaca').value.toUpperCase();
    const dest = document.getElementById('editTruckDestino').value;
    const laudo = document.getElementById('editTruckLaudo').checked;

    if (!id) return alert("Erro: ID do veículo não encontrado.");

    const truckIndex = patioData.findIndex(t => t.id === id);

    if (truckIndex > -1) {
        const truck = patioData[truckIndex];

        truck.placa = placa;
        truck.comLaudo = laudo;

        const secMap = {
            'DOCA': { n: 'DOCA (ALM)', c: 'ALM' },
            'GAVA': { n: 'GAVA', c: 'GAVA' },
            'MANUTENCAO': { n: 'MANUTENÇÃO', c: 'OUT' },
            'INFRA': { n: 'INFRAESTRUTURA', c: 'OUT' },
            'PESAGEM': { n: 'SALA DE PESAGEM', c: 'OUT' },
            'LAB': { n: 'LABORATÓRIO', c: 'OUT' },
            'SST': { n: 'SST', c: 'OUT' },
            'CD': { n: 'CD', c: 'OUT' },
            'OUT': { n: 'OUTROS', c: 'OUT' },
            'COMPRAS': { n: 'COMPRAS', c: 'OUT' }
        };
        const newSec = secMap[dest] || { n: 'OUTROS', c: 'OUT' };

        if (truck.status !== 'SAIU') {
            truck.local = newSec.c;
            truck.localSpec = newSec.n;
        }

        if (editTmpItems && editTmpItems.length > 0) {
            if (!truck.cargas || truck.cargas.length === 0) truck.cargas = [{}];
            truck.cargas[0].produtos = JSON.parse(JSON.stringify(editTmpItems));

            const mapIndex = mapData.findIndex(m => m.id === id);
            if (mapIndex > -1) {
                const currentForn = mapData[mapIndex].rows[0]?.forn || truck.empresa || 'Diversos';

                const newRows = editTmpItems.map((item, idx) => ({
                    id: id + '_' + idx,
                    desc: item.nome,
                    qty: '',
                    qty_nf: '',
                    nf: item.nf,
                    forn: currentForn,
                    owners: {}
                }));

                for (let i = newRows.length; i < 8; i++) {
                    newRows.push({ id: id + '_x_' + i, desc: '', qty: '', qty_nf: '', nf: '', forn: '', owners: {} });
                }
                mapData[mapIndex].rows = newRows;
            }
        }

        saveAll();
        renderPatio();
        document.getElementById('modalEditTruck').style.display = 'none';

    } else {
        alert("Erro Crítico: Veículo não encontrado na lista para edição.");
    }
}

function deleteTruck() {
    const id = document.getElementById('editTruckId').value;
    if (confirm('ATENÇÃO: Isso apaga o registro do pátio, mapa cego e pesagem. Confirmar?')) {
        patioData = patioData.filter(x => x.id !== id); 
        mapData = mapData.filter(x => x.id !== id); 
        mpData = mpData.filter(x => x.id !== id);
        saveAll(); 
        renderPatio(); 
        document.getElementById('modalEditTruck').style.display = 'none';
    }
}
