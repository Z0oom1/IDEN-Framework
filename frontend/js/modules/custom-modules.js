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
                        <div><label>Ícone FontAwesome:</label><input type="text" id="modIcon" class="form-control" placeholder="Ex: fas fa-file-invoice"></div>
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
    
    const perms = userPermissionsData[loggedUser.username];
    
    // Se não houver permissões definidas, aplica lógica de fallback (opcional)
    if (!perms) {
        // Fallback básico para novos usuários sem configuração
        const basicPerms = ['menu:perfil', 'menu:configuracoes', 'menu:notificacoes'];
        return basicPerms.includes(permId);
    }
    
    return perms.includes(permId);
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

    const currentPerms = userPermissionsData[username] || [];

    const renderCheck = (id, label, icon) => {
        const checked = currentPerms.includes(id) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid rgba(0,0,0,0.05); cursor:pointer;">
                <input type="checkbox" value="${id}" ${checked} style="width:18px; height:18px;">
                <i class="${icon}" style="width:20px; text-align:center; color:var(--primary);"></i>
                <span>${label}</span>
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
    const modal = document.getElementById('modalPermEditor');
    const checks = modal.querySelectorAll('input[type="checkbox"]:checked');
    const selectedPerms = Array.from(checks).map(c => c.value);

    userPermissionsData[username] = selectedPerms;
    saveAll();
    
    alert(`Permissões de ${username} atualizadas!`);
    modal.style.display = 'none';
    
    // Se for o próprio usuário logado, atualiza a interface imediatamente
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
    // Pequeno delay para garantir que o data-sync carregou os dados do servidor
    setTimeout(() => {
        injectCustomMenus();
    }, 1000);
});
