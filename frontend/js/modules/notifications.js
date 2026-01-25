// ===================================================================================
//          MÓDULO DE NOTIFICAÇÕES
// ===================================================================================

let notifiedEvents = new Set();

if ("Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") Notification.requestPermission();
}

document.addEventListener('click', function unlockAudio() {
    if (!globalAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            globalAudioCtx = new AudioContext();
            const osc = globalAudioCtx.createOscillator(); const gain = globalAudioCtx.createGain();
            gain.gain.value = 0; osc.connect(gain); gain.connect(globalAudioCtx.destination);
            osc.start(0); osc.stop(0.1);
        }
    }
    document.removeEventListener('click', unlockAudio);
});

function playBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        let ctx = globalAudioCtx;
        if (!ctx || ctx.state === 'closed') { ctx = new AudioContext(); globalAudioCtx = ctx; } else if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 550;
        const now = ctx.currentTime; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
    } catch (e) { console.warn("Audio blocked:", e); }
}

function sendSystemNotification(title, body, targetView, targetId) {
    playBeep();
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") createVisualNotification(title, body, targetView, targetId);
}

function createVisualNotification(title, body, targetView, targetId) {
    try {
        const notif = new Notification(title, { body: body, icon: '/img/logo-sf.png' });
        notif.onclick = function () { window.focus(); if (targetView) navTo(targetView); if (targetId && targetView === 'mapas') loadMap(targetId); this.close(); };
    } catch (e) { console.error("Notif error", e); }
}

function checkForNotifications() {
    const modal = document.getElementById('modalNotification');
    if (modal && modal.style.display === 'flex') return;

    const todayStr = getBrazilTime().split('T')[0];

    // 1. Notificação de CHEGADA NA FILA (Exclusivo para Conferentes)
    if (typeof isConferente !== 'undefined' && isConferente) {
        const queue = patioData.filter(c => 
            c.status === 'FILA' && 
            (c.chegada || '').startsWith(todayStr)
        );

        for (const truck of queue) {
            // Cria uma chave única para chegada (diferente da liberação)
            const arrivalKey = truck.id + '_arrival';
            
            // Se já notificou a chegada deste caminhão, pula
            if (notifiedEvents.has(arrivalKey)) continue;

            let shouldNotify = false;
            
            // Lógica de Responsabilidade por Setor
            // Se sou da Doca (ALM), recebo notificações da Doca
            if (truck.local === 'ALM' && userSubType === 'ALM') shouldNotify = true;
            // Se sou do Gava, recebo do Gava
            else if (truck.local === 'GAVA' && userSubType === 'GAVA') shouldNotify = true;
            // Se sou de Outros (Infra, Manut, etc), recebo de Outros
            else if (truck.local === 'OUT' && !['ALM', 'GAVA'].includes(userSubType)) shouldNotify = true;
            // Se não tenho subtipo definido (Conferente Geral), recebo tudo
            else if (!userSubType) shouldNotify = true;

            if (shouldNotify) {
                sendSystemNotification(
                    "Novo Veículo na Fila",
                    `Setor: ${truck.localSpec}\n${truck.empresa}\nPlaca: ${truck.placa}`,
                    'patio',
                    truck.id,
                    { icon: '../Imgs/logo-sf.png' }
                );
                // Marca como notificado para não repetir
                notifiedEvents.add(arrivalKey);
            }
        }
    }

    // 2. Notificação de LIBERAÇÃO (Para Recebimento/Portaria)
    const call = patioData.find(c => 
        c.status === 'LIBERADO' && 
        !c.recebimentoNotified && 
        (c.chegada || '').startsWith(todayStr)
    );

    if (call && isRecebimento) {
        if (!notifiedEvents.has(call.id)) {
            // Formata a mensagem: Quem liberou + Fornecedor + Placa
            const releaser = call.releasedBy || 'Operador';
            const msg = `${releaser} liberou ${call.empresa} para descarga\nPlaca: ${call.placa}`;

            showNotificationPopup('release', call);
            
            sendSystemNotification(
                "Veículo Liberado!",
                msg,
                'patio',
                call.id,
                { icon: '../Imgs/logo-sf.png' }
            );
            
            notifiedEvents.add(call.id);
            return; 
        }
    }

    // 3. Notificação de DIVERGÊNCIA
    const div = requests.find(r => r.type === 'divergence' && r.target === loggedUser.username && r.status === 'pending');

    if (div) {
        if (!notifiedEvents.has(div.id)) {
            showNotificationPopup('divergence', div);
            
            sendSystemNotification(
                "⚠️ DIVERGÊNCIA",
                `Motivo: ${div.msg}`,
                'mapas',
                div.mapId,
                { icon: '../Imgs/logo-sf.png' }
            );
            
            notifiedEvents.add(div.id);
        }
    }

    updateBadge();
}

