// ===================================================================================
//          MÓDULO DE CARREGAMENTO (GESTÃO DE CARRETAS E EXPEDIÇÃO)
// ===================================================================================

let contextCarrId = null;

function renderCarregamento() {
    const tb = document.getElementById('carrBody');
    if (!tb) return;
    tb.innerHTML = '';
    const d = document.getElementById('carrDateFilter').value;

    carregamentoData.filter(c => c.date === d).forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'interactive-row';
        tr.oncontextmenu = function (e) {
            e.preventDefault();
            contextCarrId = c.id;
            openCarrContextMenu(e.pageX, e.pageY);
        };

        let btn = '';
        if (c.status === 'AGUARDANDO') btn = `<button class="btn btn-save btn-small" onclick="changeStatusCarregamento('${c.id}','CARREGANDO')">Iniciar</button>`;
        else if (c.status === 'CARREGANDO') btn = `<button class="btn btn-launch btn-small" onclick="changeStatusCarregamento('${c.id}','SAIU')">Finalizar</button>`;

        tr.innerHTML = `
            <td>${new Date(c.date).toLocaleDateString()}</td>
            <td><b>${c.motorista}</b></td>
            <td>${c.cavalo}</td>
            <td>${c.carretas.join(', ')}</td>
            <td><input type="number" class="cell" style="width:80px" value="${c.tara}" onchange="updateCarrWeight('${c.id}','tara',this.value)"></td>
            <td><input type="number" class="cell" style="width:80px" value="${c.bruto}" onchange="updateCarrWeight('${c.id}','bruto',this.value)"></td>
            <td style="font-weight:bold">${c.liq}</td>
            <td><span class="status-badge st-${c.status === 'AGUARDANDO' ? 'wait' : (c.status === 'CARREGANDO' ? 'ok' : 'out')}">${c.status}</span></td>
            <td>${c.checkin ? c.checkin.slice(11, 16) : '-'}</td>
            <td>${c.start ? c.start.slice(11, 16) : '-'}</td>
            <td>${c.checkout ? c.checkout.slice(11, 16) : '-'}</td>
            <td>${c.notes ? '<i class="fas fa-sticky-note" style="color:#f59e0b;" title="' + c.notes + '"></i>' : ''}</td>
            <td>${btn}</td>
        `;
        tb.appendChild(tr);
    });
}

function updateCarrWeight(id, f, v) { 
    const i = carregamentoData.findIndex(c => c.id === id); 
    if (i > -1) { 
        carregamentoData[i][f] = parseFloat(v) || 0; 
        carregamentoData[i].liq = carregamentoData[i].bruto - carregamentoData[i].tara; 
        saveAll(); 
        renderCarregamento(); 
    } 
}

function changeStatusCarregamento(id, s) { 
    const i = carregamentoData.findIndex(c => c.id === id); 
    if (i > -1) { 
        carregamentoData[i].status = s; 
        if (s === 'CARREGANDO') carregamentoData[i].start = getBrazilTime(); 
        if (s === 'SAIU') carregamentoData[i].checkout = getBrazilTime(); 
        saveAll(); 
        renderCarregamento(); 
    } 
}

function openModalCarregamento() { 
    document.getElementById('modalCarregamento').style.display = 'flex'; 
}

function addCarretaField() { 
    document.getElementById('carretaContainer').innerHTML += `<input type="text" class="carrCarretaInput" style="width:100%; margin-top:5px;">`; 
}

