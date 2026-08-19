# Plano de Implementação: Bloco de Prova Social e Rostos de Ganhadores

O usuário solicitou uma reformulação do bloco de "balões" para algo mais dinâmico e focado em rostos de pessoas, similar a um exemplo enviado (uma grade de avatares com nomes/prêmios). O objetivo é aumentar o dinamismo e a credibilidade da plataforma "RaspaPremium".

## Alterações

### Componentes Frontend

- **Refatorar `UserFloatingBubbles.tsx`**: Transformar o comportamento de "bolhas flutuantes" dispersas em um componente de "Prova Social Lateral" ou "Grade de Ganhadores" mais estruturado, focando em avatares circulares de alta visibilidade, conforme a referência visual.
- **Implementar `TrustGrid` na Home**: Adicionar uma seção ou elemento lateral na `src/routes/index.tsx` que exiba uma nuvem/grade de rostos de ganhadores reais para passar confiança imediata.
- **Melhorar Animações**: Usar `framer-motion` para criar um efeito de entrada/saída mais suave e profissional, fugindo do visual "flutuante" genérico.

### Design e UX

- **Padrão 2026**: Manter o uso de bordas douradas/neon, fundos escuros profundos e brilhos sutis.
- **Responsividade**: Garantir que o bloco de rostos não obstrua a jogabilidade no mobile, possivelmente movendo-o para o final da hero ou transformando-o em um carrossel horizontal compacto.

## Detalhes Técnicos

- Utilizar os ativos de imagem já existentes (`user1` a `user8`).
- Criar uma estrutura de "Faces Cloud" (Nuvem de Rostos) com tamanhos variados para dar profundidade.
- Adicionar badges de "Verificado" ou "PIX Enviado" junto aos rostos.
