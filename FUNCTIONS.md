# Guia Técnico de Funções | IDEN-Framework

Este documento detalha as funções principais da framework e como utilizá-las para construir seu sistema.

---

## 🛠️ Core Engine (`IDEN`)

A engine central é acessível globalmente via o objeto `IDEN`.

### `IDEN.registerMenu(config)`
Registra um novo item no menu lateral.
- **Parâmetros:**
  - `id`: ID único da view (ex: 'vendas').
  - `label`: Nome exibido no menu.
  - `icon`: Classe FontAwesome (ex: 'fas fa-box').
  - `action`: (Opcional) Função executada ao clicar.

### `IDEN.navigate(viewId)`
Troca a tela atual programaticamente.
- **Parâmetros:**
  - `viewId`: ID da view registrada.

### `IDEN.createModal(id, title, contentHTML)`
Cria e exibe um modal dinâmico.
- **Parâmetros:**
  - `id`: ID único para o modal.
  - `title`: Título do modal.
  - `contentHTML`: Conteúdo em HTML.

---

## 🔐 Autenticação e Permissões

### `IDEN_Permissions.can(user, permission)`
Verifica se o usuário tem uma permissão específica.
- **Retorno:** `Boolean`.

### `auth.logout()`
Limpa a sessão e redireciona para a tela de login.

---

## 🎨 Design System (CSS)

A framework utiliza variáveis CSS para padronização. Sempre utilize estas variáveis em vez de cores fixas:

- `var(--primary)`: Cor principal (Azul Apple).
- `var(--bg-card)`: Fundo de cartões e modais.
- `var(--text-main)`: Cor do texto principal.
- `var(--radius-md)`: Arredondamento padrão.

### Classes Úteis:
- `.card`: Container com sombra e fundo branco/escuro.
- `.btn .btn-primary`: Botão principal estilizado.
- `.view-section`: Container de página (escondido por padrão).
- `.active`: Classe que torna uma view visível.

---

## 🚀 Exemplo de Implementação de Nova Página

1. **No HTML (`home.html`):**
```html
<div id="view-clientes" class="view-section">
    <div class="card">
        <h3>Gerenciamento de Clientes</h3>
        <!-- Seu conteúdo aqui -->
    </div>
</div>
```

2. **No Script:**
```javascript
IDEN.registerMenu({ 
    id: 'clientes', 
    label: 'Clientes', 
    icon: 'fas fa-users' 
});
IDEN.renderSidebar();
```

A framework cuidará automaticamente da troca de telas, destaque no menu e atualização do título na barra superior.
