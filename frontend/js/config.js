/**
 * IDEN-FRAMEWORK CONFIGURATION
 * Configurações globais do sistema
 */

const SERVER_HOST = window.location.hostname || "localhost";
const SERVER_PORT = "2006";
const API_BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

const CONFIG = {
    APP_NAME: 'IDEN-Framework',
    VERSION: '1.0.0',
    API_BASE_URL: API_BASE_URL,
    DEFAULT_THEME: 'light',
    FEATURES: {
        DARK_MODE: true,
        NOTIFICATIONS: true,
        ELECTRON_INTEGRATION: true
    }
};

// Exportar para uso global
window.IDEN_CONFIG = CONFIG;

// Compatibilidade com código legado
window.API_BASE_URL = API_BASE_URL;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, SERVER_HOST, SERVER_PORT, CONFIG };
}
