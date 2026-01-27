// Configuração Global de API
// Detecta o IP do servidor baseado na URL de acesso atual
const SERVER_HOST = window.location.hostname || "localhost";
const SERVER_PORT = "2006";
const API_BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

console.log(`[Config] API Base URL definida como: ${API_BASE_URL}`);

// Exporta para uso em módulos se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, SERVER_HOST, SERVER_PORT };
}