setInterval(checkForNotifications, 4000);

function showNotificationPopup(type, data) {
    const p = document.getElementById('notifPopupContent');
    const modal = document.getElementById('modalNotification');
    if (!modal || !p) return;
    modal.style.display = 'flex';
    if (type === 'release') {
        p.innerHTML = `<h2 style="color:green">Liberado!</h2><p>${data.empresa} - ${data.placa}</p><button class="btn btn-save" onclick="confirmNotification('release','${data.id}')">OK</button>`;
    } else {
        p.innerHTML = `<h2 style="color:red">Divergência</h2><p>${data.msg}</p><button class="btn btn-edit" onclick="confirmNotification('divergence','${data.id}')">Ver</button>`;
    }
}

function confirmNotification(type, id) {
    if (type === 'release') {
        const i = patioData.findIndex(c => c.id === id);
        if (i > -1) patioData[i].recebimentoNotified = true;
    } else {
        const i = requests.findIndex(r => r.id == id);
        if (i > -1) {
            requests[i].status = 'seen';
            navTo('mapas');
            if (requests[i].mapId) loadMap(requests[i].mapId);
        }
    }
    const modalNotif = document.getElementById('modalNotification');
    if (modalNotif) modalNotif.style.display = 'none';
    saveAll();
}

function updateBadge() { const c = requests.filter(r => r.status === 'pending' && r.target === loggedUser.username).length; const b = document.getElementById('badgeNotif'); if (c > 0) { b.innerText = c; b.style.display = 'inline-block'; } else b.style.display = 'none'; }

function renderRequests() {
    const l = document.getElementById('reqList');
    l.innerHTML = '';
    const h = document.getElementById('historyList');
    h.innerHTML = '';

    // Filtra todas as requisições pendentes
    requests.filter(r => r.status === 'PENDENTE').forEach(r => {
        let actionBtn = '';

        // Se for Entrada de Caminhão (Dados Complexos), abre o Modal de Análise
        if (r.type === 'complex_entry') {
            actionBtn = `<button class="btn btn-save btn-small" onclick="openUnifiedApprovalModal('${r.id}')">Analisar</button>`;
        }
        // Se for divergência ou edição simples, usa o Aceitar direto
        else if (r.type !== 'divergence') { // Divergência geralmente só visualiza
            actionBtn = `<button class="btn btn-save btn-small" onclick="resolveRequest('${r.id}','approved')">Aceitar</button>`;
        }

        // Se for divergência, mostra botão de ver
        if (r.type === 'divergence') {
            actionBtn = `<button class="btn btn-edit btn-small" onclick="navTo('mapas'); loadMap('${r.mapId}')">Ver Mapa</button>`;
        }

        l.innerHTML += `
            <div style="margin-bottom:8px; padding:12px; border:1px solid #eee; border-radius:6px; background:#fff; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="text-transform:uppercase; font-size:0.8rem; color:var(--primary);">${r.type.replace('_', ' ')}</strong>
                    <div style="font-size:0.9rem;">${r.msg || 'Verificação de dados pendentes'}</div>
                    <small style="color:#888;">${new Date(r.timestamp).toLocaleTimeString()}</small>
                </div> 
                ${actionBtn}
            </div>`;
    });

    // Histórico
    requests.slice(0, 10).forEach(r => {
        h.innerHTML += `<div style="font-size:0.8rem; border-bottom:1px solid #eee; padding:5px;">
            <b>${r.type}</b> - <span style="color:${r.status === 'APROVADO' ? 'green' : 'gray'}">${r.status}</span>
        </div>`;
    });

    updateBadge();
}

function resolveRequest(id, st) { const i = requests.findIndex(r => r.id === id); if (i > -1) { requests[i].status = st; if (st === 'approved' && requests[i].type === 'edit') { const m = mapData.find(x => x.id === requests[i].mapId); if (m) m.forceUnlock = true; } saveAll(); renderRequests(); } }
