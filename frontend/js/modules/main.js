// ===================================================================================
//          WILSON CORE 2.4.3 - ARQUIVO PRINCIPAL MODULAR
//          Carrega todos os módulos na ordem correta
// ===================================================================================

/*
    ORDEM DE CARREGAMENTO (IMPORTANTE):
    
    1. Validators      - Funções básicas de validação (não depende de nada)
    2. Config          - Configuração e Socket.IO (usa Validators)
    3. Data-Sync       - Sincronização de dados (usa Config)
    4. Notifications   - Sistema de notificações (usa Config e Data-Sync)
    5. UI-Navigation   - Navegação e UI (usa Data-Sync)
    6. Patio           - Gestão de pátio (usa Validators, Data-Sync, Notifications)
    7. Cadastros       - CRUD de cadastros (usa Validators, Data-Sync, Notifications)
    8. Mapas-Cegos     - Gestão de mapas (usa Data-Sync, Notifications)
    9. Materia-Prima   - Pesagem (usa Data-Sync, Notifications)
    10. Carregamento   - Controle de carregamento (usa Data-Sync)
    11. Relatorios     - Geração de relatórios (usa Data-Sync)
    12. Dashboard      - Dashboard inteligente (usa Data-Sync)
    13. Users          - Gestão de usuários (usa Data-Sync, Notifications)
    14. Products       - Catálogo de produtos (usa Data-Sync)
    
    NOTA: Este arquivo assume que os scripts serão carregados via tags <script>
    no HTML na ordem especificada. Para usar módulos ES6 (import/export), 
    será necessário refatorar todos os arquivos.
*/

// ===================================================================================
//          INICIALIZAÇÃO DO SISTEMA
// ===================================================================================

// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("===================================================");
    console.log("   WILSON CORE 2.4.3 - SISTEMA MODULARIZADO      ");
    console.log("===================================================");
    
    console.log("✓ Validators carregado");
    console.log("✓ Config carregado");
    console.log("✓ Data-Sync carregado");
    console.log("✓ Notifications carregado");
    console.log("✓ UI-Navigation carregado");
    console.log("✓ Patio carregado");
    console.log("✓ Cadastros carregado (se disponível)");
    console.log("✓ Mapas-Cegos carregado (se disponível)");
    console.log("✓ Materia-Prima carregado (se disponível)");
    console.log("✓ Carregamento carregado (se disponível)");
    console.log("✓ Relatorios carregado (se disponível)");
    console.log("✓ Dashboard carregado (se disponível)");
    console.log("✓ Users carregado (se disponível)");
    console.log("✓ Products carregado (se disponível)");
    
    console.log("===================================================");
    console.log("   Inicializando Sistema...                       ");
    console.log("===================================================");
    
    // Inicializa a interface baseada em permissões
    initRoleBasedUI();

    // Define a última visualização ou padrão
    let lastView = localStorage.getItem('aw_last_view') || 'patio';
    
    // Redireciona almoxarifado se a última visualização foi cadastros
    if (lastView === 'cadastros' && typeof userSubType !== 'undefined' && userSubType === 'ALM') {
        lastView = 'patio';
    }

    // Navega para a visualização inicial
    if (typeof loggedUser !== 'undefined' && loggedUser) {
        navTo(lastView, null);
    }

    // Inicializa o relógio no header
    const clockEl = document.getElementById('serverTime');
    if (clockEl) {
        setInterval(() => {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
    
    // Inicializa o filtro de data com o dia atual
    const patioDateFilter = document.getElementById('patioDateFilter');
    if (patioDateFilter) {
        patioDateFilter.value = getBrazilTime().split('T')[0];
    }

    // Carrega dados do servidor
    loadDataFromServer();
    
    // Verifica modal de primeiro acesso
    setTimeout(() => {
        try {
            const pending = sessionStorage.getItem('must_change_pw');
            if (pending) {
                const logged = JSON.parse(sessionStorage.getItem('loggedInUser') || 'null');
                if (logged && logged.username === pending) {
                    document.getElementById('modalFirstAccess') && (document.getElementById('modalFirstAccess').style.display = 'flex');
                }
            }
        } catch (e) { 
            console.warn("Erro ao verificar primeiro acesso:", e);
        }
    }, 800);
    
});

function closeFirstAccessModal() {
    document.getElementById('modalFirstAccess').style.display = 'none';
}

async function saveFirstAccessPassword() {
    const p1 = document.getElementById('newPw1').value;
    const p2 = document.getElementById('newPw2').value;
    if (p1.length < 4) return alert('Senha muito curta.');
    if (p1 !== p2) return alert('Senhas não conferem.');

    const u = usersData.find(x => x.username === loggedUser.username);
    if (u) {
        u.password = p1; // Em produção, usar hash
        u.isTempPassword = false;
        saveAll();
    }
    sessionStorage.removeItem('must_change_pw');
    closeFirstAccessModal();
    alert('Senha atualizada.');
    location.reload();
}

// ===================================================================================
//          VARIÁVEIS GLOBAIS AUXILIARES
// ===================================================================================

const today = getBrazilTime().split('T')[0];

console.log("Main.js carregado - Aguardando DOMContentLoaded...");
