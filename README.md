# API de Controle Financeiro Pessoal

## Problema

Muita gente perde o controle do próprio dinheiro por não registrar receitas e despesas, gastando mais do que percebe em lazer ou assinaturas. A API ajuda o usuário a organizar seus lançamentos e acompanhar seu saldo.

## Tecnologias

Node.js, Express 5, MongoDB (driver oficial `mongodb`), dotenv, cors e Docker (docker compose) para subir o banco.

## Como rodar

### Opção A: com Docker (Codespaces ou máquina com Docker)

1. Copie o modelo de variáveis de ambiente e, se quiser, troque a senha (ela aparece em dois lugares: `MONGO_PASSWORD` e dentro da `MONGODB_URI`):

   ```bash
   cp .env.example .env
   ```

2. Instale as dependências e suba tudo:

   ```bash
   npm install
   npm run dev
   ```

Os scripts `predev` e `prestart` rodam `docker compose up -d` antes da API, então o container do MongoDB sobe sozinho. Para parar o banco: `npm run db:stop`.

### Opção B: MongoDB instalado na máquina (sem Docker)

Crie um `.env` com:

```
MONGO_DB=controle_pessoal
MONGODB_URI=mongodb://localhost:27017/controle_pessoal
PORT=3000
```

Depois:

```bash
npm install
npm run dev:local
```

A API sobe em `http://localhost:3000` e libera CORS para `http://localhost:5173` (o front).

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o MongoDB no Docker e a API com reinício automático |
| `npm start` | Sobe o MongoDB no Docker e a API |
| `npm run dev:local` / `npm run start:local` | Só a API (use com MongoDB instalado) |
| `npm run db:start` / `npm run db:stop` | Liga e desliga o container do MongoDB |

## Estrutura (MVC)

```
├── server.js          conecta no MongoDB e sobe o Express
├── config/mongo.js    conexão com o banco
├── routes/            liga cada rota a uma função do controller
├── controllers/       lê a requisição e envia a resposta
├── services/          validações e regras de negócio
├── models/            acesso ao MongoDB (inserir, buscarTodas, buscarPorId, atualizar, remover)
├── middlewares/       tratamento de erros
├── utils/             ErroHttp e validação de ids
└── docker-compose.yml container do MongoDB
```

Fluxo de uma requisição: `routes → controllers → services → models → MongoDB`.

## Entidades

| Entidade | Campos |
|---|---|
| Usuário | `_id`, nome, email |
| Conta | `_id`, usuarioId, nome |
| Categoria | `_id`, usuarioId, nome, tipo (`normal`, `lazer` ou `reserva`) |
| Lançamento | `_id`, usuarioId, contaId, categoriaId, tipo (`receita` ou `despesa`), valor (em centavos), data, descricao |

- O `_id` é gerado pelo MongoDB (texto de 24 caracteres hexadecimais). As referências entre documentos (`usuarioId`, `contaId`, `categoriaId`) guardam esse texto.
- Valores em centavos: `30000` = R$ 300,00. Datas no formato `AAAA-MM-DD`.

Exemplo de documento da coleção `lancamentos`:

```json
{
  "_id": "6b00a9d16c524ebf299171ec",
  "usuarioId": "6b00a9d16c524ebf299171e1",
  "contaId": "6b00a9d16c524ebf299171e5",
  "categoriaId": "6b00a9d16c524ebf299171e8",
  "tipo": "despesa",
  "valor": 100000,
  "data": "2026-11-10",
  "descricao": "Mercado"
}
```

## Rotas

Prefixo: `/api/v1`. Listas respondem no envelope `{ "data": [ ... ], "meta": { "total": N } }`.

### Usuários

| Método | Rota | Descrição |
|---|---|---|
| POST | `/usuarios` | Cria usuário (nome, email) |
| GET | `/usuarios` | Lista usuários |
| GET | `/usuarios/:id` | Busca um usuário |
| PUT | `/usuarios/:id` | Atualiza (nome, email) |
| DELETE | `/usuarios/:id` | Exclui usuário |

### Contas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/contas` | Cria conta (usuarioId, nome) |
| GET | `/contas?usuarioId=...` | Lista contas (filtro opcional) |
| GET | `/contas/:id` | Busca uma conta |
| PUT | `/contas/:id` | Atualiza o nome |
| DELETE | `/contas/:id` | Exclui (409 se tiver lançamentos) |
| GET | `/contas/:id/saldo` | Saldo atual da conta |
| GET | `/contas/:id/extrato?de=AAAA-MM-DD&ate=AAAA-MM-DD` | Extrato por período |

### Categorias

| Método | Rota | Descrição |
|---|---|---|
| POST | `/categorias` | Cria categoria (usuarioId, nome, tipo opcional) |
| GET | `/categorias?usuarioId=...` | Lista categorias (filtro opcional) |
| GET | `/categorias/:id` | Busca uma categoria |
| PUT | `/categorias/:id` | Atualiza (nome, tipo) |
| DELETE | `/categorias/:id` | Exclui (409 se tiver lançamentos) |

### Lançamentos

| Método | Rota | Descrição |
|---|---|---|
| POST | `/lancamentos` | Registra receita/despesa (aplica as regras) |
| GET | `/lancamentos?usuarioId=...&contaId=...&categoriaId=...` | Lista lançamentos (filtros opcionais) |
| GET | `/lancamentos/:id` | Busca um lançamento |
| PUT | `/lancamentos/:id` | Edita (corpo completo, revalida as regras) |
| DELETE | `/lancamentos/:id` | Exclui lançamento |

## Erros

Todo erro responde em `{ "type": "...", "message": "..." }`:

| Status | type | Quando |
|---|---|---|
| 400 | `validation_error` | Campo faltando ou inválido, JSON malformado |
| 404 | `not_found` | Registro ou rota não encontrada |
| 409 | `conflict` | Excluir conta ou categoria que tem lançamentos |
| 422 | `business_rule_violation` | Uma regra de negócio foi violada |
| 500 | `internal_error` | Erro inesperado no servidor |

## Regras de negócio

- **Lazer ≤ 10% da renda mensal.** Uma despesa em categoria do tipo lazer é recusada (422) se o total de lazer do mês, com ela, ultrapassar 10% da renda do mês (soma das receitas do usuário em todas as contas).
- **Reserva mínima de 20%.** Despesas que não são de reserva não podem ultrapassar 80% da renda do mês, garantindo que 20% fiquem disponíveis para a reserva.
- **Sem saldo negativo.** Uma despesa é recusada (422) se deixar a conta com saldo menor que zero. Excluir ou editar uma receita também é bloqueado se isso deixar o saldo negativo.
- Ao editar um lançamento, as regras são conferidas como se o lançamento antigo não existisse.

## Limitações

- Não há autenticação: o usuário é identificado pelo `usuarioId` informado.
- Excluir um usuário não exclui as contas, categorias e lançamentos dele.