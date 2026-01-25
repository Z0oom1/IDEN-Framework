// ===================================================================================
//          MÓDULO DE RELATÓRIOS (GERAÇÃO, FILTRAGEM E PDF)
// ===================================================================================

let filteredReportData = [];
let selectedReportItems = new Set();
let currentReportType = 'patio';

function toggleReportSelection(id) {
    if (selectedReportItems.has(id)) selectedReportItems.delete(id);
    else selectedReportItems.add(id);
}

function toggleDivergenceGroup(groupId) {
    const rows = document.querySelectorAll(`.div-group-${groupId}`);
    rows.forEach(r => {
        r.classList.toggle('hidden-row');
    });

    const icon = document.getElementById(`icon-${groupId}`);
    if (icon) {
        icon.classList.toggle('rotate-90');
    }
}

function generateAdvancedReport() {
    const t = document.getElementById('repType').value;
    const s = document.getElementById('repDateStart').value;
    const e = document.getElementById('repDateEnd').value;
    const term = document.getElementById('repSearchTerm').value.toUpperCase();
    const area = document.getElementById('repResultArea');
    currentReportType = t;
    selectedReportItems.clear();

    let data = [];
    if (t === 'patio') data = patioData;
    else if (t === 'mapas') data = mapData;
    else if (t === 'carregamento') data = carregamentoData;
    else if (t === 'materia-prima') data = mpData;

    if (t === 'divergencias') {
        filteredReportData = [];
        const maps = mapData.filter(x => x.date >= s && x.date <= e);
        const aggregator = {};
        const parseNum = (v) => {
            if (!v) return 0;
            if (typeof v === 'number') return v;
            let cleanStr = String(v).replace(/\./g, '').replace(',', '.');
            return parseFloat(cleanStr) || 0;
        };

        maps.forEach(m => {
            if (!m.rows) return;
            m.rows.forEach(r => {
                const qnf = parseNum(r.qty_nf);
                const qc = parseNum(r.qty);
                const diff = qc - qnf;
                if (Math.abs(diff) < 0.001) return;

                const fornRaw = r.forn ? r.forn.trim().toUpperCase() : 'SEM FORNECEDOR';
                const prodRaw = r.desc ? r.desc.trim().toUpperCase() : 'PRODUTO INDEFINIDO';

                if (term) {
                    const searchStr = (fornRaw + ' ' + prodRaw).toUpperCase();
                    if (!searchStr.includes(term)) return;
                }

                const uniqueKey = `${fornRaw}|||${prodRaw}`;
                if (!aggregator[uniqueKey]) {
                    aggregator[uniqueKey] = {
                        id: 'DIV_' + Math.random().toString(36).substr(2, 9),
                        realKey: uniqueKey,
                        mapId: m.id,
                        date: m.date,
                        forn: fornRaw,
                        prod: prodRaw,
                        nfs: new Set(),
                        qnf: 0,
                        qc: 0,
                        diff: 0
                    };
                }

                aggregator[uniqueKey].diff += diff;
                aggregator[uniqueKey].qnf += qnf;
                aggregator[uniqueKey].qc += qc;

                if (r.nf) aggregator[uniqueKey].nfs.add(r.nf);

                if (m.date > aggregator[uniqueKey].date) {
                    aggregator[uniqueKey].date = m.date;
                    aggregator[uniqueKey].mapId = m.id;
                }
            });
        });

        const groups = {};
        Object.values(aggregator).forEach(item => {
            item.diff = parseFloat(item.diff.toFixed(2));
            item.qnf = parseFloat(item.qnf.toFixed(2));
            item.qc = parseFloat(item.qc.toFixed(2));

            if (item.diff === 0) return;

            item.nf = Array.from(item.nfs).join(', ');
            filteredReportData.push(item);

            if (!groups[item.forn]) groups[item.forn] = [];
            groups[item.forn].push(item);
        });

        let html = '<table class="modern-table"><thead><tr><th style="width:40px"></th><th>Fornecedor</th><th>Resumo</th></tr></thead><tbody>';

        if (Object.keys(groups).length === 0) {
            area.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma divergência pendente no período (Saldos zerados ou sem ocorrências).</p>';
            document.getElementById('repTotalCount').innerText = 0;
            document.getElementById('repFooter').style.display = 'none';
            return;
        }

        let groupIdCounter = 0;
        const sortedForns = Object.keys(groups).sort();

        for (const forn of sortedForns) {
            const items = groups[forn];
            groupIdCounter++;
            const groupId = 'g' + groupIdCounter;

            html += `
            <tr class="group-row" onclick="toggleDivergenceGroup('${groupId}')">
                <td><i id="icon-${groupId}" class="fas fa-chevron-right transition-icon"></i></td>
                <td>${forn}</td>
                <td><span style="background:#e2e8f0; padding:2px 8px; border-radius:10px; font-size:0.8rem;">${items.length} produto(s) com diferença</span></td>
            </tr>`;

            items.forEach(item => {
                const diffColor = item.diff > 0 ? 'green' : 'red';
                const diffSignal = item.diff > 0 ? '+' : '';

                html += `
                <tr class="detail-row div-group-${groupId} hidden-row interactive-row" onclick="openReportDetails('${item.id}', 'divergencias-single')">
                    <td><input type="checkbox" class="rep-check" onclick="event.stopPropagation(); toggleReportSelection('${item.id}')"></td>
                    <td colspan="2" style="padding-left:20px; background:#fff;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <b style="color:var(--text-main)">${item.prod}</b> 
                                <br><small style="color:#666">NF(s): ${item.nf}</small>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:bold; color:${diffColor}; font-size:1.1em;">
                                    Saldo: ${diffSignal}${item.diff}
                                </div>
                                <small style="color:#999">Qtd NF: ${item.qnf} | Físico: ${item.qc}</small>
                            </div>
                        </div>
                    </td>
                </tr>`;
            });
        }
        html += '</tbody></table>';
        area.innerHTML = html;
        document.getElementById('repTotalCount').innerText = filteredReportData.length;
        document.getElementById('repFooter').style.display = 'block';
        return;
    }

    filteredReportData = data.filter(i => {
        const d = i.chegada || i.date || i.checkin;
        if (!d) return false;
        const ds = d.slice(0, 10);
        if (ds < s || ds > e) return false;
        if (term) { return JSON.stringify(i).toUpperCase().includes(term); }
        return true;
    });

    let html = '<table class="modern-table"><thead><tr><th style="width:40px;">#</th>';
    if (t === 'patio') html += '<th>Data</th><th>Empresa</th><th>Placa</th><th>Status</th>';
    else if (t === 'mapas') html += '<th>Data</th><th>Placa</th><th>Fornecedor</th><th>Status</th>';
    else if (t === 'materia-prima') html += '<th>Data</th><th>Produto</th><th>Placa</th><th>Líquido</th>';
    else html += '<th>Data</th><th>Motorista</th><th>Status</th>';
    html += '</tr></thead><tbody>';

    filteredReportData.forEach((i, idx) => {
        html += `<tr onclick="openReportDetails(${idx}, '${t}')" class="interactive-row">`;
        html += `<td><input type="checkbox" class="rep-check" onclick="event.stopPropagation(); toggleReportSelection('${i.id}')"></td>`;

        if (t === 'patio') html += `<td>${new Date(i.chegada).toLocaleString()}</td><td>${i.empresa}</td><td>${i.placa}</td><td>${i.status}</td>`;
        else if (t === 'mapas') html += `<td>${i.date}</td><td>${i.placa}</td><td>${i.rows[0]?.forn}</td><td>${i.launched ? 'Lançado' : 'Rascunho'}</td>`;
        else if (t === 'materia-prima') html += `<td>${new Date(i.date).toLocaleDateString()}</td><td>${i.produto}</td><td>${i.placa}</td><td>${i.liq} Kg</td>`;
        else html += `<td>${new Date(i.checkin).toLocaleString()}</td><td>${i.motorista}</td><td>${i.status}</td>`;

        html += '</tr>';
    });
    html += '</tbody></table>';

    area.innerHTML = html;
    document.getElementById('repTotalCount').innerText = filteredReportData.length;
    document.getElementById('repFooter').style.display = 'block';
}

