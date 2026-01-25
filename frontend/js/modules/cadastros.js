// ===================================================================================
//  MÓDULO DE CADASTROS (CRUD)
//  Gestão completa de fornecedores, transportadoras, motoristas, placas e produtos
//  Inclui sistema de aprovação unificada de requisições
// ===================================================================================

let contextCadId = null;

// ===================================================================================
//  APROVAÇÃO UNIFICADA DE REQUISIÇÕES
// ===================================================================================

function openUnifiedApprovalModal(reqId) {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    document.getElementById('appReqId').value = reqId;
    const container = document.getElementById('approvalContainer');
    container.innerHTML = '';
    const d = req.data;

    if (!d.supplier.id && d.supplier.name) {
        container.innerHTML += `
            <div class="approval-section">
                <div class="badge-new-tag">Novo Fornecedor</div>
                <h4><i class="fas fa-building"></i> Dados do Fornecedor</h4>
                <div class="form-full">
                    <label class="form-label">Razão Social</label>
                    <input id="appSupName" class="form-input-styled highlight-req" value="${d.supplier.name}" oninput="this.value = Validators.cleanName(this.value)">
                </div>
                <div class="form-grid" style="margin-top:10px;">
                    <div><label class="form-label">Nome Fantasia</label><input id="appSupNick" class="form-input-styled" oninput="this.value = Validators.cleanName(this.value)"></div>
                    <div><label class="form-label">CNPJ</label><input id="appSupDoc" class="form-input-styled" maxlength="18" oninput="this.value = Validators.formatCNPJ(this.value)"></div>
                </div>
            </div>`;
    }

    if (!d.carrier.id && d.carrier.name) {
        container.innerHTML += `
            <div class="approval-section">
                <div class="badge-new-tag">Nova Transportadora</div>
                <h4><i class="fas fa-truck"></i> Dados da Transportadora</h4>
                <div class="form-full">
                    <label class="form-label">Razão Social</label>
                    <input id="appCarrName" class="form-input-styled highlight-req" value="${d.carrier.name}" oninput="this.value = Validators.cleanName(this.value)">
                </div>
                <div class="form-grid" style="margin-top:10px;">
                    <div><label class="form-label">Nome Fantasia</label><input id="appCarrNick" class="form-input-styled" oninput="this.value = Validators.cleanName(this.value)"></div>
                    <div><label class="form-label">CNPJ</label><input id="appCarrDoc" class="form-input-styled" maxlength="18" oninput="this.value = Validators.formatCNPJ(this.value)"></div>
                </div>
            </div>`;
    }

    if (!d.driver.id && d.driver.name) {
        container.innerHTML += `
            <div class="approval-section">
                <div class="badge-new-tag">Novo Motorista</div>
                <h4><i class="fas fa-user"></i> Dados do Motorista</h4>
                <div class="form-grid">
                    <div><label class="form-label">Nome Completo</label><input id="appDrivName" class="form-input-styled highlight-req" value="${d.driver.name}" oninput="this.value = Validators.cleanName(this.value)"></div>
                    <div><label class="form-label">CPF/CNH</label><input id="appDrivDoc" class="form-input-styled" maxlength="14" oninput="this.value = Validators.onlyNumbers(this.value)"></div>
                </div>
            </div>`;
    }

    if (!d.plate.id && d.plate.number) {
        container.innerHTML += `
            <div class="approval-section">
                <div class="badge-new-tag">Nova Placa</div>
                <h4><i class="fas fa-id-card"></i> Dados do Veículo</h4>
                <div class="form-full">
                    <label class="form-label">Número da Placa</label>
                    <input id="appPlateNum" class="form-input-styled highlight-req" value="${d.plate.number}" maxlength="8" oninput="this.value = Validators.validatePlate(this.value)">
                </div>
            </div>`;
    }

    if (d.newProducts && d.newProducts.length > 0) {
        let prodHtml = '';
        d.newProducts.forEach((prod, idx) => {
            prodHtml += `
                <div class="approval-prod-item">
                    <div>
                        <label class="form-label">Nome do Produto</label>
                        <input id="appProdName_${idx}" class="form-input-styled highlight-req" value="${prod}">
                    </div>
                    <div>
                        <label class="form-label">Código (Opcional)</label>
                        <input id="appProdCode_${idx}" class="form-input-styled" oninput="this.value = Validators.cleanAlphaNum(this.value)">
                    </div>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="approval-section">
                <div class="badge-new-tag">${d.newProducts.length} Produtos Novos</div>
                <h4><i class="fas fa-box"></i> Cadastro de Produtos</h4>
                ${prodHtml}
            </div>`;
    }

    if (container.innerHTML === '') {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum dado novo para cadastrar. Apenas vínculos serão criados.</p>';
    }

    document.getElementById('modalUnifiedApproval').style.display = 'flex';
}

function confirmUnifiedApproval() {
    const reqId = document.getElementById('appReqId').value;
    const req = requests.find(r => r.id === reqId);
    if (!req) return alert('Requisição não encontrada.');
    
    const d = req.data;

    let supId = d.supplier.id;
    if (!supId && d.supplier.name) {
        const nameEl = document.getElementById('appSupName');
        const nickEl = document.getElementById('appSupNick');
        const docEl = document.getElementById('appSupDoc');
        
        if (!nameEl || !nameEl.value.trim()) {
            return alert('Razão Social do Fornecedor é obrigatória.');
        }
        
        const name = nameEl.value.toUpperCase();
        const nick = nickEl ? nickEl.value.toUpperCase() : '';
        const doc = docEl ? docEl.value : '';
        
        supId = Date.now().toString();
        suppliersData.push({ id: supId, nome: name, apelido: nick, cnpj: doc });
    }

    let carId = d.carrier.id;
    if (!carId && d.carrier.name) {
        const nameEl = document.getElementById('appCarrName');
        const nickEl = document.getElementById('appCarrNick');
        const docEl = document.getElementById('appCarrDoc');
        
        if (!nameEl || !nameEl.value.trim()) {
            return alert('Razão Social da Transportadora é obrigatória.');
        }
        
        const name = nameEl.value.toUpperCase();
        const nick = nickEl ? nickEl.value.toUpperCase() : '';
        const doc = docEl ? docEl.value : '';
        
        carId = (Date.now() + 1).toString();
        carriersData.push({ 
            id: carId, 
            nome: name, 
            apelido: nick, 
            cnpj: doc, 
            supplierIds: supId ? [supId] : [] 
        });
    } else if (carId && supId) {
        const c = carriersData.find(x => x.id === carId);
        if (c) {
            if (!c.supplierIds) c.supplierIds = [];
            if (!c.supplierIds.includes(supId)) c.supplierIds.push(supId);
        }
    }

    let drivId = d.driver.id;
    if (!drivId && d.driver.name) {
        const nameEl = document.getElementById('appDrivName');
        const docEl = document.getElementById('appDrivDoc');
        
        if (!nameEl || !nameEl.value.trim()) {
            return alert('Nome do Motorista é obrigatório.');
        }
        
        const name = nameEl.value.toUpperCase();
        const doc = docEl ? docEl.value : '';
        
        drivId = (Date.now() + 2).toString();
        driversData.push({ 
            id: drivId, 
            nome: name, 
            doc: doc, 
            carrierIds: carId ? [carId] : [] 
        });
    } else if (drivId && carId) {
        const dr = driversData.find(x => x.id === drivId);
        if (dr) {
            if (!dr.carrierIds) dr.carrierIds = [];
            if (!dr.carrierIds.includes(carId)) dr.carrierIds.push(carId);
        }
    }

    let plateId = d.plate.id;
    if (!plateId && d.plate.number) {
        const numEl = document.getElementById('appPlateNum');
        
        if (!numEl || !numEl.value.trim()) {
            return alert('Placa é obrigatória.');
        }
        
        const num = numEl.value.toUpperCase();
        plateId = (Date.now() + 3).toString();
        platesData.push({ id: plateId, numero: num, driverId: drivId });
    }

    if (d.newProducts && d.newProducts.length > 0) {
        d.newProducts.forEach((_, idx) => {
            const nameEl = document.getElementById(`appProdName_${idx}`);
            const codeEl = document.getElementById(`appProdCode_${idx}`);
            
            if (nameEl && nameEl.value.trim()) {
                const name = nameEl.value.toUpperCase();
                const code = codeEl ? codeEl.value : '';
                
                if (!productsData.find(p => p.nome === name)) {
                    productsData.push({ 
                        id: (Date.now() + idx + 10).toString(), 
                        nome: name, 
                        codigo: code 
                    });
                }
            }
        });
    }

    const truck = patioData.find(t => t.linkedRequestId === reqId);
    if (truck) {
        truck.isProvisory = false;
        truck.supplierId = supId;
        truck.carrierId = carId;
        truck.driverId = drivId;
        truck.plateId = plateId;
        
        const carrNickEl = document.getElementById('appCarrNick');
        const carrNameEl = document.getElementById('appCarrName');
        const plateNumEl = document.getElementById('appPlateNum');
        
        if (!d.carrier.id && (carrNickEl || carrNameEl)) {
            truck.empresa = (carrNickEl && carrNickEl.value) || (carrNameEl && carrNameEl.value) || truck.empresa;
        }
        if (!d.plate.id && plateNumEl) {
            truck.placa = plateNumEl.value || truck.placa;
        }
    }

    req.status = 'APROVADO';
    saveAll();
    renderCadastros();
    document.getElementById('modalUnifiedApproval').style.display = 'none';
    alert("Aprovado e cadastrado com sucesso!");
}

function rejectUnifiedRequest() {
    const reqId = document.getElementById('appReqId').value;
    if (!confirm("Rejeitar requisição? O caminhão continuará como provisório.")) return;

    const req = requests.find(r => r.id === reqId);
    if (req) req.status = 'REJEITADO';

    saveAll();
    renderCadastros();
    document.getElementById('modalUnifiedApproval').style.display = 'none';
}

// ===================================================================================
//  MODAL DE CADASTRO UNIFICADO
// ===================================================================================

function openCadSelectModal() {
    document.getElementById('modalCadSelect').style.display = 'flex';
}

function openCadModal(type, editId = null) {
    document.getElementById('modalCadSelect').style.display = 'none';
    const modal = document.getElementById('modalCadForm');
    modal.style.display = 'flex';

    document.getElementById('cadFormType').value = type;
    document.getElementById('cadFormId').value = editId || '';

    const titleEl = document.getElementById('cadFormTitle');
    const fields = document.getElementById('cadFormFields');
    fields.innerHTML = '';

    const titles = {
        fornecedor: 'Fornecedor',
        transportadora: 'Transportadora',
        motorista: 'Motorista',
        placa: 'Veículo/Placa',
        produto: 'Produto'
    };
    const actionText = editId ? 'Editar' : 'Novo';
    titleEl.innerHTML = `<i class="fas fa-pen-square" style="color:var(--primary)"></i> ${actionText} ${titles[type] || 'Cadastro'}`;

    if (type === 'fornecedor') {
        fields.innerHTML = `
            <div class="form-full">
                <label class="form-label"><i class="fas fa-building"></i> Razão Social</label>
                <input id="cadName" class="form-input-styled" placeholder="Nome Oficial" oninput="this.value = Validators.cleanName(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-tag"></i> Nome Fantasia / Apelido</label>
                <input id="cadNick" class="form-input-styled" placeholder="Nome curto" oninput="this.value = Validators.cleanName(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-id-card"></i> CNPJ</label>
                <input id="cadDoc" class="form-input-styled input-fit-content" placeholder="00.000.000/0000-00" maxlength="18" oninput="this.value = Validators.formatCNPJ(this.value)">
            </div>
        `;
    }
    else if (type === 'transportadora') {
        fields.innerHTML = `
            <div class="form-full">
                <label class="form-label"><i class="fas fa-truck"></i> Razão Social</label>
                <input id="cadName" class="form-input-styled" placeholder="Transportadora LTDA" oninput="this.value = Validators.cleanName(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-tag"></i> Nome Fantasia</label>
                <input id="cadNick" class="form-input-styled" placeholder="Apelido" oninput="this.value = Validators.cleanName(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-id-card"></i> CNPJ</label>
                <input id="cadDoc" class="form-input-styled input-fit-content" placeholder="00.000.000/0000-00" maxlength="18" oninput="this.value = Validators.formatCNPJ(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-link"></i> Fornecedores Vinculados (Segure Ctrl)</label>
                <select id="cadLinks" multiple class="form-input-styled" style="height:100px;"></select>
            </div>
        `;
        suppliersData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            document.getElementById('cadLinks').appendChild(opt);
        });
    }
    else if (type === 'motorista') {
        fields.innerHTML = `
            <div class="form-full">
                <label class="form-label"><i class="fas fa-user"></i> Nome Completo</label>
                <input id="cadName" class="form-input-styled" placeholder="Nome do Motorista" oninput="this.value = Validators.cleanName(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-id-card"></i> CPF ou CNH</label>
                <input id="cadDoc" class="form-input-styled input-fit-content" placeholder="000.000.000-00" maxlength="14" oninput="this.value = Validators.onlyNumbers(this.value)">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-link"></i> Transportadora Vinculada</label>
                <select id="cadLinks" class="form-input-styled"><option value="">Nenhuma</option></select>
            </div>
        `;
        carriersData.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.apelido || c.nome;
            document.getElementById('cadLinks').appendChild(opt);
        });
    }
    else if (type === 'placa') {
        fields.innerHTML = `
            <div class="form-full">
                <label class="form-label"><i class="fas fa-car"></i> Placa do Veículo</label>
                <input id="cadName" class="form-input-styled" placeholder="ABC-1234" maxlength="8" oninput="this.value = Validators.validatePlate(this.value)" style="text-transform:uppercase">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-link"></i> Motorista Responsável</label>
                <select id="cadLinks" class="form-input-styled"><option value="">Nenhum</option></select>
            </div>
        `;
        driversData.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.nome;
            document.getElementById('cadLinks').appendChild(opt);
        });
    }
    else if (type === 'produto') {
        fields.innerHTML = `
            <div class="form-full">
                <label class="form-label"><i class="fas fa-box"></i> Nome do Produto</label>
                <input id="cadName" class="form-input-styled" placeholder="Ex: AÇÚCAR CRISTAL">
            </div>
            <div class="form-full">
                <label class="form-label"><i class="fas fa-barcode"></i> Código do Produto</label>
                <input id="cadDoc" class="form-input-styled input-fit-content" placeholder="Código Interno" oninput="this.value = Validators.cleanAlphaNum(this.value)">
            </div>
        `;
    }

    if (editId) {
        let item = null;
        if (type === 'fornecedor') item = suppliersData.find(x => x.id === editId);
        else if (type === 'transportadora') item = carriersData.find(x => x.id === editId);
        else if (type === 'motorista') item = driversData.find(x => x.id === editId);
        else if (type === 'placa') item = platesData.find(x => x.id === editId);
        else if (type === 'produto') item = productsData.find(x => x.id === editId);

        if (item) {
            const nameEl = document.getElementById('cadName');
            const nickEl = document.getElementById('cadNick');
            const docEl = document.getElementById('cadDoc');
            const linksEl = document.getElementById('cadLinks');

            if (nameEl) nameEl.value = item.nome || item.numero || '';
            if (nickEl) nickEl.value = item.apelido || '';
            if (docEl) docEl.value = item.cnpj || item.doc || item.codigo || '';
            
            if (linksEl) {
                if (type === 'transportadora' && item.supplierIds) {
                    Array.from(linksEl.options).forEach(opt => {
                        if (item.supplierIds.includes(opt.value)) opt.selected = true;
                    });
                } else if (type === 'motorista' && item.carrierIds && item.carrierIds[0]) {
                    linksEl.value = item.carrierIds[0];
                } else if (type === 'placa' && item.driverId) {
                    linksEl.value = item.driverId;
                }
            }
        }
    }
}

