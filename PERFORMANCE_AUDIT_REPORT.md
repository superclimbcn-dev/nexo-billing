# Relatório de Auditoria de Performance

**Projeto:** Nexo Billing (nexo-billing-main)
**Data:** 24 de Julho de 2026
**Analisado por:** MiMo Code Agent
**Status:** APENAS LEITURA — Nenhuma alteração foi feita

---

## 1. Estrutura do Projeto

### Contagem de Arquivos
| Tipo | Quantidade |
|------|-----------|
| `.tsx` | 174 |
| `.ts` | 158 |
| `.jsx` | 0 |
| `.js` | 1 |
| **Total** | **333** |

### Arquitetura Monorepo
```
nexo-billing/
├── apps/web/          ← Next.js 15 App Router (142 .tsx, principais)
├── packages/
│   ├── core-ui/       ← 25 componentes handmade (0 externos)
│   ├── core-billing/  ← verifactu/ (23 arquivos .ts)
│   ├── core-auth/     ← Supabase Auth helpers
│   └── core-utils/    ← Utilitários compartilhados
├── verticals/         ← 4 verticais (apenas stubs .gitkeep)
├── infrastructure/prisma/ ← Schema 1016 linhas, 25 modelos
└── node_modules/      ← 1.3 GB
```

### Rotas Principais (App Router)
- `(app)/` — Dashboard, Facturas, Clientes, Productos, Presupuestos, Recibos, Gastos, Tesoreria, Recurrentes, Settings, Export, Impuestos
- `(auth)/` — Login, Signup, Check-email, Auth-error
- `(onboarding)/` — Fluxo de configuração (cuenta, empresa, datos-fiscales, vertical, configuracion)
- `(demo)/` — Spoiler pages
- `api/` — 15 endpoints (facturas, gocardless, health, import, presupuestos, recibos, recurring, stripe)
- Blog, FAQ, Precios, Contacto, Terminos, Privacidad, Cookies

---

## 2. Bundle Analysis

### Dependências Principais
| Pacote | Versão | Tamanho Estimado |
|--------|--------|------------------|
| `next` | ^15.3.0 | ~200-400 KB |
| `react` / `react-dom` | ^19.0.0 | ~120-140 KB |
| `@react-pdf/renderer` | ^4.5.1 | **~300-500 KB** ⚠️ |
| `@supabase/supabase-js` | ^2.47.0 | ~150 KB |
| `stripe` | ^22.1.1 | ~100 KB |
| `sanity` / `next-sanity` | ^5.25.1 / ^12.4.5 | ~200-300 KB |
| `@portabletext/react` | ^6.2.0 | ~50 KB |
| `gocardless-nodejs` | ^8.1.0 | ~30 KB |
| `resend` | ^6.12.3 | ~50 KB |
| `jszip` | ^3.10.1 | ~100 KB |
| `papaparse` | ^5.5.3 | ~30 KB |
| `lucide-react` | ^1.14.0 | Tree-shakeável |
| `zod` | ^3.24.0 | ~60 KB |
| `@serwist/next` | ^9.5.11 | Service Worker |

### Bibliotecas Pesadas no Bundle Client ⚠️
1. **@react-pdf/renderer** (~300-500 KB) — Usado em 15 arquivos, potencialmente importado no client-side
2. **sanity + next-sanity** (~200-300 KB) — Cliente Sanity pode vazar para client bundle
3. **@supabase/supabase-js** (~150 KB) — Pode ser importado em client components
4. **stripe** (~100 KB) — Usado em server actions, mas pode vazar

### node_modules: 1.3 GB

---

## 3. Server vs Client Components

| Métrica | Valor |
|---------|-------|
| Total Client Components (`'use client'`) | **61** |
| Total de páginas `.tsx` em `app/` | 142 |
| **Proporção Client** | **~43%** ⚠️ |

### Análise
- **61 Client Components** é uma quantidade significativa para um projeto Next.js 15
- Muitos são componentes de formulário e interação (esperado), mas alguns podem ser convertidos para Server Components
- Componentes como `app-sidebar.tsx`, `mobile-header.tsx`, `mobile-menu.tsx` são necessariamente client
- Formulários (`invoice-form.tsx`, `client-form.tsx`, `quote-form.tsx`, etc.) são justificavelmente client

