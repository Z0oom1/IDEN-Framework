let suppliersData = [];
let carriersData = [];
let driversData = [];
let platesData = [];
let productsData = [];
let patioData = [];
let mapData = [];
let mpData = [];
let carregamentoData = [];
let requests = [];
let usersData = [];

async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/api/status`, { cache: "no-store" });
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        if (response.ok) {
            if (indicator) indicator.className = 'inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]';
            if (text) { text.innerText = 'Online'; text.className = 'text-emerald-500'; }
            return true;
        }
        throw new Error();
    } catch (e) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        if (indicator) indicator.className = 'inline-block w-2 h-2 rounded-full bg-red-500';
        if (text) { text.innerText = 'Offline'; text.className = 'text-red-500'; }
        return false;
    }
}

async function loadDataFromServer() {
    await checkServerStatus();
    try {
        const response = await fetch(`${API_URL}/api/sync?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Offline");
        const data = await response.json();

        if (Object.keys(data).length === 0 && localStorage.getItem('aw_caminhoes_v2')) {
            console.log("Servidor vazio detectado. Restaurando backup local e sincronizando...");
            restoreFromLocal();
            saveAll(); // Garante que os dados locais voltem para o servidor
            return;
        }

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
        restoreFromLocal();
    }
    refreshCurrentView();
}

// Alias para compatibilidade
window.loadData = loadDataFromServer;

function refreshCurrentView() {
    const activeView = document.querySelector('.view-section.active');
    if(activeView) {
        if (activeView.id === 'view-patio' && typeof renderPatio === 'function') renderPatio();
        if (activeView.id === 'view-mapas' && typeof renderMapList === 'function') renderMapList();
        if (activeView.id === 'view-materia-prima' && typeof renderMateriaPrima === 'function') renderMateriaPrima();
        if (activeView.id === 'view-carregamento' && typeof renderCarregamento === 'function') renderCarregamento();
        if (activeView.id === 'view-cadastros' && typeof renderCadastros === 'function') renderCadastros();
    }
}

function saveAll() {
    saveToLocalOnly();
    saveToServer('aw_caminhoes_v2', patioData);
    saveToServer('mapas_cegos_v3', mapData);
    saveToServer('aw_materia_prima', mpData);
    saveToServer('aw_carregamento', carregamentoData);
    saveToServer('aw_requests', requests);
    saveToServer('mapa_cego_users', usersData);
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
    }).catch(err => console.error("Erro ao salvar no servidor:", err));
}

function saveToLocalOnly() {
    try {
        localStorage.setItem('aw_caminhoes_v2', JSON.stringify(patioData));
        localStorage.setItem('mapas_cegos_v3', JSON.stringify(mapData));
        localStorage.setItem('aw_materia_prima', JSON.stringify(mpData));
        localStorage.setItem('aw_carregamento', JSON.stringify(carregamentoData));
        localStorage.setItem('aw_requests', JSON.stringify(requests));
        localStorage.setItem('mapa_cego_users', JSON.stringify(usersData));
        localStorage.setItem('aw_suppliers', JSON.stringify(suppliersData));
        localStorage.setItem('aw_carriers', JSON.stringify(carriersData));
        localStorage.setItem('aw_drivers', JSON.stringify(driversData));
        localStorage.setItem('aw_plates', JSON.stringify(platesData));
        localStorage.setItem('aw_products', JSON.stringify(productsData));
    } catch (e) { console.error("Erro ao salvar local:", e); }
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