function saveOfficialCadastro() {
    const type = document.getElementById('cadFormType').value;
    const id = document.getElementById('cadFormId').value;
    const name = document.getElementById('cadName').value.toUpperCase().trim();

    if (!name) return alert('Preencha o campo principal.');

    const updateList = (list, data) => {
        if (id) {
            const idx = list.findIndex(x => x.id === id);
            if (idx > -1) list[idx] = { ...list[idx], ...data };
        } else {
            list.push({ id: Date.now().toString(), ...data });
        }
    };

    if (type === 'fornecedor') {
        const nick = document.getElementById('cadNick').value.toUpperCase().trim();
        const doc = document.getElementById('cadDoc').value;
        updateList(suppliersData, { nome: name, apelido: nick, cnpj: doc });
    }
    else if (type === 'transportadora') {
        const nick = document.getElementById('cadNick').value.toUpperCase().trim();
        const doc = document.getElementById('cadDoc').value;
        const links = Array.from(document.getElementById('cadLinks').selectedOptions).map(o => o.value);
        updateList(carriersData, { nome: name, apelido: nick, cnpj: doc, supplierIds: links });
    }
    else if (type === 'motorista') {
        const doc = document.getElementById('cadDoc').value;
        const link = document.getElementById('cadLinks').value;
        updateList(driversData, { nome: name, doc: doc, carrierIds: link ? [link] : [] });
    }
    else if (type === 'placa') {
        const link = document.getElementById('cadLinks').value;
        updateList(platesData, { numero: name, driverId: link });
    }
    else if (type === 'produto') {
        const code = document.getElementById('cadDoc').value;
        updateList(productsData, { nome: name, codigo: code });
    }

    saveAll();
    document.getElementById('modalCadForm').style.display = 'none';
    renderCadastros();
}