---

## 4. Code Splitting

### Dynamic Imports
- **Dynamic imports encontrados:** 0 ⚠️
- Nenhum uso de `next/dynamic` ou `dynamic()` detectado

### Bibliotecas Pesadas sem Code Splitting
1. **@react-pdf/renderer** — Importado diretamente, sem lazy loading
2. **sanity** — Cliente pode estar sendo bundle inteiro
3. **jszip** — Usado em export, poderia ser lazy loaded
4. **papaparse** — Usado em import CSV, poderia ser lazy loaded

---

## 5. Otimizações React

| Padrão | Uso |
|--------|-----|
| `React.memo` | 0 |
| `useMemo` | ~4 |
| `useCallback` | ~4 |
| **Total** | **~8 usos** ⚠️ |

### Context API
- **Contexts encontrados:** 0
- Nenhum `createContext` ou `useContext` detectado no app

### Análise
- Uso mínimo de memoização (8 usos em 174 componentes)
- Não há Contexts customizados — dados são passados via props ou server components
- Isso é **bom** para performance (menos overhead de Context), mas pode indicar que alguns componentes re-renderizam desnecessariamente

---

## 6. Data Fetching

### Padrão: **Server-First** ✅
- Maioria das páginas usa Server Components com `async` functions
- Server Actions (`'use server'`) para mutações — **29 arquivos** com server actions
- Fetch direto no server via Prisma (sem API layer desnecessária)

### API Routes (15 endpoints)
```
/api/facturas/[id]/email     ← Envio de email
/api/gocardless/webhook      ← Webhook GoCardless
/api/health                  ← Health check
/api/import/csv              ← Importação CSV
/api/presupuestos/[id]/email ← Envio de email
/api/presupuestos/[id]/pdf   ← Geração PDF
/api/recibos/[id]/email      ← Envio de email
/api/recibos/[id]/pdf        ← Geração PDF
/api/recurring/emit          ← Emissão recorrente
/api/stripe/webhook          ← Webhook Stripe
```

### Data Fetching Patterns
- **Server Components** com Prisma queries diretas ✅
- **Server Actions** para mutations ✅
- **API Routes** apenas para webhooks e operações que precisam de request raw
- **Client-side fetch** em poucos componentes (actions de email, emit, import)

### Oportunidades
- Todas as queries Prisma filtram por `tenantId` (multi-tenant correto) ✅
- Paginação implementada em listagens ✅
- Não há uso de SWR/React Query — dados são refetched via `revalidatePath` ✅

---

## 7. Build

### Configuração Next.js
- `typescript.ignoreBuildErrors: true` ⚠️ — Type checking roda separadamente
- `transpilePackages: ['@nexo/core-ui']` ✅
- `serverExternalPackages: ['@prisma/client']` ✅
- `outputFileTracingRoot` configurado para monorepo ✅
- Service Worker via Serwist ✅

### Scripts de Build
```json
"vercel-build": "pnpm --filter @nexo/prisma prisma:migrate:deploy && turbo build"
```
- Migrations automáticas antes do build ✅
- Turbo para build paralelo ✅

### Observações
- `.next/` directory não existe no repo (gerado no build)
- Não foi possível rodar build (sem dependências instaladas no .next)
- **Tempo de build:** Não medido (requer `pnpm install` completo + build)

---

## 8. Dependências Principais

