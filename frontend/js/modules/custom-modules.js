
// ===================================================================================
//          GESTÃO DE MÓDULOS CUSTOMIZADOS E PERMISSÕES
// ===================================================================================

let customModules = [];

// Lista de Módulos Padrão do Sistema (Hardcoded)
const SYSTEM_MODULES = [
    { id: 'view-patio', title: 'Controle de Pátio', icon: 'fas fa-truck' },
    { id: 'view-mapas', title: 'Mapas Cegos', icon: 'fas fa-clipboard-check' },
    { id: 'view-materia-prima', title: 'Pesagem', icon: 'fas fa-weight-hanging' },
    { id: 'view-carregamento', title: 'Carregamento', icon: 'fas fa-dolly' },
    { id: 'view-relatorios', title: 'Relatórios', icon: 'fas fa-chart-pie' },
    { id: 'view-dashboard', title: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'view-cadastros', title: 'Cadastros', icon: 'fas fa-address-book' },
    { id: 'view-produtos', title: 'Produtos', icon: 'fas fa-boxes' },
    { id: 'view-notificacoes', title: 'Notificações', icon: 'fas fa-bell' },
    { id: 'view-configuracoes', title: 'Configurações', icon: 'fas fa-cog' },
    { id: 'view-perfil', title: 'Perfil / Admin', icon: 'fas fa-user-circle' }
];

// --- CARREGAMENTO INICIAL ---

async function loadCustomModules() {
    try {
        // Tenta carregar do servidor (via sync endpoint que retorna tudo)
        // Se já tiver sido carregado pelo data-sync, usamos a variável global
        // Mas como data-sync não conhece customModules, precisamos buscar manualmente ou integrar
        // Para simplificar, vamos buscar via API específica ou usar o generic sync se disponível
        
        // Na arquitetura atual, loadDataFromServer() preenche variáveis globais.
        // Vamos assumir que data-sync foi atualizado para trazer 'aw_custom_modules'
        // Se não, fazemos um fetch direto
        
        const response = await fetch(`${API_URL}/api/sync?key=aw_custom_modules`, { cache: "no-store" });
        if (response.ok) {
            const data = await response.json();
            // A API sync retorna { key: ..., data: ... } ou apenas o objeto se filtrado?
            // Baseado no data-sync.js, ela retorna tudo. Vamos assumir que adicionamos no data-sync
            // Mas para garantir independência agora:
            customModules = data.aw_custom_modules || []; 
        }
    } catch (e) {
        console.warn("Offline ou erro ao carregar módulos customizados:", e);
        customModules = JSON.parse(localStorage.getItem('aw_custom_modules') || '[]');
    }
    
    injectCustomSidebarItems();
}

// --- RENDERIZAÇÃO DA SIDEBAR ---

function injectCustomSidebarItems() {
    // 1. Identificar permissões do usuário logado
    const userPerms = getUserPermissions(loggedUser);
    
    // 2. Controlar visibilidade dos módulos PADRÃO
    SYSTEM_MODULES.forEach(mod => {
        // Mapeia ID da view para ID do menu (ex: view-patio -> menuPatio)
        // Se não tiver ID padrão, tentamos achar pelo onclick ou href
        // Simplificação: vamos buscar pelo onclick contendo o ID da view
        const menuEl = document.querySelector(`.menu-item[onclick*="'${mod.id.replace('view-', '')}'"]`) || 
                       document.getElementById(mod.id.replace('view-', 'menu')); // Fallback para IDs conhecidos
        
        if (menuEl) {
            if (userPerms.includes(mod.id)) {
                menuEl.style.display = 'flex';
            } else {
                menuEl.style.display = 'none';
            }
        }
    });

    // 3. Injetar Módulos CUSTOMIZADOS
    // Remove itens customizados antigos para evitar duplicação
    document.querySelectorAll('.menu-item-custom').forEach(el => el.remove());
    
    const menuContainer = document.querySelector('.menu-items');
    // Insere antes do divisor de configurações
    const divider = menuContainer.querySelector('div[style*="margin-top:auto"]');

    customModules.forEach(mod => {
        if (userPerms.includes(mod.id)) {
            const a = document.createElement('a');
            a.className = 'menu-item menu-item-custom';
            a.innerHTML = `<i class="${mod.icon || 'fas fa-puzzle-piece'}"></i> ${mod.title}`;
            a.onclick = function() {
                openCustomModule(mod.id, this);
            };
            menuContainer.insertBefore(a, divider);
        }
    });
}

