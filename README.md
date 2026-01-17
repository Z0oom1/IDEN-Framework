# 📦 Sistema de Controle Operacional – Mapa Cego Digital

**Autor:** Caio Rod
**Tipo:** Software corporativo interno (Electron + Node.js)
**Status:** Produção / Uso empresarial

---

## 🎯 Visão Geral

Este sistema foi desenvolvido para **digitalizar e controlar processos operacionais que tradicionalmente eram manuais**, com foco especial no **Mapa Cego Digital**, controle de caminhões, pátio, conferência e dashboards operacionais.

O projeto foi criado **do zero**, baseado em um processo real de empresa de porte médio, e **não é um sistema genérico**. Ele reflete regras de negócio específicas, exceções operacionais e necessidades do chão de fábrica.

---

## 🧠 Conceito Central do Sistema

O sistema se baseia em três pilares:

1. **Persistência flexível via JSON** (armazenado no banco)
2. **Sincronização em tempo real** entre máquinas (Socket.IO)
3. **Software instalado localmente** (Electron), não apenas um site

Isso permite:

* rápida adaptação do processo
* menos migrações de banco
* controle total do ambiente

---

## 🗂️ Estrutura Geral do Projeto

```
/backend
 ├── server.js          # Servidor principal (Express + Socket + SQLite)
 ├── database.sqlite    # Banco local

/frontend
 ├── index.html
 ├── js/
 │   ├── *.js           # Lógica do sistema no front
 ├── css/

/electron
 ├── main.js            # Bootstrap do Electron
```

---

## 🧩 Backend – Como Funciona

### 🔹 Tecnologias

* Node.js
* Express
* SQLite
* Socket.IO

### 🔹 Banco de Dados

O banco **não usa tabelas rígidas para regras de negócio**.

#### Tabela `app_data`

Usada para armazenar **dados operacionais em JSON**.

```
key   -> identifica o tipo de dado
value -> JSON serializado
```

Exemplos de `key`:

* `aw_caminhoes_v2`
* `mapas_cegos_v3`
* `presets_user_<id>`

👉 **RESET do sistema apaga apenas essa tabela.**

---

#### Tabela `users`

Controle de usuários do sistema.

Campos importantes:

* `username`
* `password`
* `role` (Administrador, Encarregado, user)
* `sector`
* `token`

---

#### Tabela `dash_layouts`

Guarda **apenas layouts de dashboard por usuário**.

⚠️ **Essa tabela NÃO é apagada no reset.**

---

## 🔐 Autenticação

* Login gera um **token simples**
* Token é salvo no banco
* Todas as rotas protegidas usam middleware `requireAuth`

⚠️ Importante:
Este sistema **não usa JWT/bcrypt por decisão de simplicidade operacional**, mas a estrutura permite evolução futura.

---

## 🔄 Sincronização em Tempo Real

Usando Socket.IO.

Eventos principais:

* `pedir_dados`
* `atualizar_sistema`

Sempre que um dado é salvo:

* backend emite evento
* todos os clientes atualizam automaticamente

Isso garante:

* zero conflito de tela
* visão consistente da operação

---

## 📊 Dashboard

### Rota principal

```
POST /api/dashboard/query
```

Modos:

* **Quantidade** → dados de caminhões no pátio
* **Divergência** → leitura do mapa cego digital

Toda a lógica de filtro ocorre **em memória**, diretamente sobre o JSON.

Isso facilita:

* alteração de regras
* inclusão de novos filtros
* debug rápido

---

## 🧠 Mapa Cego Digital (Ponto Crítico)

Este é o **núcleo do sistema**.

* Substitui processo manual
* Compara quantidades
* Identifica divergências automaticamente

Estrutura típica:

```
mapa = {
  date,
  placa,
  setor,
  rows: [
    { desc, qty, qty_nf }
  ]
}
```

A divergência é calculada **dinamicamente**, sem pré-processamento.

---

## 🖥️ Electron

O sistema roda como:

* software instalado
* ambiente controlado
* versão única por máquina

Vantagens:

* não depende de navegador
* menos erro de ambiente
* mais confiança corporativa

---

## 🛠️ Como Alterar / Estender o Sistema

### ➕ Adicionar novo tipo de dado

1. Escolha uma nova `key`
2. Salve o JSON via `/api/sync`
3. Leia via `/api/sync` no front

Não é necessário:

* criar tabela
* migrar banco

---

### ➕ Alterar regras de negócio

* As regras estão **no JavaScript**, não no banco
* Modifique filtros, comparações e cálculos diretamente

Isso é intencional.

---

### ➕ Adicionar nova tela

* Criar HTML no frontend
* JS separado
* Consumir API existente

---

## ⚠️ Boas Práticas ao Mexer no Código

* NÃO alterar estrutura dos JSONs sem mapear impacto
* NÃO apagar keys antigas sem migração
* Sempre testar com dois clientes abertos
* Evitar lógica pesada dentro do banco

---

## 🚀 Possíveis Evoluções

* Logs persistentes
* Backup automático
* Exportação CSV/Excel
* Controle de permissões mais granular
* Integração com hardware (balança, leitor)

---

## 🧾 Observação Final

Este sistema **não é um ERP**.

Ele é um **software operacional sob medida**, criado para resolver problemas reais que ERPs não cobrem bem.

Qualquer programador que for mexer aqui deve entender:

> a regra de negócio vem antes da estrutura técnica

---

## ✍️ Assinatura

Desenvolvido por **Caio Rod**
Sistema proprietário – uso corporativo interno
