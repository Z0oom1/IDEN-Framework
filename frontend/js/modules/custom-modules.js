// ===================================================================================
//          GESTÃO DE MÓDULOS CUSTOMIZADOS E PERMISSÕES (DINÂMICO)
// ===================================================================================

// Lista de Módulos Padrão do Sistema para o Controle de Permissões
const SYSTEM_MODULES = [
    { id: 'menu:patio', title: 'Controle de Pátio', icon: 'fas fa-truck' },
    { id: 'menu:mapas', title: 'Mapas Cegos', icon: 'fas fa-clipboard-check' },
    { id: 'menu:materia-prima', title: 'Pesagem', icon: 'fas fa-weight-hanging' },
    { id: 'menu:carregamento', title: 'Carregamento', icon: 'fas fa-dolly' },
    { id: 'menu:relatorios', title: 'Relatórios', icon: 'fas fa-chart-pie' },
    { id: 'menu:dashboard', title: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'menu:cadastros', title: 'Cadastros', icon: 'fas fa-address-book' },
    { id: 'menu:produtos', title: 'Produtos', icon: 'fas fa-boxes' },
    { id: 'menu:notificacoes', title: 'Notificações', icon: 'fas fa-bell' },
    { id: 'menu:configuracoes', title: 'Configurações', icon: 'fas fa-cog' },
    { id: 'menu:perfil', title: 'Perfil / Admin', icon: 'fas fa-user-circle' }
];

// --- RENDERIZAÇÃO DA INTERFACE DE GESTÃO (ADMIN) ---