// ===================================================================================
//  RENDERIZAÇÃO E LISTAGEM
// ===================================================================================

function renderCadastros() {
    const type = document.getElementById('cadFilterType').value;
    const term = document.getElementById('cadSearch').value.toUpperCase();
    const thead = document.getElementById('cadTableHead');
    const tbody = document.getElementById('cadTableBody');
    tbody.innerHTML = '';
    thead.innerHTML = '';

    if (type === 'requests') {
        thead.innerHTML = `<tr><th>Data</th><th>Detalhes da Requisição</th><th style="text-align:right">Ação</th></tr>`;
        renderRequestsTable(term);
        return;
    }

    let list = [];
    let cols = '';

    if (type === 'fornecedor') {
        cols = `<tr><th>Fornecedor</th><th style="text-align:right">Ações</th></tr>`;
        list = suppliersData;
    }
    else if (type === 'transportadora') {
        cols = `<tr><th>Transportadora (Apelido / Razão Social)</th><th>CNPJ</th><th>Vínculos</th><th style="text-align:right">Ações</th></tr>`;
        list = carriersData;
    }
    else if (type === 'motorista') {
        cols = `<tr><th>Nome</th><th>Documento</th><th>Transportadora</th><th style="text-align:right">Ações</th></tr>`;
        list = driversData;
    }
    else if (type === 'placa') {
        cols = `<tr><th>Placa</th><th>Motorista Responsável</th><th style="text-align:right">Ações</th></tr>`;
        list = platesData;
    }
    else if (type === 'produto') {
        cols = `<tr><th>Produto</th><th>Código</th><th style="text-align:right">Ações</th></tr>`;
        list = productsData;
    }
    thead.innerHTML = cols;

    const filtered = list.filter(i => (i.nome || i.numero || '').toUpperCase().includes(term));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        let html = '';
        const actions = `
            <button class="action-btn edit" onclick="openCadModal('${type}', '${item.id}')" title="Editar">
                <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn delete" onclick="deleteCadastro('${type}', '${item.id}')" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
        `;

        if (type === 'fornecedor') {
            html = `<td><b>${item.nome}</b></td><td>${actions}</td>`;
        }
        else if (type === 'transportadora') {
            const incomplete = !item.cnpj ? '<span class="tag-incomplete" title="Falta CNPJ">!</span>' : '';
            const count = item.supplierIds ? item.supplierIds.length : 0;
            html = `
                <td>
                    <div style="font-weight:600; color:#1e293b;">${item.apelido || item.nome} ${incomplete}</div>
                    <div style="font-size:0.75rem; color:#64748b;">${item.nome}</div>
                </td>
                <td class="font-mono text-sm">${item.cnpj || '-'}</td>
                <td><span class="badge-link">${count} Fornecedores</span></td>
                <td>${actions}</td>`;
        }
        else if (type === 'motorista') {
            let transpName = '-';
            if (item.carrierIds && item.carrierIds.length > 0) {
                const c = carriersData.find(x => x.id === item.carrierIds[0]);
                if (c) transpName = c.apelido || c.nome;
            }
            html = `<td><b>${item.nome}</b></td><td>${item.doc || '-'}</td><td>${transpName}</td><td>${actions}</td>`;
        }
        else if (type === 'placa') {
            let drivName = '-';
            if (item.driverId) {
                const d = driversData.find(x => x.id === item.driverId);
                if (d) drivName = d.nome;
            }
            html = `<td><b>${item.numero}</b></td><td>${drivName}</td><td>${actions}</td>`;
        }
        else if (type === 'produto') {
            html = `<td><b>${item.nome}</b></td><td>${item.codigo || '-'}</td><td>${actions}</td>`;
        }

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function renderRequestsTable(term) {
    const tbody = document.getElementById('cadTableBody');
    requests.filter(r => r.status === 'PENDENTE' && r.type === 'complex_entry').forEach(r => {
        const d = r.data;
        let novos = [];
        if (!d.supplier.id) novos.push(`Fornecedor`);
        if (!d.carrier.id && d.carrier.name) novos.push(`Transp`);
        if (!d.driver.id) novos.push(`Mot`);
        if (!d.plate.id) novos.push(`Placa`);
        if (d.newProducts && d.newProducts.length > 0) novos.push(`${d.newProducts.length} Prod(s)`);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(r.timestamp).toLocaleString()}</td>
            <td>
                <b>Cadastros Pendentes:</b> <span style="color:#d97706">${novos.join(', ')}</span>
                <br><small>Solicitado por: ${r.user}</small>
            </td>
            <td style="text-align:right">
                <button class="btn btn-save btn-small" onclick="openUnifiedApprovalModal('${r.id}')">
                    <i class="fas fa-search"></i> Analisar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteCadastro(type, id) {
    if (!confirm("Excluir este registro? Isso pode afetar históricos antigos.")) return;

    if (type === 'fornecedor') suppliersData = suppliersData.filter(x => x.id !== id);
    else if (type === 'transportadora') carriersData = carriersData.filter(x => x.id !== id);
    else if (type === 'motorista') driversData = driversData.filter(x => x.id !== id);
    else if (type === 'placa') platesData = platesData.filter(x => x.id !== id);
    else if (type === 'produto') productsData = productsData.filter(x => x.id !== id);

    saveAll();
    renderCadastros();
}

function populateSelect(selectId, dataArr, displayField = 'nome') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione...</option>';
    dataArr.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item[displayField] || item.nome;
        sel.appendChild(opt);
    });
}
