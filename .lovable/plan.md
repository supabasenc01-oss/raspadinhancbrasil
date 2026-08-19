# Plano de Auditoria Administrativa

Este plano descreve a implementação de um sistema de logs de auditoria para registrar alterações críticas realizadas por administradores, como mudanças em logotipos, favicons, banners e outras configurações globais.

## Objetivos
- Registrar quem alterou o quê e quando.
- Salvar o estado anterior e o novo estado dos dados (JSON diff).
- Exibir esses logs de forma clara no painel administrativo existente.

## Ações Técnicas

### 1. Backend (Server Functions)
- **Modificar `updateSystemSettings`**:
    - Antes de salvar, buscar o valor atual no banco para cada chave.
    - Registrar um log na tabela `admin_logs` contendo `action: 'UPDATE_SETTINGS'`, `old_data` e `new_data`.
- **Modificar `upsertBanner`**:
    - Se for uma atualização (`data.id` presente), buscar o banner atual.
    - Registrar log com `action: 'UPDATE_BANNER'`.
    - Se for uma criação, registrar com `action: 'CREATE_BANNER'`.
- **Modificar `deleteBanner`**:
    - Registrar log com `action: 'DELETE_BANNER'`.

### 2. Frontend (Painel Administrativo)
- **Melhorar `src/routes/_authenticated/admin/logs.tsx`**:
    - Garantir que a exibição dos campos `old_data` e `new_data` seja legível.
    - Adicionar mapeamento de nomes amigáveis para as ações registradas.

## Detalhes de Segurança
- Os logs serão gerados via `supabaseAdmin` dentro de `createServerFn`, garantindo que não possam ser forjados pelo cliente.
- O `actor_id` será capturado do contexto de autenticação do Supabase.

## Validação
- Realizar alterações de teste no logotipo e em um banner.
- Verificar se os novos registros aparecem na página de Logs com os valores antigos e novos corretos.