### Runtime Dependencies
| Pacote | Versão | Categoria |
|--------|--------|-----------|
| `next` | ^15.3.0 | Framework |
| `react` / `react-dom` | ^19.0.0 | UI |
| `@supabase/supabase-js` | ^2.47.0 | Auth/BD |
| `@react-pdf/renderer` | ^4.5.1 | PDFs |
| `stripe` | ^22.1.1 | Pagamentos |
| `gocardless-nodejs` | ^8.1.0 | SEPA |
| `resend` | ^6.12.3 | Email |
| `sanity` / `next-sanity` | ^5.25.1 / ^12.4.5 | CMS |
| `@portabletext/react` | ^6.2.0 | CMS Rendering |
| `zod` | ^3.24.0 | Validação |
| `lucide-react` | ^1.14.0 | Ícones |
| `jszip` | ^3.10.1 | Export ZIP |
| `papaparse` | ^5.5.3 | CSV parsing |
| `@serwist/next` | ^9.5.11 | PWA/Service Worker |
| `server-only` | ^0.0.1 | Server Components guard |

### Dev Dependencies
| Pacote | Versão |
|--------|--------|
| `typescript` | ^5.6.3 |
| `tailwindcss` | ^4.1.4 |
| `@playwright/test` | ^1.60.0 |
| `sharp` | ^0.34.5 |
| `turbo` | ^2.2.3 |

---

## 9. Diagnóstico Geral (TOP 5 PROBLEMAS)

### 1. ⚠️ **@react-pdf/renderer no Bundle Client** (GRAVE)
- Biblioteca de ~300-500 KB está sendo importada em 15 arquivos
- Pode estar vazando para o client bundle se usada em componentes client
- **Impacto:** Bundle inicial inflado, LCP ruim

### 2. ⚠️ **Zero Dynamic Imports** (MODERADO)
- Nenhum uso de `next/dynamic` para code splitting
- Bibliotecas pesadas (jszip, papaparse, sanity) são importadas estaticamente
- **Impacto:** Bundle monolítico, carregamento desnecessário

### 3. ⚠️ **61 Client Components (43%)** (MODERADO)
- Proporção alta de Client Components
- Alguns podem ser convertidos para Server Components
- **Impacto:** Mais JS enviado ao client, mais re-renders

### 4. ⚠️ **Memoização Mínima** (BAIXO-MODERADO)
- Apenas 8 usos de useMemo/useCallback em 174 componentes
- Componentes com listas e formulários podem se beneficiar
- **Impacto:** Re-renderizações desnecessárias em interações

### 5. ⚠️ **Sanity Client Potencialmente Pesado** (BAIXO)
- `sanity` + `next-sanity` + `@portabletext/react` = ~350 KB
- Usado apenas para blog — pode estar impactando bundle do app inteiro
- **Impacto:** Bundle inflado para funcionalidade secundária

---

## 10. Recomendações Imediatas

### Alta Prioridade
1. **Lazy load `@react-pdf/renderer`** — Usar `next/dynamic` para importar apenas quando necessário (rotas de PDF)
2. **Lazy load `jszip` e `papaparse`** — Usar dynamic imports nas rotas de export/import
3. **Separar Sanity do bundle principal** — Considerar mover blog para subdomain ou page externa

### Média Prioridade
4. **Auditar Client Components** — Identificar quais podem virar Server Components
5. **Adicionar React.memo** em componentes de lista (invoice-row, client-row, etc.)
6. **Implementar Loading States** — Adicionar `loading.tsx` nas rotas principais
7. **Adicionar Error Boundaries** — Adicionar `error.tsx` nas rotas críticas

### Baixa Prioridade
8. **Tree-shaking de lucide-react** — Verificar se apenas ícones usados estão no bundle
9. **Analisar bundle com `@next/bundle-analyzer`** — Para ter números exatos
10. **Considerar React Compiler** — Next.js 15 suporta automatic memoization

---

## Observações Finais

### Pontos Fortes ✅
- Arquitetura Server-First bem implementada
- Multi-tenant com RLS correto
- Server Actions para mutations (padrão moderno)
- Design system próprio (sem dependências externas pesadas de UI)
- Monorepo bem organizado com Turborepo
- Service Worker para PWA

###Áreas de Melhoria
- Bundle splitting para bibliotecas pesadas
- Mais Server Components onde possível
- Loading e Error boundaries
- Memoização em componentes de lista

---

**Próximo Passo:** Quando autorizado, posso implementar as otimizações de alta prioridade (lazy loading de PDF, JSZip, PapaParse).