function renderCustomModulesAdmin() {
    const container = document.getElementById('customModulesAdmin');
    if (!container) return;

    container.innerHTML = `
        <div class="settings-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h4 style="margin:0;"><i class="fas fa-plug"></i> Módulos Customizados</h4>
                <button class="btn btn-save btn-small" onclick="openModuleEditor()">+ Novo Módulo</button>
            </div>
            <table class="modern-table">
                <thead>
                    <tr>
                        <th>Ícone</th>
                        <th>Nome</th>
                        <th>ID</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${customModulesData.map(m => `
                        <tr>
                            <td><i class="${m.icon}"></i></td>
                            <td><b>${m.label}</b></td>
                            <td><code>${m.id}</code></td>
                            <td>
                                <button class="btn btn-edit btn-small" onclick="openModuleEditor('${m.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-edit btn-small" style="color:red; border-color:red;" onclick="deleteModule('${m.id}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                    ${customModulesData.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#999;">Nenhum módulo instalado.</td></tr>' : ''}
                </tbody>
            </table>
        </div>

        <!-- Modal Editor de Módulo -->
        <div id="modalModuleEditor" class="modal-overlay" style="display:none;">
            <div class="modal-content" style="max-width:900px; width:95%;">
                <div class="modal-header">
                    <h3 id="moduleEditorTitle">Novo Módulo</h3>
                    <span class="close-modal" onclick="closeModuleEditor()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div><label>Nome do Menu:</label><input type="text" id="modLabel" class="form-control" placeholder="Ex: Meu Relatório"></div>
                        <div><label>ID Único (apenas letras/números):</label><input type="text" id="modId" class="form-control" placeholder="Ex: meu_relatorio"></div>
                        <div>
                            <label>Ícone:</label>
                            <div style="display:flex; gap:5px;">
                                <input type="text" id="modIcon" class="form-control" placeholder="Ex: fas fa-file-invoice" style="flex:1;">
                                <button class="btn btn-edit" onclick="toggleIconGallery()" title="Ver Galeria" style="padding: 0 10px;"><i class="fas fa-icons"></i></button>
                            </div>
                            <div id="iconGallery" style="display:none; margin-top:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap:5px; max-height:150px; overflow-y:auto;">
                                ${['fas fa-cube', 'fas fa-chart-bar', 'fas fa-file-invoice', 'fas fa-users', 'fas fa-cog', 'fas fa-database', 'fas fa-truck', 'fas fa-boxes', 'fas fa-clipboard-list', 'fas fa-calendar-alt', 'fas fa-envelope', 'fas fa-bell', 'fas fa-user-shield', 'fas fa-plug', 'fas fa-vial', 'fas fa-tools', 'fas fa-map-marked-alt', 'fas fa-warehouse', 'fas fa-history', 'fas fa-print'].map(icon => `
                                    <div onclick="selectIcon('${icon}')" style="cursor:pointer; padding:8px; text-align:center; border-radius:4px; hover:background:#e2e8f0;">
                                        <i class="${icon}" style="font-size:1.2rem; color:var(--primary);"></i>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:15px;">
                        <label>Conteúdo HTML (CSS/JS podem ser incluídos em tags &lt;style&gt; e &lt;script&gt;):</label>
                        <textarea id="modHtml" class="form-control" style="height:300px; font-family:monospace; font-size:12px;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-edit" onclick="closeModuleEditor()">Cancelar</button>
                    <button class="btn btn-save" onclick="saveModule()">Salvar Módulo</button>
                </div>
            </div>
        </div>
    `;
}

let editingModuleId = null;

function openModuleEditor(id = null) {
    editingModuleId = id;
    const modal = document.getElementById('modalModuleEditor');
    const title = document.getElementById('moduleEditorTitle');
    
    if (id) {
        const m = customModulesData.find(x => x.id === id);
        if (m) {
            title.innerText = 'Editar Módulo: ' + m.label;
            document.getElementById('modLabel').value = m.label;
            document.getElementById('modId').value = m.id;
            document.getElementById('modId').disabled = true;
            document.getElementById('modIcon').value = m.icon;
            document.getElementById('modHtml').value = m.html;
        }
    } else {
        title.innerText = 'Novo Módulo';
        document.getElementById('modLabel').value = '';
        document.getElementById('modId').value = '';
        document.getElementById('modId').disabled = false;
        document.getElementById('modIcon').value = 'fas fa-cube';
        document.getElementById('modHtml').value = '<h2>Olá Mundo</h2>\n<p>Este é um novo módulo.</p>';
    }
    modal.style.display = 'flex';
}

function closeModuleEditor() {
    document.getElementById('modalModuleEditor').style.display = 'none';
    document.getElementById('iconGallery').style.display = 'none';
}

function toggleIconGallery() {
    const gallery = document.getElementById('iconGallery');
    gallery.style.display = gallery.style.display === 'none' ? 'grid' : 'none';
}

function selectIcon(icon) {
    document.getElementById('modIcon').value = icon;
    document.getElementById('iconGallery').style.display = 'none';
}

function saveModule() {
    const label = document.getElementById('modLabel').value;
    const id = document.getElementById('modId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const icon = document.getElementById('modIcon').value;
    const html = document.getElementById('modHtml').value;

    if (!label || !id) return alert('Preencha Nome e ID.');

    const newMod = { id, label, icon, html };

    if (editingModuleId) {
        const idx = customModulesData.findIndex(x => x.id === editingModuleId);
        if (idx !== -1) customModulesData[idx] = newMod;
    } else {
        if (customModulesData.find(x => x.id === id)) return alert('Este ID já está em uso.');
        customModulesData.push(newMod);
    }

    saveAll();
    closeModuleEditor();
    renderCustomModulesAdmin();
    injectCustomMenus(); // Atualiza a barra lateral
    alert('Módulo salvo com sucesso!');
}

function deleteModule(id) {
    if (confirm('Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita.')) {
        customModulesData = customModulesData.filter(x => x.id !== id);
        saveAll();
        renderCustomModulesAdmin();
        injectCustomMenus();
        alert('Módulo removido.');
    }
}

// --- INJEÇÃO DINÂMICA DE MENUS E CONTEÚDO ---

function injectCustomMenus() {
    const sidebar = document.querySelector('.menu-items');
    if (!sidebar) return;

    // Controla visibilidade dos módulos padrão baseado nas permissões
    SYSTEM_MODULES.forEach(mod => {
        const menuId = mod.id.split(':')[1];
        // Mapeia IDs de menu conhecidos no HTML
        const elementId = {
            'patio': 'menuPatio',
            'materia-prima': 'menuMateriaPrima',
            'carregamento': 'menuCarregamento',
            'dashboard': 'menuDashboard',
            'cadastros': 'menuCadastros',
            'notificacoes': 'menuNotif'
        }[menuId];

        let el = elementId ? document.getElementById(elementId) : null;
        if (!el) {
            el = document.querySelector(`.menu-item[onclick*="'${menuId}'"]`);
        }

        if (el) {
            if (hasPermission(mod.id)) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        }
    });

    // Remove itens customizados antigos para reinjetar
    document.querySelectorAll('.menu-item-custom').forEach(el => el.remove());
    document.querySelectorAll('.view-section-custom').forEach(el => el.remove());

    const mainContent = document.querySelector('.content-area');

    customModulesData.forEach(m => {
        const permId = `module:${m.id}`;
        if (!hasPermission(permId)) return;

        // Injeta na Sidebar
        const a = document.createElement('a');
        a.className = 'menu-item menu-item-custom';
        a.id = `menu-custom-${m.id}`;
        a.onclick = () => navTo(`custom-${m.id}`, a);
        a.innerHTML = `<i class="${m.icon}"></i> ${m.label}`;
        
        // Insere antes do item de configurações (que geralmente está no final com margin-top:auto)
        const configLink = document.querySelector('a[onclick*="configuracoes"]');
        const configContainer = configLink ? configLink.parentElement : null;
        
        if (configContainer && configContainer.parentElement === sidebar) {
            sidebar.insertBefore(a, configContainer);
        } else if (configContainer) {
             // Se o link de config estiver dentro de uma div (como a div de margin-top:auto)
             sidebar.insertBefore(a, configContainer);
        } else {
            sidebar.appendChild(a);
        }

        // Injeta a View Section
        const section = document.createElement('div');
        section.id = `view-custom-${m.id}`;
        section.className = 'view-section view-section-custom';
        
        // Sandboxing com Shadow DOM
        const shadow = section.attachShadow({mode: 'open'});
        shadow.innerHTML = `
            <style>
                :host { display: block; padding: 20px; font-family: 'Inter', sans-serif; color: #333; }
                * { box-sizing: border-box; }
                /* Herda algumas variáveis de cor básicas se possível ou define fallbacks */
                :host { --primary: #2563eb; --text-main: #1f2937; }
            </style>
            <div class="module-wrapper">
                ${m.html}
            </div>
        `;
        
        mainContent.appendChild(section);
    });
}

// --- CONTROLE DE PERMISSÕES ---

function hasPermission(permId) {
    if (isAdmin) return true; // Administrador tem acesso total
    if (!loggedUser) return false;

    // 1. Obter Permissões Base do Perfil (Hardcoded conforme regras originais)
    const basePerms = getBasePermissions(loggedUser);
    
    // 2. Obter Customizações do Administrador (se existirem)
    // Estrutura: { username: { allowed: [], denied: [] } }
    const custom = userPermissionsData[loggedUser.username] || { allowed: [], denied: [] };

    // Se as permissões customizadas ainda estiverem no formato antigo (array simples), converte
    let allowed = Array.isArray(custom) ? custom : (custom.allowed || []);
    let denied = Array.isArray(custom) ? [] : (custom.denied || []);

    // 3. Lógica de Decisão:
    // - Se estiver na lista de negados explicitamente pelo admin, bloqueia.
    // - Se estiver na lista de permitidos explicitamente pelo admin, permite.
    // - Caso contrário, segue a base do perfil.
    if (denied.includes(permId)) return false;
    if (allowed.includes(permId)) return true;
    
    return basePerms.includes(permId);
}

function getBasePermissions(user) {
    const sector = (user.sector || '').toLowerCase();
    const role = (user.role || '').toString().toLowerCase();
    const subType = user.subType;
    const perms = ['menu:perfil', 'menu:notificacoes']; // Comum a todos

    // Administrador (já tratado no hasPermission, mas mantido por consistência)
    if (role.includes('admin') || role.includes('administrador')) {
        return SYSTEM_MODULES.map(m => m.id).concat(customModulesData.map(m => `module:${m.id}`));
    }

    // Recebimento
    if (sector === 'recebimento') {
        perms.push('menu:patio', 'menu:mapas', 'menu:materia-prima', 'menu:cadastros', 'menu:produtos', 'menu:dashboard');
    }

    // Conferente
    if (sector === 'conferente') {
        perms.push('menu:patio', 'menu:mapas', 'menu:produtos');
    }

    // Portaria (Geralmente mapeada como recebimento ou setor específico no Wilson)
    if (role.includes('portaria')) {
        perms.push('menu:patio');
    }

    // Expedição / Carregamento
    if (role.includes('logistica') || role.includes('expedicao') || sector === 'expedicao') {
        perms.push('menu:carregamento', 'menu:patio');
    }

    return perms;
}

function openPermissionEditor(username) {
    const user = usersData.find(u => u.username === username);
    if (!user) return alert('Usuário não encontrado.');

    let modal = document.getElementById('modalPermEditor');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalPermEditor';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10001';
        document.body.appendChild(modal);
    }

    const custom = userPermissionsData[username] || { allowed: [], denied: [] };
    const basePerms = getBasePermissions(user);

    const renderCheck = (id, label, icon) => {
        const isBase = basePerms.includes(id);
        const isAllowed = Array.isArray(custom) ? custom.includes(id) : custom.allowed.includes(id);
        const isDenied = Array.isArray(custom) ? false : custom.denied.includes(id);
        
        // Estado final: se for base e não negado, ou se for permitido explicitamente
        const isChecked = (isBase && !isDenied) || isAllowed;
        const opacity = isBase ? '1' : '0.8';
        const badge = isBase ? '<span style="font-size:0.6rem; background:#e1f5fe; color:#01579b; padding:2px 5px; border-radius:4px; margin-left:auto;">PADRÃO</span>' : '';

        return `
            <label style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid rgba(0,0,0,0.05); cursor:pointer; opacity:${opacity}">
                <input type="checkbox" data-id="${id}" data-base="${isBase}" ${isChecked ? 'checked' : ''} style="width:18px; height:18px;">
                <i class="${icon}" style="width:20px; text-align:center; color:var(--primary);"></i>
                <span>${label}</span>
                ${badge}
            </label>
        `;
    };

    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px; width:95%;">
            <div class="modal-header">
                <h3>Permissões: ${user.username}</h3>
                <span class="close-modal" onclick="document.getElementById('modalPermEditor').style.display='none'">&times;</span>
            </div>
            <div class="modal-body" style="max-height:60vh; overflow-y:auto;">
                <h5 style="margin:10px 0; color:#666; text-transform:uppercase; font-size:0.75rem;">Menus do Sistema</h5>
                ${SYSTEM_MODULES.map(m => renderCheck(m.id, m.title, m.icon)).join('')}
                
                <h5 style="margin:20px 0 10px 0; color:#666; text-transform:uppercase; font-size:0.75rem;">Módulos Customizados</h5>
                ${customModulesData.length > 0 
                    ? customModulesData.map(m => renderCheck(`module:${m.id}`, m.label, m.icon)).join('')
                    : '<p style="font-size:0.85rem; color:#999; padding:10px;">Nenhum módulo customizado disponível.</p>'
                }
            </div>
            <div class="modal-footer">
                <button class="btn btn-edit" onclick="document.getElementById('modalPermEditor').style.display='none'">Cancelar</button>
                <button class="btn btn-save" onclick="saveUserPermissions('${username}')">Salvar Permissões</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function saveUserPermissions(username) {
    const user = usersData.find(u => u.username === username);
    const modal = document.getElementById('modalPermEditor');
    const checks = modal.querySelectorAll('input[type="checkbox"]');
    const basePerms = getBasePermissions(user);

    const allowed = [];
    const denied = [];

    checks.forEach(cb => {
        const id = cb.getAttribute('data-id');
        const isBase = cb.getAttribute('data-base') === 'true';
        const isChecked = cb.checked;

        if (isBase && !isChecked) {
            // Era padrão e foi desmarcado -> Adiciona aos negados
            denied.push(id);
        } else if (!isBase && isChecked) {
            // Não era padrão e foi marcado -> Adiciona aos permitidos
            allowed.push(id);
        }
    });

    userPermissionsData[username] = { allowed, denied };
    saveAll();
    
    alert(`Permissões de ${username} atualizadas!`);
    modal.style.display = 'none';
    
    if (loggedUser && loggedUser.username === username) {
        injectCustomMenus();
    }
}

// --- INTEGRAÇÃO COM NAVEGAÇÃO ---

// Sobrescreve a função navTo para suportar módulos customizados
const originalNavTo = window.navTo;
window.navTo = function(view, el) {
    if (view.startsWith('custom-')) {
        const modId = view.replace('custom-', '');
        const mod = customModulesData.find(m => m.id === modId);
        
        if (!mod) return;

        // Esconde todas as seções
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        
        // Mostra a seção customizada
        const section = document.getElementById('view-' + view);
        if (section) section.classList.add('active');

        // Atualiza menu lateral
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        if (el) el.classList.add('active');

        // Atualiza títulos
        const pt = document.getElementById('pageTitle');
        if (pt) pt.textContent = mod.label;
        
        const appTitle = document.querySelector('.app-title');
        if (appTitle) appTitle.innerText = `CONTROLADORIA AW - ${mod.label.toUpperCase()}`;

        localStorage.setItem('aw_last_view', view);
        return;
    }
    
    // Chama a função original para as rotas padrão
    if (typeof originalNavTo === 'function') originalNavTo(view, el);
};

// Inicialização automática ao carregar o script
document.addEventListener('DOMContentLoaded', () => {
    // Escuta evento de atualização do sistema para reinjetar menus se necessário
    window.addEventListener('aw_data_loaded', () => {
        console.log("Wilson Core: Dados carregados, injetando menus...");
        injectCustomMenus();
    });

    // Fallback caso o evento não dispare ou demore
    setTimeout(() => {
        if (document.querySelectorAll('.menu-item-custom').length === 0) {
            injectCustomMenus();
        }
    }, 2000);
});
