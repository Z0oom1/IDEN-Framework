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
> **O sistema agora utiliza SQLite como banco de dados padrão.**
> Esta mudança elimina a necessidade de configurar servidores externos como MySQL ou XAMPP, tornando a instalação muito mais simples.

| Pilar | Descrição |
| :--- | :--- |
| **Persistência SQLite** | Dados operacionais e de usuários são armazenados no arquivo `server/wilson.sqlite`. |
| **Offline-First** | O sistema usa `localStorage` como cache imediato, garantindo operação sem rede. |
| **Real-time Sync** | Utiliza **Socket.IO** para propagar atualizações instantaneamente entre todos os terminais. |
| **Modularidade** | Código dividido em módulos específicos para facilitar manutenção e expansão. |

---

## 📂 Estrutura de Pastas e Arquivos

```text
/
├── server/                 # 🖥️ BACKEND (Node.js + Express)
│   ├── server.js           # Core do servidor, rotas de API e Socket.IO
│   ├── database.js         # Lógica de conexão com SQLite
│   ├── wilson.sqlite       # Arquivo do Banco de Dados (Gerado automaticamente)
│   └── package.json        # Dependências do servidor
│
├── frontend/               # 🎨 FRONTEND (HTML, CSS, JS)
│   ├── index.html          # Ponto de entrada da interface
│   ├── pages/              # Telas do sistema (login, home)
│   ├── css/                # Estilização
│   └── js/
│       ├── modules/        # 🧩 Lógica Modular
│       └── main.js         # Loader de compatibilidade
│
├── package.json            # Configurações do Electron e Scripts
├── COMO_RODAR.md           # Guia rápido de instalação e execução
└── vite.config.js          # Configurações do bundler Vite
```

---

## 🛠️ Configuração de Ambiente

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **NPM**

### Instalação e Execução
```bash
# 1. Instale as dependências na raiz
npm install

# 2. Instale as dependências do servidor
cd server
npm install

# 3. Inicie o servidor
npm start
```

> [!TIP]
> Para detalhes completos sobre usuários padrão e troubleshooting, consulte o arquivo [COMO_RODAR.md](./COMO_RODAR.md).

---

## 🔐 Segurança e Permissões

O sistema utiliza um modelo de níveis de acesso:
*   **ADMIN:** Acesso total (Usuário: `admin` / Senha: `123456`).
*   **ENCARREGADO:** Gestão operacional e relatórios.
*   **OPERADOR:** Rotinas de lançamento (Pátio, Mapa Cego).

---

## ✍️ Manutenção e Suporte

**Autor:** Caio Rod  
**Licença:** Proprietária / Uso Interno  

*Documentação atualizada em 25 de Janeiro de 2026.*
