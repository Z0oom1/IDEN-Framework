# 📦 IDEN-Framework Core – Sistema de Controle Operacional (v3.6.9)

![Status](https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o-emerald)
![Versão](https://img.shields.io/badge/Vers%C3%A3o-3.6.9-blue)
![Tech](https://img.shields.io/badge/Tech-Node.js%20%7C%20Express%20%7C%20SQLite%20%7C%20Vanilla%20JS-lightgrey)

Bem-vindo à documentação técnica do **IDEN-Framework Core**. Este sistema foi projetado para digitalizar processos logísticos e operacionais complexos, substituindo planilhas e papéis por uma interface robusta, sincronizada em tempo real e resiliente a falhas de conexão.

---

## 🎯 Arquitetura e Pilares Fundamentais

O IDEN-Framework Core opera em uma arquitetura **Cliente-Servidor** leve, onde o Frontend (HTML/CSS/JS) se comunica com um Backend (Node.js/Express) para persistência de dados e sincronização em tempo real.

### 🧠 Pilares Arquiteturais

| Pilar | Descrição | Implementação |
| :--- | :--- | :--- |
| **Offline-First** | O sistema utiliza o `localStorage` do navegador como cache primário. Em caso de falha de conexão, a operação continua localmente, sincronizando automaticamente ao restabelecimento da rede. | Frontend: `data-sync.js` |
| **Persistência SQLite** | Todos os dados operacionais e de usuários são armazenados no arquivo `server/iden-framework.sqlite`. Esta abordagem simplifica a instalação, eliminando a necessidade de servidores de banco de dados externos. | Backend: `server/database.js` |
| **Real-time Sync** | Utiliza **Socket.IO** para propagar atualizações instantaneamente entre todos os terminais conectados, garantindo que todos os usuários trabalhem com os dados mais recentes. | Backend: `server/server.js` (Socket.IO) |
| **Modularidade** | O código do Frontend é rigorosamente dividido em módulos JavaScript com dependências bem definidas, facilitando a manutenção, o desenvolvimento e a adição de novas funcionalidades. | Frontend: `frontend/js/modules/` |

---

## 📂 Estrutura de Pastas e Arquivos

A estrutura do projeto é dividida em duas áreas principais: `server` (Backend) e `frontend` (Interface do Usuário).

```text
/
├── server/                 # 🖥️ BACKEND (Node.js + Express)
│   ├── server.js           # Core do servidor, rotas de API e Socket.IO
│   ├── database.js         # Lógica de conexão e manipulação do SQLite
│   ├── auth.js             # Funções de autenticação e hashing de senha
│   ├── middleware.js       # Funções de middleware (Auth, Permissões, Logs)
│   └── iden-framework.sqlite       # Arquivo do Banco de Dados (Gerado automaticamente)
│
├── frontend/               # 🎨 FRONTEND (HTML, CSS, JS)
│   ├── pages/              # Telas do sistema (login.html, home.html)
│   ├── css/                # Estilização (estilo_geral.css, login.css)
│   └── js/
│       ├── modules/        # 🧩 Lógica Modular (Ver seção abaixo)
│       └── main.js         # Arquivo de compatibilidade (aponta para modules/main.js)
│
├── package.json            # Dependências e Scripts do Projeto
├── COMO_RODAR.md           # Guia rápido de instalação e execução
└── vite.config.js          # Configurações de build (se aplicável)
```

---

## 🧩 Arquitetura Modular do Frontend

O Frontend é construído com JavaScript puro (Vanilla JS) e segue uma arquitetura modular em camadas, garantindo que as dependências sejam carregadas na ordem correta.

A ordem de carregamento dos módulos, definida em `frontend/pages/home.html`, é crucial para o funcionamento do sistema:

| Camada | Módulo(s) | Responsabilidade |
| :--- | :--- | :--- |
| **1. Utilidades** | `validators.js` | Funções básicas de validação, formatação e utilitários de data/hora. |
| **2. Infraestrutura** | `config.js`, `auth-sync.js`, `data-sync.js` | Configurações globais, lógica de autenticação e o pilar de sincronização de dados (Offline-First). |
| **3. Comunicação** | `notifications.js` | Gerenciamento e exibição de notificações em tempo real para o usuário. |
| **4. Interface (UI)** | `ui-navigation.js` | Lógica de navegação entre as telas (`navTo`) e manipulação de elementos visuais. |
| **5. Regras de Negócio** | `patio.js`, `mapas-cegos.js`, `materia-prima.js`, `carregamento.js`, `relatorios.js`, `dashboard.js`, `cadastros.js`, `users.js`, `products.js` | Contém a lógica específica de cada funcionalidade do sistema. **Estes módulos dependem dos módulos das camadas 2, 3 e 4.** |
| **6. Orquestração** | `main.js` | Ponto de entrada principal. Inicializa o sistema após o carregamento do DOM e coordena a execução inicial dos módulos. |

### Exemplo de Fluxo de Dados (`data-sync.js`)

O módulo `data-sync.js` é o coração da resiliência do sistema. Ele gerencia o fluxo de dados entre o `localStorage` (cache local) e o servidor (SQLite).

1.  **`loadDataFromServer()`**: Tenta buscar todos os dados (`/api/sync`) do servidor.
    *   Se for bem-sucedido, salva os dados no `localStorage` e atualiza as variáveis globais.
    *   Se falhar (servidor offline), restaura os dados do `localStorage` (`restoreFromLocal()`).
2.  **`saveAll()`**: Chamado após qualquer alteração de dados.
    *   Salva imediatamente no `localStorage` (`saveToLocalOnly()`).
    *   Envia a alteração para o servidor (`saveToServer()`).
3.  **Real-time Update**: O servidor, ao receber um `POST` em `/api/sync`, emite um evento `atualizar_sistema` via Socket.IO, que notifica todos os clientes para re-sincronizarem ou atualizarem a view.

---

## 🛠️ Configuração de Ambiente

### Pré-requisitos
*   **Node.js** (v18 ou superior)
*   **NPM**

### Instalação e Execução

```bash
# 1. Clone o repositório
gh repo clone Z0oom1/IDEN-Framework-backup
cd IDEN-Framework-backup

# 2. Instale as dependências do projeto (inclui frontend)
npm install

# 3. Instale as dependências do servidor
cd server
npm install
cd ..

# 4. Inicie o servidor
npm start
```

> [!TIP]
> Para detalhes completos sobre usuários padrão, credenciais de teste e troubleshooting, consulte o arquivo [COMO_RODAR.md](./COMO_RODAR.md).

---

## 🔐 Segurança e Permissões

O sistema utiliza um modelo de níveis de acesso e autenticação via **JWT (JSON Web Token)** e **Cookies** para manter a sessão.

| Nível de Acesso | Descrição | Credenciais Padrão (Teste) |
| :--- | :--- | :--- |
| **ADMIN** | Acesso total, gestão de usuários e funções de restauração/reset de dados. | Usuário: `Admin` / Senha: `123` |
| **ENCARREGADO** | Gestão operacional e acesso a relatórios gerenciais. | Usuário: `EncarRec` / Senha: `enc123` |
| **OPERADOR** | Rotinas de lançamento de dados (Pátio, Mapa Cego, Pesagem). | Usuário: `Caio` / Senha: `123` |
| **CONFERENTE** | Rotinas de conferência e gestão de pátio. | Usuário: `Fabricio` / Senha: `123` |

---

## ✍️ Manutenção e Suporte

**Autor:** Caio Rod  
**Documentação por:** Manus AI  
**Licença:** Proprietária / Uso Interno  

*Documentação atualizada em 29 de Janeiro de 2026.*
