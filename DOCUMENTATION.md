# IDEN-Framework

O **IDEN-Framework** é uma estrutura de desenvolvimento genérica, modular e escalável, projetada para ser a base de sistemas modernos com interface estilo Apple (macOS/iOS). Ele fornece um conjunto completo de componentes UI, sistema de autenticação, gerenciamento de permissões e uma arquitetura limpa para acelerar o desenvolvimento de novos produtos.

---

## 🚀 Como Iniciar um Projeto

Para começar um novo projeto usando o IDEN-Framework, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Z0oom1/IDEN-Framework.git
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:**
   Edite o arquivo `frontend/js/config.js` para definir o nome do seu aplicativo e as URLs da API.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 🎨 Design System

O framework utiliza um design system padronizado baseado nas diretrizes da Apple.

### Cores Principais
| Variável | Cor | Descrição |
| :--- | :--- | :--- |
| `--primary` | `#007AFF` | Cor de destaque principal (Azul Apple) |
| `--bg-body` | `#F2F2F7` | Cor de fundo das páginas |
| `--text-main`| `#000000` | Cor do texto principal |

### Componentes UI
Todos os componentes estão definidos em `frontend/css/design-system.css`. Use as classes padrão para manter a consistência:
- **Botões:** `.btn .btn-primary`, `.btn .btn-secondary`
- **Cards:** `.card`
- **Inputs:** Estilizados globalmente para `input`, `select` e `textarea`.

---

## 🧩 Arquitetura e Módulos

O código é organizado para separar as responsabilidades de forma clara:

- **Core:** Localizado em `frontend/js/main.js` e `frontend/js/config.js`.
- **Módulos:** Localizados em `frontend/js/modules/`. Cada funcionalidade deve ser um novo arquivo `.js` neste diretório.
- **UI:** Gerenciada pelo `design-system.css` e `ui-navigation.js`.

### Como Adicionar Novos Menus e Páginas

1. **No HTML (`home.html`):**
   Adicione um novo item no `<nav class="main-sidebar">`:
   ```html
   <a class="menu-item" onclick="navTo('meu-modulo', this)">
       <i class="fas fa-star"></i> Meu Módulo
   </a>
   ```

2. **No JavaScript (`ui-navigation.js`):**
   Adicione o título da página no objeto `titles`:
   ```javascript
   const titles = {
       'meu-modulo': 'Título do Meu Módulo',
       // ...
   };
   ```

3. **Crie a View:**
   Adicione uma nova `<div id="view-meu-modulo" class="view-section">` no `home.html`.

---

## 🔐 Permissões e Roles

O sistema de permissões é flexível e configurado em `frontend/js/modules/permissions.js`.

### Configurando Roles
Adicione novas roles no objeto `PermissionsManager.roles` e defina seus privilégios em `presets`:

```javascript
presets: {
    'admin': ['*'], // Acesso total
    'editor': ['view_dashboard', 'edit_content'],
    'viewer': ['view_dashboard']
}
```

Para verificar uma permissão no código:
```javascript
if (IDEN_Permissions.can(currentUser, 'edit_content')) {
    // Mostrar botão de edição
}
```

---

## 💻 Integração com Electron

O IDEN-Framework vem pronto para ser usado como aplicativo desktop via Electron.
- A barra superior (`#titlebar`) detecta automaticamente o ambiente Electron e exibe os controles de janela (fechar, minimizar, maximizar) no estilo macOS.
- O título da página é centralizado automaticamente na barra superior.

---

## 🛠️ Melhores Práticas

- **Código Limpo:** Mantenha as funções pequenas e focadas em uma única tarefa.
- **Modularização:** Sempre que criar uma nova funcionalidade complexa, crie um novo arquivo em `js/modules/`.
- **CSS:** Evite inline styles. Use as variáveis do `design-system.css` para garantir que o tema escuro (Dark Mode) funcione corretamente.

---

© 2026 IDEN-Framework - Desenvolvido para ser escalável.
