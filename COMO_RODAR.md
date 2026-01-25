# 🚀 Guia de Execução - Sistema Wilson

Este documento explica como instalar as dependências e iniciar o sistema após a conversão para **SQLite**.

---

## 📋 Pré-requisitos

Certifique-se de ter instalado em sua máquina:
*   **Node.js** (Versão 18 ou superior recomendada)
*   **NPM** (Vem instalado com o Node.js)

---

## 🛠️ Instalação

Siga estes passos na primeira vez que baixar o projeto ou se deletar a pasta `node_modules`:

1.  **Instalar dependências da Raiz:**
    Abra o terminal na pasta principal do projeto e execute:
    ```bash
    npm install
    ```

2.  **Instalar dependências do Servidor:**
    Entre na pasta `server` e instale as dependências específicas:
    ```bash
    cd server
    npm install
    ```

---

## 🏃 Como Iniciar o Sistema

Para rodar o projeto, você deve sempre iniciar o servidor primeiro.

1.  **Iniciando o Servidor:**
    Dentro da pasta `server`, execute:
    ```bash
    npm start
    ```
    Você verá a mensagem: `🚀 [Server] Running on port 2006`.

2.  **Acessando o Sistema:**
    Com o servidor rodando, você pode abrir o arquivo `frontend/index.html` diretamente no seu navegador ou usar o comando de desenvolvimento na raiz se estiver usando Electron/Vite.

---

## 🗄️ Banco de Dados (SQLite)

O sistema está configurado para usar **SQLite**. 
*   **Onde está o banco?** O arquivo de dados fica em `server/wilson.sqlite`.
*   **Vantagem:** Você **não precisa** de XAMPP, MySQL ou qualquer outro servidor externo. O banco é um arquivo local criado automaticamente.

---

## 🔐 Usuários Padrão (Login)

Caso o banco seja reiniciado, os seguintes usuários são criados automaticamente:

| Usuário | Senha | Nível |
| :--- | :--- | :--- |
| `admin` | `123456` | Administrador |
| `operador` | `123456` | Operador |
| `Caio` | `123` | Operador |

---

*Guia gerado para o Sistema Wilson - Backup*
