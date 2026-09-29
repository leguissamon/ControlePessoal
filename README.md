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