function openReportDetails(indexOrId, typeOverride) {
    let item;
    let type = typeOverride || currentReportType;

    if (type === 'divergencias-single') {
        item = filteredReportData.find(x => x.id === indexOrId);
        type = 'divergencias';
    } else {
        if (typeof indexOrId === 'string') {
            item = filteredReportData.find(x => x.id === indexOrId);
        } else {
            item = filteredReportData[indexOrId];
        }
    }

    if (!item) return;

    const modal = document.getElementById('modalReportDetail');
    const content = document.getElementById('repDetailContent');
    const actions = document.getElementById('repDetailActions');

    let html = '';
    let buttons = '';

    if (type === 'divergencias') {
        const diffColor = item.diff > 0 ? 'green' : 'red';
        const signal = item.diff > 0 ? '+' : '';

        html = `
            <div style="text-align:center; margin-bottom:15px;">
                <h2 style="color:${diffColor}; margin:0;">${signal}${item.diff}</h2>
                <small style="color:#666; text-transform:uppercase;">Diferença Encontrada</small>
            </div>
            <div class="form-grid">
                <div><strong>Produto:</strong><br>${item.prod}</div>
                <div><strong>Fornecedor:</strong><br>${item.forn}</div>
                <div><strong>Data:</strong><br>${item.date.split('-').reverse().join('/')}</div>
                <div><strong>Nota Fiscal:</strong><br>${item.nf}</div>
            </div>
            <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-top:15px;">
                <div style="display:flex; justify-content:space-between;">
                    <span>Quantidade na Nota (Fiscal):</span>
                    <strong>${item.qnf}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:5px;">
                    <span>Quantidade Contada (Físico):</span>
                    <strong>${item.qc}</strong>
                </div>
            </div>
        `;

        buttons = `<button class="btn btn-save" onclick="document.getElementById('modalReportDetail').style.display='none'; navTo('mapas'); loadMap('${item.mapId}')"><i class="fas fa-search-location"></i> VER NO MAPA</button>`;
    } else {
        // Detalhes genéricos para Pátio, Mapas e Pesagem
        const id = item.id;
        const inMap = mapData.some(m => m.id === id);
        const inWeighing = mpData.some(w => w.id === id);

        html = `
            <div class="detail-header" style="border-bottom: 2px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin:0; color:var(--primary);">${item.empresa || item.fornecedor || 'REGISTRO'}</h3>
                <small style="color:#666;">ID: ${id}</small>
            </div>
            <div class="form-grid">
                <div><strong>Placa:</strong><br>${item.placa || '---'}</div>
                <div><strong>Data:</strong><br>${(item.chegada || item.date || item.checkin || '').slice(0, 10).split('-').reverse().join('/')}</div>
                <div><strong>Status:</strong><br><span class="status-badge st-ok" style="padding:2px 8px; font-size:0.7rem;">${item.status || (item.launched ? 'LANÇADO' : 'PENDENTE')}</span></div>
                <div><strong>Local/Setor:</strong><br>${item.localSpec || item.setor || '---'}</div>
            </div>
            <div style="margin-top:20px; border-top:1px solid #eee; padding-top:15px;">
                <strong>Produtos/Carga:</strong>
                <div style="background:#f8fafc; padding:10px; border-radius:6px; margin-top:5px; font-size:0.85rem;">
                    ${item.produto ? `• ${item.produto}` : (item.cargas?.[0]?.produtos?.map(p => `• ${p.nome}`).join('<br>') || 'Nenhum produto listado')}
                </div>
            </div>
        `;

        buttons = `
            <button class="btn btn-edit" onclick="document.getElementById('modalReportDetail').style.display='none'; navTo('mapas'); loadMap('${id}')" ${!inMap ? 'disabled' : ''}>
                <i class="fas fa-clipboard-check"></i> MAPA CEGO
            </button>
            <button class="btn btn-save" onclick="document.getElementById('modalReportDetail').style.display='none'; navTo('materia-prima'); loadMP('${id}')" ${!inWeighing ? 'disabled' : ''}>
                <i class="fas fa-weight"></i> PESAGEM
            </button>
        `;
    }

    content.innerHTML = html;
    actions.innerHTML = buttons;
    modal.style.display = 'flex';
}