function saveCarregamento() { 
    const mot = document.getElementById('carrMotorista').value; 
    const cav = document.getElementById('carrCavalo').value; 
    const arr = []; 
    document.querySelectorAll('.carrCarretaInput').forEach(i => { if (i.value) arr.push(i.value) }); 
    
    if (!mot || !cav) return alert("Motorista e Cavalo são obrigatórios.");

    // Sistema de Requisições para Carregamento Manual - VERSÃO COMPLEXA
    const motUpper = mot.toUpperCase();
    const cavUpper = cav.toUpperCase();
    
    const driver = driversData.find(d => d.nome.toUpperCase() === motUpper);
    const plate = platesData.find(p => (p.placa || p.numero || '').toUpperCase() === cavUpper);
    
    const motExists = !!driver;
    const plateExists = !!plate;

    if (!motExists || !plateExists) {
        const missing = [];
        if (!motExists) missing.push(`Motorista: ${mot}`);
        if (!plateExists) missing.push(`Placa (Cavalo): ${cav}`);
        
        if (confirm(`As seguintes informações não estão cadastradas:\n\n${missing.join('\n')}\n\nDeseja enviar uma requisição para o administrador cadastrar?`)) {
            const reqId = 'REQ_CARR_' + Date.now();
            
            // Criar requisição complexa igual à fila de caminhões
            requests.push({
                id: reqId,
                type: 'complex_entry',
                status: 'PENDENTE',
                user: (typeof loggedUser !== 'undefined' ? loggedUser.username : 'Operador'),
                timestamp: getBrazilTime(),
                source: 'CARREGAMENTO_MANUAL',
                data: {
                    supplier: { name: '', id: null },
                    carrier: { name: '', id: null },
                    driver: { name: mot, id: driver ? driver.id : null },
                    plate: { number: cav, id: plate ? plate.id : null },
                    newProducts: [],
                    additionalInfo: {
                        carretas: arr,
                        tipo: 'CARREGAMENTO'
                    }
                }
            });
            
            // Enviar notificação
            if (typeof sendSystemNotification === 'function') {
                sendSystemNotification("Nova Requisição", "Carregamento manual pendente de aprovação.", "cadastros");
            }
            
            alert("Requisição complexa enviada ao administrador.");
        }
    }

    const d = document.getElementById('carrDateFilter').value || getBrazilTime().split('T')[0];

    carregamentoData.push({ 
        id: Date.now().toString(), 
        date: d, 
        motorista: mot, 
        cavalo: cav, 
        carretas: arr, 
        tara: 0, 
        bruto: 0, 
        liq: 0, 
        status: 'AGUARDANDO', 
        checkin: getBrazilTime() 
    }); 
    saveAll(); 
    document.getElementById('modalCarregamento').style.display = 'none'; 
    renderCarregamento(); 
}

function openCarrContextMenu(x, y) { 
    const m = document.getElementById('ctxMenuCarr'); 
    m.innerHTML = `
        <div class="ctx-item" onclick="openEditCarrModal()"><i class="fas fa-edit"></i> Editar</div>
        <div class="ctx-item" onclick="openNoteCarrModal()"><i class="fas fa-sticky-note"></i> Nota</div>
        <div class="ctx-item" style="color:red" onclick="deleteCarregamento()"><i class="fas fa-trash"></i> Excluir</div>
    `; 
    m.style.left = x + 'px'; 
    m.style.top = y + 'px'; 
    m.style.display = 'block'; 
}

function openEditCarrModal() { 
    const c = carregamentoData.find(x => x.id === contextCarrId); 
    document.getElementById('editCarrId').value = c.id; 
    document.getElementById('editCarrMot').value = c.motorista; 
    document.getElementById('editCarrCav').value = c.cavalo; 
    document.getElementById('modalEditCarr').style.display = 'flex'; 
    closeContextMenu(); 
}

function saveEditCarr() { 
    const id = document.getElementById('editCarrId').value; 
    const i = carregamentoData.findIndex(x => x.id === id); 
    if (i > -1) { 
        carregamentoData[i].motorista = document.getElementById('editCarrMot').value; 
        carregamentoData[i].cavalo = document.getElementById('editCarrCav').value; 
        saveAll(); 
        renderCarregamento(); 
    } 
    document.getElementById('modalEditCarr').style.display = 'none'; 
}

function deleteCarregamento() { 
    if (confirm('Excluir?')) { 
        carregamentoData = carregamentoData.filter(x => x.id !== contextCarrId); 
        saveAll(); 
        renderCarregamento(); 
    } 
    closeContextMenu(); 
}

function openNoteCarrModal() { 
    const c = carregamentoData.find(x => x.id === contextCarrId); 
    document.getElementById('noteCarrId').value = c.id; 
    document.getElementById('noteCarrText').value = c.notes || ''; 
    document.getElementById('modalNoteCarr').style.display = 'flex'; 
    closeContextMenu(); 
}

function saveNoteCarr() { 
    const id = document.getElementById('noteCarrId').value; 
    const i = carregamentoData.findIndex(x => x.id === id); 
    if (i > -1) { 
        carregamentoData[i].notes = document.getElementById('noteCarrText').value; 
        saveAll(); 
        renderCarregamento(); 
    } 
    document.getElementById('modalNoteCarr').style.display = 'none'; 
}
