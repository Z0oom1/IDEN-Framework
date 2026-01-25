// ===================================================================================
//          MÓDULO DE DADOS E SINCRONIZAÇÃO
// ===================================================================================

let suppliersData = [];     // { id, nome }
let carriersData = [];      // { id, nome, apelido, cnpj, supplierIds: [] }
let driversData = [];       // { id, nome, doc, carrierIds: [] }
let platesData = [];        // { id, numero, driverId }
let productsData = [];

let patioData = [];
let mapData = [];
let mpData = [];
let carregamentoData = [];
let requests = [];
let usersData = [];

async function loadDataFromServer() {
    try {
        const response = await fetch(`${API_URL}/api/sync?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Offline");
        const data = await response.json();

        patioData = data.aw_caminhoes_v2 || [];
        mapData = data.mapas_cegos_v3 || [];
        mpData = data.aw_materia_prima || [];
        carregamentoData = data.aw_carregamento || [];
        requests = data.aw_requests || [];
        usersData = data.mapa_cego_users || [];

        suppliersData = data.aw_suppliers || [];
        carriersData = data.aw_carriers || [];
        driversData = data.aw_drivers || [];
        platesData = data.aw_plates || [];
        productsData = data.aw_products || [];

        saveToLocalOnly();
    } catch (error) {
        console.warn("Modo Offline / Erro Sync:", error);
        restoreFromLocal();
    }
    refreshCurrentView();
}

function restoreFromLocal() {
    patioData = JSON.parse(localStorage.getItem('aw_caminhoes_v2') || '[]');
    mapData = JSON.parse(localStorage.getItem('mapas_cegos_v3') || '[]');
    mpData = JSON.parse(localStorage.getItem('aw_materia_prima') || '[]');
    carregamentoData = JSON.parse(localStorage.getItem('aw_carregamento') || '[]');
    requests = JSON.parse(localStorage.getItem('aw_requests') || '[]');
    usersData = JSON.parse(localStorage.getItem('mapa_cego_users') || '[]');

    suppliersData = JSON.parse(localStorage.getItem('aw_suppliers') || '[]');
    carriersData = JSON.parse(localStorage.getItem('aw_carriers') || '[]');
    driversData = JSON.parse(localStorage.getItem('aw_drivers') || '[]');
    platesData = JSON.parse(localStorage.getItem('aw_plates') || '[]');
    productsData = JSON.parse(localStorage.getItem('aw_products') || '[]');
}

function saveAll() {
    saveToLocalOnly();
    // Salvar no servidor (Dados Transacionais)
    saveToServer('aw_caminhoes_v2', patioData);
    saveToServer('mapas_cegos_v3', mapData);
    saveToServer('aw_materia_prima', mpData);
    saveToServer('aw_carregamento', carregamentoData);
    saveToServer('aw_requests', requests);
    saveToServer('mapa_cego_users', usersData);

    // Salvar no servidor (Dados Relacionais NOVOS)
    saveToServer('aw_suppliers', suppliersData);
    saveToServer('aw_carriers', carriersData);
    saveToServer('aw_drivers', driversData);
    saveToServer('aw_plates', platesData);
    saveToServer('aw_products', productsData);
}

function saveToServer(key, data) {
    fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key, data: data })
    }).catch(err => console.error("Erro ao salvar no servidor (pode estar offline):", err));
}

function saveToLocalOnly() {
    try {
        localStorage.setItem('aw_caminhoes_v2', JSON.stringify(patioData));
        localStorage.setItem('mapas_cegos_v3', JSON.stringify(mapData));
        localStorage.setItem('aw_materia_prima', JSON.stringify(mpData));
        localStorage.setItem('aw_carregamento', JSON.stringify(carregamentoData));
        localStorage.setItem('aw_requests', JSON.stringify(requests));
        localStorage.setItem('mapa_cego_users', JSON.stringify(usersData));

        // Novos
        localStorage.setItem('aw_suppliers', JSON.stringify(suppliersData));
        localStorage.setItem('aw_carriers', JSON.stringify(carriersData));
        localStorage.setItem('aw_drivers', JSON.stringify(driversData));
        localStorage.setItem('aw_plates', JSON.stringify(platesData));
        localStorage.setItem('aw_products', JSON.stringify(productsData));
    } catch (e) { console.error("Erro ao salvar local:", e); }
}

function backupData() { const d = { patio: patioData, mapas: mapData, mp: mpData, carr: carregamentoData, req: requests }; const a = document.createElement('a'); a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(d)); a.download = 'backup.json'; a.click(); }

function restoreData(i) { const f = i.files[0]; const r = new FileReader(); r.onload = e => { const d = JSON.parse(e.target.result); if (confirm('Restaurar?')) { if (d.patio) localStorage.setItem('aw_caminhoes_v2', JSON.stringify(d.patio)); if (d.mapas) localStorage.setItem('mapas_cegos_v3', JSON.stringify(d.mapas)); if (d.mp) localStorage.setItem('aw_materia_prima', JSON.stringify(d.mp)); if (d.carr) localStorage.setItem('aw_carregamento', JSON.stringify(d.carr)); window.location.reload(); } }; r.readAsText(f); }

function clearAllData() {
    if (confirm('PERIGO: Isso apagará TODOS os dados de TODOS os computadores.\n\nTem certeza absoluta?')) {
        fetch(`${API_URL}/api/reset`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    alert('Sistema resetado com sucesso!');
                } else {
                    alert('Erro ao tentar resetar o servidor.');
                }
            })
            .catch(error => {
                console.error("Erro:", error);
                alert('Erro de conexão ao tentar resetar.');
            });
    }
}
