# Plano de Implementação: Criação de 4 Raspadinhas Premium

O objetivo é criar 4 novas raspadinhas com 10 prêmios cada, incluindo itens físicos (Batedeira, Microondas, Geladeira) e prêmios em dinheiro (PIX), conforme solicitado.

## Ações

### 1. Banco de Dados (Migração SQL)
- Criar uma nova migração em `supabase/migrations/` para inserir as 4 raspadinhas:
    - **Mega PIX**: Focada em prêmios instantâneos via PIX (R$ 50 a R$ 5.000).
    - **Cozinha dos Sonhos**: Focada em eletrodomésticos (Batedeira, Microondas, Air Fryer).
    - **Lar Premium**: Focada em prêmios maiores (Geladeira, TV, Lavadora).
    - **Sorte Tech**: Focada em eletrônicos (Smartphone, Fone, Tablet).
- Cada raspadinha terá exatamente 10 faixas de premiação com probabilidades realistas.

### 2. Assets (Placeholder)
- Como não temos imagens reais para cada uma agora, usarei URLs de placeholder premium que condizem com a identidade visual (Preto/Dourado/Ciano) ou manterei as referências para que o administrador possa trocar depois.

### 3. Validação
- Verificar se as raspadinhas aparecem na Home e na página `/raspadinhas`.

## Detalhes Técnicos
- Utilização de `quantity_total` e `quantity_remaining` para controle de estoque.
- Probabilidades ajustadas para somar menos de 100%, garantindo a lógica de "Sem prêmio".
- Inclusão de `slug` único para cada rota.
