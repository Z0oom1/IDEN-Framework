# Wilson Control - Sistema Profissional de Pesagem e Carregamento

## 📋 Visão Geral

O **Wilson Control** é um sistema profissional de gestão de pesagem, carregamento e controle de pátio para empresas de logística e distribuição. A versão 2.0 foi completamente reestruturada com arquitetura moderna, segurança de nível empresarial e banco de dados relacional.

## 🎯 Funcionalidades Principais

- **Controle de Pátio:** Gerenciamento de caminhões em entrada/saída
- **Pesagem:** Sistema de pesagem manual e automática com rastreamento
- **Carregamento:** Controle de carregamentos com validação de produtos
- **Mapas Cegos:** Gestão de mapas de conferência
- **Matéria Prima:** Cadastro e controle de matérias-primas
- **Relatórios:** Geração de relatórios em PDF e Excel
- **Dashboard:** Visualização em tempo real com gráficos
- **Auditoria:** Log completo de todas as atividades
- **RBAC:** Controle de acesso baseado em roles

## 🔐 Segurança

### Autenticação
- **JWT (JSON Web Tokens)** para sessões seguras
- **Bcrypt** para criptografia de senhas
- **Cookies HTTP-only** para armazenamento de tokens
- **Expiração automática** de sessões

### Controle de Acesso (RBAC)
- **Admin:** Acesso total ao sistema
- **Encarregado:** Gestão de operadores e aprovação de requisições
- **Operador:** Execução de operações de pesagem e carregamento
- **Conferente:** Conferência de produtos e mapas

### Auditoria
- Log de todas as ações do usuário
- Rastreamento de alterações de dados
- Registro de IP e timestamp
- Relatórios de atividades

## 🛠️ Tecnologias

### Backend
- **Node.js + Express:** Framework web
- **MySQL:** Banco de dados relacional
- **JWT:** Autenticação segura
- **Bcrypt:** Criptografia de senhas
- **Socket.IO:** Comunicação em tempo real

### Frontend
- **HTML5 + CSS3:** Interface responsiva
- **JavaScript (Vanilla):** Lógica de negócio
- **Chart.js:** Gráficos e visualizações
- **Socket.IO Client:** Sincronização em tempo real

## 📦 Instalação

### Pré-requisitos
- Node.js 16+
- MySQL 5.7+
- npm ou yarn

### Passos

1. **Clonar o repositório**
```bash
git clone https://github.com/Z0oom1/Wilson-backup.git
cd Wilson-backup
```

2. **Instalar dependências do servidor**
```bash
cd server
npm install
```

3. **Configurar banco de dados**
```bash
# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais MySQL
nano .env
```

4. **Iniciar o servidor**
```bash
npm start
# ou para desenvolvimento com auto-reload
npm run dev
```

5. **Acessar a aplicação**
```
http://localhost:2006
```

## 🔑 Credenciais Padrão

### Usuários de Teste
| Username | Senha | Role | Setor |
|----------|-------|------|-------|
| admin | 123456 | admin | admin |
| encarregado | 123456 | encarregado | recebimento |
| operador | 123456 | operador | recebimento |
| conferente | 123456 | conferente | conferente |
| Fabricio | 123 | conferente | conferente (ALM) |
| Clodoaldo | 123 | conferente | conferente (ALM) |
| Guilherme | 123 | conferente | conferente (GAVA) |
| Wayner | 123 | conferente | conferente (INFRA) |
| Caio | 123 | operador | recebimento |
| Balanca | 123 | operador | recebimento |

### Menu de Login Rápido
O sistema mantém um menu de contas rápidas para facilitar demonstrações. Clique no botão "Contas Rápidas" na tela de login.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- **users:** Usuários do sistema com roles e permissões
- **app_data:** Dados de aplicação (compatibilidade com sistema antigo)
- **activity_logs:** Log de auditoria de todas as ações

### Dados de Negócio
- **caminhoes:** Registros de caminhões
- **pesagens:** Histórico de pesagens
- **carregamentos:** Registros de carregamentos
- **mapas_cegos:** Mapas de conferência
- **requisicoes:** Requisições de cadastro pendentes

## 🔄 Fluxo de Autenticação

1. **Login:** Usuário entra com username/password
2. **Validação:** Servidor verifica credenciais no MySQL
3. **Token:** JWT é gerado e enviado ao cliente
4. **Armazenamento:** Token armazenado em cookie HTTP-only
5. **Requisições:** Todas as requisições incluem o token
6. **Renovação:** Token é renovado automaticamente
7. **Logout:** Token é invalidado no servidor

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login com username/password
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/me` - Obter dados do usuário atual

### Dados
- `GET /api/sync` - Obter todos os dados (requer autenticação)
- `POST /api/sync` - Salvar dados (requer autenticação)
- `POST /api/restore` - Restaurar dados (admin only)
- `DELETE /api/reset` - Resetar dados (admin only)

### Admin
- `GET /api/admin/users` - Listar usuários (admin only)

## 🚀 Deployment

### Produção
1. Editar `.env` com credenciais reais
2. Configurar `NODE_ENV=production`
3. Usar HTTPS com certificado válido
4. Configurar CORS com domínio específico
5. Fazer backup regular do banco de dados

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server /app
RUN npm install
EXPOSE 2006
CMD ["npm", "start"]
```

## 📈 Monitoramento

### Logs
- Servidor: Saída padrão (stdout)
- Banco de dados: Arquivo de log MySQL
- Auditoria: Tabela `activity_logs`

### Performance
- Índices em tabelas principais
- Connection pooling no MySQL
- Cache de dados no frontend

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"
- Verificar se MySQL está rodando
- Validar credenciais em `.env`
- Verificar permissões do usuário MySQL

### Erro: "Token expired"
- Fazer logout e login novamente
- Verificar relógio do servidor
- Limpar cookies do navegador

### Erro: "Access denied"
- Verificar role do usuário
- Confirmar permissões na tabela `users`
- Contactar administrador

## 📞 Suporte

Para questões ou problemas:
1. Verificar logs do servidor
2. Consultar documentação
3. Contactar administrador do sistema

## 📄 Licença

Proprietary - Uso exclusivo autorizado

## 🔄 Histórico de Versões

### v2.0 (Atual)
- ✅ Migração para MySQL
- ✅ Autenticação JWT + Bcrypt
- ✅ RBAC com 4 roles
- ✅ Sistema de auditoria
- ✅ Interface mantida compatível

### v1.0 (Legacy)
- SQLite key/value
- Autenticação simples
- Interface HTML/CSS/JS

---

**Desenvolvido com ❤️ para Wilson Control**
