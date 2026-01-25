// ===================================================================================
//          MÓDULO DE DASHBOARD INTELIGENTE
// ===================================================================================

let dashboardCharts = [null, null, null, null];
let currentLayoutConfig = [null, null, null, null];

function initDashboard() {
    loadSavedLayout();
}

function renderDashboard() {
    let dashView = document.getElementById('view-dashboard');
    if (!dashView) {
        const sibling = document.querySelector('.view-section');
        if (sibling && sibling.parentNode) {
            dashView = document.createElement('div');
            dashView.id = 'view-dashboard';
            dashView.className = 'view-section active';
            sibling.parentNode.appendChild(dashView);
        }
    }

    if (!document.getElementById('slot-0')) {
        dashView.innerHTML = `
            <div class="dashboard-controls">
                <h2>Dashboard Inteligente</h2>
                <div class="filters-bar" style="display:flex; gap:10px; flex-wrap:wrap; align-items:end; margin-bottom:15px;">
                    <div><label>De:</label><input type="date" id="dashFrom" class="form-control"></div>
                    <div><label>Até:</label><input type="date" id="dashTo" class="form-control"></div>
                    <div><label>Produto:</label><input type="text" id="dashProduct" placeholder="Ex: AÇUCAR" class="form-control"></div>
                    <div><label>Placa:</label><input type="text" id="dashPlate" placeholder="ABC-1234" class="form-control"></div>
                    <div><label>Setor:</label>
                        <select id="dashSector" class="form-control">
                            <option value="">Todos</option>
                            <option value="ALM">Almoxarifado</option>
                            <option value="GAVA">Gava</option>
                            <option value="RECEBIMENTO">Recebimento</option>
                        </select>
                    </div>
                    <button class="btn btn-save" onclick="saveDashboardLayout()"><i class="fas fa-save"></i> Salvar Layout</button>
                    <button class="btn btn-edit" onclick="clearDashboard()"><i class="fas fa-trash"></i> Limpar</button>
                </div>
            </div>
            
            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
                <div class="dash-slot" id="slot-0"><div class="empty-state"><button class="btn btn-primary" onclick="addToSlot(0)">+ Adicionar Gráfico</button></div></div>
                <div class="dash-slot" id="slot-1"><div class="empty-state"><button class="btn btn-primary" onclick="addToSlot(1)">+ Adicionar Gráfico</button></div></div>
                <div class="dash-slot" id="slot-2"><div class="empty-state"><button class="btn btn-primary" onclick="addToSlot(2)">+ Adicionar Gráfico</button></div></div>
                <div class="dash-slot" id="slot-3"><div class="empty-state"><button class="btn btn-primary" onclick="addToSlot(3)">+ Adicionar Gráfico</button></div></div>
            </div>
        `;
    }
    const from = document.getElementById('dashFrom');
    const to = document.getElementById('dashTo');
    if (from && !from.value) from.value = getBrazilTime().split('T')[0];
    if (to && !to.value) to.value = getBrazilTime().split('T')[0];

    initDashboard();
}

async function addToSlot(slotIndex) {
    const filters = {
        from: document.getElementById('dashFrom').value,
        to: document.getElementById('dashTo').value,
        product: document.getElementById('dashProduct').value,
        plate: document.getElementById('dashPlate').value,
        sector: document.getElementById('dashSector').value
    };
    currentLayoutConfig[slotIndex] = filters;
    await fetchAndRenderSlot(slotIndex, filters);
}