function getUserPermissions(user) {
    // Se o usuário já tem permissões explícitas salvas
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
        return user.permissions;
    }

    // FALLBACK: Lógica legada para usuários sem permissões definidas
    const perms = [];
    const sector = (user.sector || '').toLowerCase();
    const role = (user.role || '').toLowerCase();
    const subType = user.subType;
    const isAdmin = role.includes('admin') || role.includes('administrador');
    
    // Todo mundo vê perfil e config (básico)
    perms.push('view-perfil');
    // Configurações geralmente para todos, mas itens internos são bloqueados
    perms.push('view-configuracoes'); 
    perms.push('view-notificacoes');

    if (isAdmin) {
        return SYSTEM_MODULES.map(m => m.id).concat(customModules.map(m => m.id));
    }

    if (sector === 'recebimento') {
        perms.push('view-patio', 'view-mapas', 'view-materia-prima', 'view-cadastros', 'view-produtos', 'view-dashboard');
    }
    
    if (sector === 'conferente') {
        perms.push('view-patio', 'view-mapas', 'view-produtos');
        if (subType === 'ALM' || subType === 'GAVA') {
            // Almoxarifado/Gava vê patio filtrado (tratado no patio.js)
        } else {
            // Outros conferentes
        }
    }
    
    // Logística/Carregamento
    if (role.includes('logistica') || role.includes('expedicao')) {
        perms.push('view-carregamento', 'view-patio');
    }

    return perms;
}

// --- EXECUÇÃO DE MÓDULO ---

