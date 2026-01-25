# 📦 Wilson Core – Sistema de Controle Operacional (v3.6.9)

![Status](https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o-emerald)
![Versão](https://img.shields.io/badge/Vers%C3%A3o-3.6.9-blue)
![Tech](https://img.shields.io/badge/Tech-Electron%20%7C%20Node.js%20%7C%20SQLite-lightgrey)

Bem-vindo à documentação técnica do **Wilson Core**. Este sistema foi projetado para digitalizar processos logísticos e operacionais complexos, substituindo planilhas e papéis por uma interface robusta, sincronizada em tempo real e resiliente a falhas de conexão.

---

## 🎯 Visão Geral do Sistema

O Wilson Core é um software **Offline-First** focado no controle de pátio, pesagem, mapas cegos e gestão de carregamento. Ele opera como uma aplicação Desktop (Electron) que se comunica com um servidor central (Node.js) para persistência e sincronização via WebSockets.

### 🧠 Pilares Arquiteturais

> [!IMPORTANT]
> **A Regra de Negócio reside no Frontend.**
> Diferente de sistemas tradicionais, o backend aqui funciona como um "Cofre de Dados" (Key-Value Store), permitindo que o sistema evolua rapidamente sem a necessidade de migrações constantes de banco de dados.

| Pilar | Descrição |
| :--- | :--- |
| **Persistência JSON** | Dados operacionais são armazenados como objetos JSON serializados no SQLite. |
| **Offline-First** | O sistema usa `localStorage` como cache imediato, garantindo operação sem rede. |
| **Real-time Sync** | Utiliza **Socket.IO** para propagar atualizações instantaneamente entre todos os terminais. |
| **Modularidade** | Código dividido em módulos específicos para facilitar manutenção e expansão. |

---

## 📂 Estrutura de Pastas e Arquivos

Para mexer no sistema, é fundamental entender onde cada peça se encaixa:

```text
/
├── server/                 # 🖥️ BACKEND (Node.js + Express)
│   ├── server.js           # Core do servidor, rotas de API e Socket.IO
│   ├── database.sqlite     # Banco de dados principal (SQLite)
│   └── package.json        # Dependências do servidor (express, sqlite3, socket.io)
│
├── frontend/               # 🎨 FRONTEND (HTML, CSS, JS)
│   ├── index.html          # Ponto de entrada da interface
│   ├── pages/              # Telas do sistema (login, home)
│   ├── css/                # Estilização (estilo_geral.css, login.css)
│   └── js/
│       ├── modules/        # 🧩 Lógica Modular (Onde a mágica acontece)
│       │   ├── data-sync.js    # Sincronização e persistência
│       │   ├── ui-navigation.js # Controle de telas (SPA)
│       │   ├── patio.js        # Gestão de pátio e caminhões
│       │   ├── users.js        # Gestão de usuários e permissões
│       │   └── ...             # Outros módulos funcionais
│       └── main.js             # Loader de compatibilidade
│
├── package.json            # Configurações do Electron e Scripts de Build
└── vite.config.js          # Configurações do bundler Vite
```

---

## 🧩 Guia do Desenvolvedor: Como Mexer

### 1. Implementando uma Nova Funcionalidade
Para adicionar uma nova tela ou funcionalidade (ex: "Controle de Estoque"):

1. **Crie o Módulo JS:** Adicione `frontend/js/modules/estoque.js`.
2. **Defina os Dados:** No `data-sync.js`, adicione uma variável global `estoqueData = []` e inclua-a nas funções `loadDataFromServer`, `saveAll`, `saveToLocalOnly` e `restoreFromLocal`.
3. **Crie a Interface:** No `index.html`, adicione uma `<section id="view-estoque" class="view-section">`.
4. **Registre a Navegação:** No `ui-navigation.js`, adicione o caso no `navTo('estoque')` para chamar a função de renderização do seu novo módulo.

### 2. Alterando Regras de Negócio
As validações (campos obrigatórios, cálculos de peso, divergências) estão concentradas nos arquivos dentro de `frontend/js/modules/`.
* Para mudar validações globais: `validators.js`.
* Para mudar cálculos do Mapa Cego: `mapas-cegos.js`.

### 3. Removendo Funcionalidades
Para remover algo, certifique-se de:
1. Remover a chamada no `ui-navigation.js`.
2. Remover o script correspondente no `index.html`.
3. (Opcional) Limpar a `key` correspondente no banco de dados através da rota `/api/reset` ou manualmente no SQLite.

---

## 🔄 Fluxo de Dados (Data Lifecycle)

O sistema segue um ciclo rigoroso para garantir que nenhum dado seja perdido:

1.  **LOAD:** Ao iniciar, o sistema busca os dados no servidor (`GET /api/sync`). Se falhar, carrega do `localStorage`.
2.  **STATE:** Os dados ficam em arrays globais na memória do navegador (ex: `patioData`).
3.  **CHANGE:** Quando o usuário edita algo, o array global é modificado.
4.  **SAVE (`saveAll`):**
    *   **Passo 1:** Salva no `localStorage` (Segurança imediata).
    *   **Passo 2:** Envia para o servidor via `POST /api/sync`.
    *   **Passo 3:** Servidor avisa outros terminais via **Socket.IO** (`atualizar_sistema`).
5.  **SYNC:** Outros terminais recebem o aviso e recarregam os dados automaticamente.

---

## 🛠️ Configuração de Ambiente

### Pré-requisitos
* **Node.js** (v16 ou superior)
* **pnpm** ou **npm**

### Instalação e Execução
```bash
# Instale as dependências (Raiz e Server)
npm install
cd server && npm install && cd ..

# Executar em modo desenvolvimento (Server + Vite + Electron)
npm run dev

# Apenas o servidor
npm run server
```

---

## 🌐 API Endpoints (Porta 2006)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Verifica se o servidor está online. |
| `GET` | `/api/sync` | Retorna todos os dados operacionais em formato JSON. |
| `POST` | `/api/sync` | Salva/Atualiza uma coleção específica (envie `{key, data}`). |
| `POST` | `/api/restore` | Sobrescreve todo o banco com um objeto de backup. |
| `DELETE`| `/api/reset` | **CUIDADO:** Limpa todos os dados operacionais. |

---

## 🔐 Segurança e Permissões

O sistema utiliza um modelo de níveis de acesso definido no módulo `users.js`:
*   **ADMIN:** Acesso total, incluindo gestão de usuários e resets.
*   **ENCARREGADO:** Gestão operacional e relatórios.
*   **OPERADOR:** Acesso restrito às rotinas de lançamento (Pátio, Mapa Cego).

> [!NOTE]
> As senhas são armazenadas em texto simples por requisito de simplicidade atual, mas a função `saveFirstAccessPassword` no `main.js` está preparada para implementação de Hash/Salt.

---

## ✍️ Manutenção e Suporte

**Autor:** Caio Rod
**Licença:** Proprietária / Uso Interno

Para problemas de porta ocupada (EADDRINUSE), encerre os processos do Node:
`taskkill /F /IM node.exe` (Windows) ou `killall node` (Linux/Mac).

---
*Documentação atualizada em 25 de Janeiro de 2026.*