async function fetchAndRenderSlot(slotIndex, filters) {
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    slotEl.classList.remove('empty');
    slotEl.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--primary)"></i></div>`;

    try {
        let data = { rows: [], totalAmount: 0 };

        const fromDate = filters.from || '';
        const toDate = filters.to || '';
        const pRows = [];
        patioData.forEach(p => {
            const date = (p.chegada || p.date || '').slice(0, 10);
            const plateVal = p.placa || p.plate || '';
            const products = (p.cargas && p.cargas.length) ? p.cargas.flatMap(c => c.produtos ? c.produtos.map(x => x.nome || x) : [c.produto || '']) : (p.product ? [p.product] : []);
            const productMatch = !filters.product || products.join(' ').toLowerCase().includes((filters.product || '').toLowerCase());
            const plateMatch = !filters.plate || plateVal.toLowerCase().includes((filters.plate || '').toLowerCase());
            const dateOK = (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
            if (productMatch && plateMatch && dateOK) {
                pRows.push({ 
                    product: products.join(', '), 
                    plate: plateVal, 
                    date, 
                    sector: p.localSpec || p.local || p.sector || '', 
                    amount: p.cargas ? p.cargas.length : (p.amount || 0), 
                    divergence: p.divergence || false 
                });
            }
        });
        data = { rows: pRows, totalAmount: pRows.length };

        renderSlotCard(slotIndex, data, filters);

    } catch (error) {
        console.error(error);
        slotEl.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Erro ao carregar slot ${slotIndex + 1} <br><small>${error.message}</small> <br> <button class="btn btn-small" onclick="clearSlot(${slotIndex})">Limpar</button></div>`;
    }
}

function renderSlotCard(index, data, filters) {
    const rows = data.rows || [];
    const total = data.totalAmount || 0;
    const slotEl = document.getElementById(`slot-${index}`);

    let title = filters.product ? filters.product.toUpperCase() : "VISÃO GERAL";
    if (filters.plate) title += ` (${filters.plate})`;

    let chartConfig = {};

    const dateCounts = {};
    rows.forEach(r => {
        const d = r.date ? r.date.split('-').slice(1).reverse().join('/') : 'ND';
        dateCounts[d] = (dateCounts[d] || 0) + (r.amount || 1);
    });
    const labels = Object.keys(dateCounts).sort();
    const values = labels.map(d => dateCounts[d]);

    chartConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume',
                data: values,
                borderColor: 'rgba(21, 101, 192, 1)',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    };

    slotEl.innerHTML = `
        <div class="card-header">
            <div class="card-title">
                <h4>${title}</h4>
                <span>${filters.sector || 'Todos Setores'} • ${rows.length} registros</span>
            </div>
            <button onclick="clearSlot(${index})" class="btn-icon-remove"><i class="fas fa-times"></i></button>
        </div>
        <div class="card-body">
            <div class="kpi-row">
                <div class="kpi-box">
                    <div class="kpi-val">${total}</div>
                    <div class="kpi-lbl">Qtd. Itens</div>
                </div>
            </div>
            <div class="chart-container" style="height: 120px; min-height:120px; width:100%;">
                <canvas id="chart-canvas-${index}"></canvas>
            </div>
        </div>
    `;

    const ctx = document.getElementById(`chart-canvas-${index}`).getContext('2d');
    if (dashboardCharts[index]) dashboardCharts[index].destroy();
    dashboardCharts[index] = new Chart(ctx, chartConfig);
}

function clearSlot(index) {
    if (dashboardCharts[index]) {
        dashboardCharts[index].destroy();
        dashboardCharts[index] = null;
    }
    currentLayoutConfig[index] = null;
    const slotEl = document.getElementById(`slot-${index}`);
    slotEl.classList.add('empty');
    slotEl.innerHTML = `<div class="empty-state"><button class="btn btn-primary" onclick="addToSlot(${index})">+ Adicionar Gráfico</button></div>`;
}

function clearDashboard() {
    for (let i = 0; i < 4; i++) clearSlot(i);
}

async function saveDashboardLayout() {
    const isEmpty = currentLayoutConfig.every(x => x === null);
    if (isEmpty) return alert("O dashboard está vazio.");
    
    try {
        const username = loggedUser ? loggedUser.username : 'local';
        localStorage.setItem(`dashboard_layout_${username}`, JSON.stringify(currentLayoutConfig));
        alert("Layout salvo localmente!");
    } catch (e) { 
        console.warn("Erro ao salvar local:", e); 
    }
}

async function loadSavedLayout() {
    let loadedData = null;
    
    const username = loggedUser ? loggedUser.username : 'local';
    const local = localStorage.getItem(`dashboard_layout_${username}`);
    if (local) loadedData = JSON.parse(local);

    if (loadedData && Array.isArray(loadedData)) {
        currentLayoutConfig = loadedData;
        for (let i = 0; i < 4; i++) {
            if (loadedData[i]) setTimeout(() => fetchAndRenderSlot(i, loadedData[i]), 100);
            else clearSlot(i);
        }
    }
}