function openCustomModule(moduleId, menuElement) {
    // UI Navigation
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    if (menuElement) menuElement.classList.add('active');
    
    const container = document.getElementById('view-custom-module');
    container.classList.add('active');
    
    const contentBox = document.getElementById('customModuleContainer');
    contentBox.innerHTML = ''; // Limpa anterior
    
    const mod = customModules.find(m => m.id === moduleId);
    if (!mod) return;

    // Título na Header
    document.getElementById('pageTitle').textContent = mod.title;

    // Injeção de HTML
    contentBox.innerHTML = mod.htmlContent || '<p>Sem conteúdo.</p>';

    // Injeção de CSS (Scoped)
    if (mod.cssContent) {
        const styleId = `style-${moduleId}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = mod.cssContent;
            document.head.appendChild(style);
        }
    }

    // Execução de JS
    if (mod.jsContent) {
        try {
            // Wrap em IIFE para isolar escopo (levemente)
            const scriptFunc = new Function('container', mod.jsContent);
            scriptFunc(contentBox);
        } catch (e) {
            console.error("Erro ao executar script do módulo:", e);
            contentBox.innerHTML += `<div style="color:red; padding:10px; border:1px solid red;">Erro de Script: ${e.message}</div>`;
        }
    }
}

// --- GESTÃO (ADMIN UI) ---

function renderModuleManager() {
    const container = document.getElementById('view-configuracoes').querySelector('.settings-grid');
    
    // Verifica se já existe o card
    if (document.getElementById('cardModuleManager')) return;

    const card = document.createElement('div');
    card.className = 'settings-card';
    card.id = 'cardModuleManager';
    card.style.gridColumn = "span 2"; // Ocupa largura total se possível
    
    card.innerHTML = `
        <h4><i class="fas fa-puzzle-piece"></i> Gestão de Módulos (Admin)</h4>
        <div style="margin-bottom:15px; font-size:0.9rem; color:#666;">
            Crie novos menus e funcionalidades para o sistema.
        </div>
        <div id="moduleList" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
            ${renderModuleBadges()}
        </div>
        <button class="btn btn-save" onclick="openModuleEditor()">+ Novo Módulo</button>
    `;
    
    container.appendChild(card);
}

function renderModuleBadges() {
    if (customModules.length === 0) return '<span style="color:#999; font-style:italic;">Nenhum módulo instalado.</span>';
    
    return customModules.map(m => `
        <div style="background:#f0f9ff; border:1px solid #bae6fd; padding:5px 10px; border-radius:20px; display:flex; align-items:center; gap:5px;">
            <i class="${m.icon}"></i> ${m.title}
            <i class="fas fa-edit" style="cursor:pointer; color:orange; margin-left:5px;" onclick="openModuleEditor('${m.id}')"></i>
            <i class="fas fa-trash" style="cursor:pointer; color:red;" onclick="deleteModule('${m.id}')"></i>
        </div>
    `).join('');
}

function openModuleEditor(id = null) {
    const mod = id ? customModules.find(m => m.id === id) : { id: '', title: '', icon: 'fas fa-star', htmlContent: '<h3>Meu Módulo</h3>', cssContent: '', jsContent: '// console.log("Ola mundo");' };
    const isNew = !id;

    // Cria modal dinamicamente
    let modal = document.getElementById('modalModuleEditor');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalModuleEditor';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9999';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-box" style="width:800px; max-width:95vw;">
            <h3>${isNew ? 'Novo Módulo' : 'Editar Módulo'}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>Título do Menu</label>
                    <input id="modTitle" class="form-input-styled" value="${mod.title}">
                </div>
                <div class="form-group">
                    <label>Ícone (FontAwesome)</label>
                    <input id="modIcon" class="form-input-styled" value="${mod.icon}">
                </div>
            </div>
            
            <div class="form-group">
                <label>HTML (Conteúdo)</label>
                <textarea id="modHtml" class="form-input-styled" style="height:150px; font-family:monospace;">${mod.htmlContent}</textarea>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div class="form-group">
                    <label>CSS (Estilos)</label>
                    <textarea id="modCss" class="form-input-styled" style="height:150px; font-family:monospace;">${mod.cssContent}</textarea>
                </div>
                <div class="form-group">
                    <label>Javascript (Lógica)</label>
                    <textarea id="modJs" class="form-input-styled" style="height:150px; font-family:monospace;">${mod.jsContent}</textarea>
                </div>
            </div>

            <div style="text-align:right; margin-top:20px;">
                <button class="btn btn-edit" onclick="document.getElementById('modalModuleEditor').style.display='none'">Cancelar</button>
                <button class="btn btn-save" onclick="saveModule('${mod.id}')">Salvar Módulo</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function saveModule(originalId) {
    const title = document.getElementById('modTitle').value;
    const icon = document.getElementById('modIcon').value;
    const html = document.getElementById('modHtml').value;
    const css = document.getElementById('modCss').value;
    const js = document.getElementById('modJs').value;

    if (!title) return alert("Título é obrigatório");

    let id = originalId;
    if (!id) {
        // Gera ID baseado no título
        id = 'mod-' + title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    }

    const newMod = { id, title, icon, htmlContent: html, cssContent: css, jsContent: js };

    if (originalId) {
        const idx = customModules.findIndex(m => m.id === originalId);
        if (idx !== -1) customModules[idx] = newMod;
    } else {
        customModules.push(newMod);
    }

    // Persiste
    saveCustomModules();
    
    document.getElementById('modalModuleEditor').style.display = 'none';
    renderModuleManager(); // Atualiza lista
    injectCustomSidebarItems(); // Atualiza menu
    alert("Módulo salvo com sucesso!");
}

function deleteModule(id) {
    if (confirm("Tem certeza que deseja excluir este módulo?")) {
        customModules = customModules.filter(m => m.id !== id);
        saveCustomModules();
        renderModuleManager();
        injectCustomSidebarItems();
    }
}

function saveCustomModules() {
    localStorage.setItem('aw_custom_modules', JSON.stringify(customModules));
    // Tenta salvar no servidor se possível
    if (typeof saveToServer === 'function') {
        saveToServer('aw_custom_modules', customModules);
    }
}

// --- INTERFACE DE PERMISSÕES (Chamada pelo users.js) ---

function openPermissionEditor(username) {
    const user = usersData.find(u => u.username === username);
    if (!user) return alert("Usuário não encontrado");

    let modal = document.getElementById('modalPermEditor');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalPermEditor';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9998';
        document.body.appendChild(modal);
    }

    const currentPerms = getUserPermissions(user);

    const renderCheck = (id, label) => {
        const checked = currentPerms.includes(id) ? 'checked' : '';
        return `
            <label class="checkbox-container" style="display:flex; align-items:center; gap:10px; padding:5px; border-bottom:1px solid #eee;">
                <input type="checkbox" value="${id}" ${checked}> ${label}
            </label>
        `;
    };

    modal.innerHTML = `
        <div class="modal-box" style="width:500px;">
            <h3>Permissões: ${user.username}</h3>
            <p style="font-size:0.8rem; color:#666; margin-bottom:15px;">Selecione os módulos que este usuário pode acessar.</p>
            
            <div style="max-height:400px; overflow-y:auto; margin-bottom:20px;">
                <h5 style="margin:10px 0; color:var(--primary);">Sistema Base</h5>
                ${SYSTEM_MODULES.map(m => renderCheck(m.id, m.title)).join('')}
                
                <h5 style="margin:10px 0; color:var(--primary);">Módulos Customizados</h5>
                ${customModules.length ? customModules.map(m => renderCheck(m.id, m.title)).join('') : '<small>Nenhum módulo customizado.</small>'}
            </div>

            <div style="text-align:right;">
                <button class="btn btn-edit" onclick="document.getElementById('modalPermEditor').style.display='none'">Cancelar</button>
                <button class="btn btn-save" onclick="savePermissions('${user.username}')">Salvar Acessos</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function savePermissions(username) {
    const checkboxes = document.querySelectorAll('#modalPermEditor input[type="checkbox"]:checked');
    const newPerms = Array.from(checkboxes).map(cb => cb.value);
    
    const userIdx = usersData.findIndex(u => u.username === username);
    if (userIdx !== -1) {
        usersData[userIdx].permissions = newPerms;
        saveAll(); // Salva usersData atualizado
        alert("Permissões atualizadas!");
        document.getElementById('modalPermEditor').style.display = 'none';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que data-sync rodou (se possível)
    setTimeout(() => {
        loadCustomModules();
        
        // Se for admin, renderiza o gerenciador nas configurações
        if (typeof isAdmin !== 'undefined' && isAdmin) {
            // Observa se estamos na aba de configurações para renderizar
            const observer = new MutationObserver(() => {
                if (document.getElementById('view-configuracoes').classList.contains('active')) {
                    renderModuleManager();
                }
            });
            observer.observe(document.getElementById('view-configuracoes'), { attributes: true });
            
            // Renderiza inicial se já estiver lá (refresh da página)
            if (document.getElementById('view-configuracoes').classList.contains('active')) {
                renderModuleManager();
            }
        }
    }, 1000);
});
