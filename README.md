## Problema

Muita gente perde o controle do próprio dinheiro por não registrar receitas e despesas, gastando mais do que percebe em lazer ou assinaturas. A API ajuda o usuário a organizar seus lançamentos e acompanhar seu saldo.

## Como rodar

\`\`\`bash
npm install
npm start
\`\`\`

Os dados ficam em memória (arrays) e são apagados quando o servidor reinicia. Porta padrão: 3000.

## Entidades

- **Usuário**: id, nome, email
- **Conta**: id, usuarioId, nome
- **Categoria**: id, usuarioId, nome, tipo (normal, lazer ou reserva)
- **Lançamento**: id, usuarioId, contaId, categoriaId, tipo (receita/despesa), valor (em centavos), data, descricao

> Valores em centavos: `30000` = R$ 300,00. Datas no formato `AAAA-MM-DD`.

### Usuários

| Método | Rota | Descrição |
|---|---|---|
| POST | /usuarios | Cria usuário (nome, email) |
| GET | /usuarios | Lista usuários |
| GET | /usuarios/:id | Busca um usuário |
| PUT | /usuarios/:id | Atualiza (nome, email) |
| DELETE | /usuarios/:id | Exclui usuário |


### Contas

| Método | Rota | Descrição |
|---|---|---|
| POST | /contas | Cria conta (usuarioId, nome) |
| GET | /contas?usuarioId=1 | Lista contas (filtro opcional) |
| GET | /contas/:id | Busca uma conta |
| PUT | /contas/:id | Atualiza o nome |
| DELETE | /contas/:id | Exclui (409 se tiver lançamentos) |
| GET | /contas/:id/saldo | Saldo atual da conta |
| GET | /contas/:id/extrato?de=AAAA-MM-DD&ate=AAAA-MM-DD | Extrato por período |

### Categorias

| Método | Rota | Descrição |
|---|---|---|
| POST | /categorias | Cria categoria (usuarioId, nome, tipo opcional) |
| GET | /categorias?usuarioId=1 | Lista categorias (filtro opcional) |
| GET | /categorias/:id | Busca uma categoria |
| PUT | /categorias/:id | Atualiza (nome, tipo) |
| DELETE | /categorias/:id | Exclui (409 se tiver lançamentos) |

### Lançamentos

| Método | Rota | Descrição |
|---|---|---|
| POST | /lancamentos | Registra receita/despesa (aplica as regras) |
| GET | /lancamentos?contaId=1&categoriaId=2 | Lista lançamentos (filtros opcionais) |
| GET | /lancamentos/:id | Busca um lançamento |
| DELETE | /lancamentos/:id | Exclui lançamento |

## Regras de negócio

1. **Lazer ≤ 10% da renda mensal.** Uma despesa em categoria do tipo `lazer` é recusada (422) se o total de lazer do mês, com ela, ultrapassar 10% da renda do mês (soma das receitas do usuário em todas as contas).
2. **Reserva mínima de 20%.** Despesas que não são de reserva não podem ultrapassar 80% da renda do mês, garantindo que 20% fiquem disponíveis pra reserva.
3. **Sem saldo negativo.** Uma despesa é recusada (422) se deixar a conta com saldo menor que zero. Excluir uma receita também é bloqueado se isso deixar o saldo negativo.