/**
 * IDEN-FRAMEWORK CORE ENGINE
 * Gerenciamento central de UI, Menus e Navegação
 */

const IDEN = {
    menus: [],
    currentView: null,

    /**
     * Inicializa a framework
     */
    init() {
        console.log("IDEN-Framework Initialized");
        this.setupEventListeners();
        this.renderSidebar();
    },

    /**
     * Registra um novo menu no sistema
     * @param {Object} config { id, label, icon, role, action }
     */
    registerMenu(config) {
        this.menus.push({
            id: config.id,
            label: config.label,
            icon: config.icon || 'fas fa-circle',
            role: config.role || '*',
            action: config.action || null
        });
    },

    /**
     * Renderiza a sidebar dinamicamente baseada nos menus registrados
     */
    renderSidebar() {
        const menuContainer = document.querySelector('.menu-items');
        if (!menuContainer) return;

        menuContainer.innerHTML = '';
        this.menus.forEach(menu => {
            const a = document.createElement('a');
            a.className = 'menu-item';
            a.id = `menu-${menu.id}`;
            a.innerHTML = `<i class="${menu.icon}"></i> <span>${menu.label}</span>`;
            a.onclick = (e) => {
                this.navigate(menu.id, a);
                if (menu.action) menu.action();
            };
            menuContainer.appendChild(a);
        });
    },

    /**
     * Navega para uma view específica
     */
    navigate(viewId, element) {
        // Remover active de todos
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

        // Adicionar active no selecionado
        if (element) element.classList.add('active');
        else {
            const el = document.getElementById(`menu-${viewId}`);
            if (el) el.classList.add('active');
        }

        const view = document.getElementById(`view-${viewId}`);
        if (view) {
            view.classList.add('active');
            this.currentView = viewId;
            this.updateTitle(viewId);
        }
    },

    /**
     * Atualiza o título na barra superior (Estilo Apple)
     */
    updateTitle(viewId) {
        const menu = this.menus.find(m => m.id === viewId);
        const title = menu ? menu.label : 'Home';
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = title;

        const appleTitle = document.getElementById('apple-app-title');
        if (appleTitle) appleTitle.textContent = title.toUpperCase();
    },

    /**
     * Cria um modal dinâmico
     */
    createModal(id, title, contentHTML) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="document.getElementById('${id}').remove()" class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    },

    setupEventListeners() {
        // Atalhos globais ou listeners de sistema
    }
};

window.IDEN = IDEN;
document.addEventListener('DOMContentLoaded', () => IDEN.init());