function exportReportToPDF() {
    if (filteredReportData.length === 0) return alert('Gere o relatório primeiro.');
    let dataToPrint = filteredReportData;
    if (selectedReportItems.size > 0) { 
        dataToPrint = filteredReportData.filter(i => selectedReportItems.has(i.id)); 
    }
    const { jsPDF } = window.jspdf;

    if (!jsPDF) return alert('Biblioteca jsPDF não carregada.');

    if (currentReportType === 'divergencias') {
        const doc = new jsPDF({ orientation: 'portrait' }); 
        doc.setFontSize(16); 
        doc.text("Relatório de Divergências", 10, 15); 
        doc.setFontSize(10); 
        let y = 25;
        dataToPrint.forEach(d => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFillColor(245, 245, 245); 
            doc.rect(10, y, 190, 20, 'F');
            doc.text(`${d.date} | ${d.forn}`, 15, y + 5);
            doc.setFont("helvetica", "bold"); 
            doc.text(`PRODUTO: ${d.prod} (NF: ${d.nf})`, 15, y + 12); 
            doc.text(`DIFERENÇA: ${d.diff}`, 150, y + 12); 
            doc.setFont("helvetica", "normal"); 
            y += 25;
        });
        doc.save('Divergencias.pdf');
    } else {
        const doc = new jsPDF({ orientation: 'landscape' }); 
        doc.text("Relatório - " + currentReportType.toUpperCase(), 10, 10); 
        let y = 20;
        dataToPrint.forEach(i => {
            if (y > 190) { doc.addPage(); y = 20; }
            let line = "";
            if (currentReportType === 'patio') line = `${i.chegada.slice(0, 16)} | ${i.empresa} | ${i.placa} | ${i.status}`;
            else if (currentReportType === 'materia-prima') line = `${i.date} | ${i.produto} | ${i.placa} | Liq: ${i.liq}`;
            else if (currentReportType === 'carregamento') line = `${i.checkin.slice(0, 16)} | ${i.motorista} | ${i.cavalo} | ${i.status}`;
            doc.text(line, 10, y); 
            y += 7;
        });
        doc.save('Relatorio_Geral.pdf');
    }
}
