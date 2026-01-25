// ===================================================================================
//          MÓDULO DE USUÁRIOS E PERFIL
// ===================================================================================

function renderProfileArea() {
    const content = document.getElementById('profileContent');
    if (!content) return;

    const u = loggedUser || { username: 'Visitante', role: 'Nenhum', sector: 'Nenhum' };

    content.innerHTML = `
        <div class="settings-card">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px;">
                <div style="width:80px; height:80px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2rem;">
                    ${u.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 style="margin:0;">${u.username}</h3>
                    <p style="margin:0; color:#666;">${u.role} ${u.subType ? '• ' + u.subType : ''}</p>
                </div>
            </div>
            
            <div class="form-grid">
                <div>
                    <label class="form-label">Nome de Usuário</label>
                    <input class="form-input-styled" value="${u.username}" disabled>
                </div>
                <div>
                    <label class="form-label">Cargo / Perfil</label>
                    <input class="form-input-styled" value="${u.role}" disabled>
                </div>
                <div>
                    <label class="form-label">Setor</label>
                    <input class="form-input-styled" value="${u.sector || 'Não definido'}" disabled>
                </div>
                <div>
                    <label class="form-label">Sub-tipo</label>
                    <input class="form-input-styled" value="${u.subType || 'Geral'}" disabled>
                </div>
            </div>

            <div style="margin-top:30px; padding-top:20px; border-top:1px solid #eee;">
                <button class="btn btn-edit" onclick="logout()" style="background:#ff4d4d; color:#fff; border:none;">
                    <i class="fas fa-sign-out-alt"></i> Sair do Sistema
                </button>
            </div>
        </div>
    `;
}

function updatePermissionStatus() {
    // Função placeholder para manter compatibilidade com chamadas existentes
    console.log("Status de permissões atualizado.");
}
