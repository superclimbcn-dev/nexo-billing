# Bundle Analysis Real — Client Side

**Gerado por:** @next/bundle-analyzer
**Data:** 24 Jul 2026
**Build:** Next.js 15.5.15

---

## Tamanho Total

| Métrica | Valor |
|---------|-------|
| **Stat (antes de tree-shaking)** | 4,186 KB |
| **Parsed (após tree-shaking)** | **1,383 KB** |
| **Gzip (transferido via rede)** | **427 KB** |

> **Stat** = tamanho bruto dos módulos importados
> **Parsed** = tamanho após tree-shaking e minification
> **Gzip** = tamanho real transferido ao navegador (HTTP)

---

## Top 15 Chunks (Parsed)

| # | Chunk | Parsed | Gzip |
|---|-------|--------|------|
| 1 | `framework-ea89cb5c61b1d741.js` | 185.3 KB | 58.4 KB |
| 2 | `4120-60933074d8dfea43.js` | 173.1 KB | 46.5 KB |
| 3 | `6374-c36827ca1ceef5c6.js` | 172.0 KB | 47.7 KB |
| 4 | `bf9e8aec-afea16072c2d4cf4.js` | 169.0 KB | 53.0 KB |
| 5 | `main-5ef97f69daa0928e.js` | 129.5 KB | 37.4 KB |
| 6 | `8708-25edf162f8b0b198.js` | 55.9 KB | 12.8 KB |
| 7 | `5836ce91-29b8fb172624b4b9.js` | 51.8 KB | 11.6 KB |
| 8 | `7428-38a34a4efcff1a2a.js` | 51.3 KB | 17.8 KB |
| 9 | `sw.js` (Service Worker) | 50.7 KB | 14.7 KB |
| 10 | `2531-9c71d8a46acf7f75.js` | 26.2 KB | 8.2 KB |
| 11 | `page-46b19c94b0af570f.js` | 20.2 KB | 5.8 KB |
| 12 | `6273-7e5f934ca8168a81.js` | 17.7 KB | 4.4 KB |
| 13 | `4166-9ce7e87a3a29e52b.js` | 15.5 KB | 5.9 KB |
| 14 | `page-8f03996e02e5ca9d.js` | 15.2 KB | 4.9 KB |
| 15 | `page-12c689131d5cb7cf.js` | 14.8 KB | 4.2 KB |

**Chunks base (carregam em TODAS as páginas):**
- `framework`: 58.4 KB gzip (React + React DOM)
- `main`: 37.4 KB gzip (Next.js runtime)
- `polyfills`: ~32 KB gzip
- **Total base: ~128 KB gzip** — carregado em toda visita

---

## Top Pacotes (Stat Size — antes de tree-shaking)

| # | Pacote | Stat Size | Módulos |
|---|--------|-----------|---------|
| 1 | **next** | 5,375 KB | 312 |
| 2 | **react-dom** | 1,595 KB | 6 |
| 3 | **zod** | 597 KB | 10 |
| 4 | **lucide-react** | 201 KB | 60 |
| 5 | **tailwind-merge** | 200 KB | 2 |
| 6 | **serwist** | 512 KB | 8 |
| 7 | **@supabase/\*** | 3,236 KB | ~60 |
| 8 | **@portabletext/react** | 33 KB | 2 |

---

## Análise de Duplicações

**42 módulos duplicados encontrados** (>5KB cada):

| Módulo | Tamanho | Em quantos chunks |
|--------|---------|-------------------|
| `dist` (Next.js interno) | 577 KB | 16 chunks |
| `client` (Supabase) | 433 KB | 4 chunks |
| `components` (Next.js) | 375 KB | 3 chunks |
| `module` (Supabase Auth) | 141 KB | 2 chunks |
| `compiled` (Next.js) | 99 KB | 2 chunks |

**Impacto:** ~1.5 MB de módulos duplicados entre chunks (stat size).

---

## O que NÃO está no Client Bundle ✅

| Pacote | Status |
|--------|--------|
| `@react-pdf/renderer` | **Server-only** (não aparece no client) |
| `@prisma/client` | **Server-only** (`serverExternalPackages`) |
| `stripe` | **Server-only** |
| `gocardless-nodejs` | **Server-only** |
| `resend` | **Server-only** |
| `jszip` | **Server-only** |
| `papaparse` | **Server-only** |
| `sanity` / `next-sanity` | **Server-only** (apenas no blog) |

---

## O que REALMENTE está no Client Bundle

### Problemas Reais

1. **Supabase Client (~433 KB parsed)** — O maior vilão. Inclui:
   - `GoTrueClient.js`: 215 KB (autenticação)
   - `RealtimeClient.js`: 23 KB
   - `RealtimeChannel.js`: 29 KB
   - `phoenix.mjs`: 53 KB (WebSocket)
   - Múltiplos módulos de auth/storage/functions

2. **Next.js Runtime (~185 KB parsed)** — Framework, necessário mas pesado

3. **React DOM (~130 KB parsed)** — Necessário, não otimizável

4. **Zod (~60 KB parsed)** — Validação de schemas, tree-shakeável mas importado em vários lugares

5. **Lucide React (~200 KB stat, menos após tree-shaking)** — 60 ícones importados

6. **Tailwind Merge (~100 KB parsed)** — Utility para merges de classes Tailwind

---

## Diagnóstico

### A lentidão NÃO é do bundle client
- **427 KB gzip** é um bundle razoável para um SaaS com auth, real-time, e 60+ páginas
- O carregamento inicial (~128 KB gzip) é aceitável
- **58 KB gzip** para React+React DOM é normal

### A lentidão provavelmente é de:
1. **Supabase Realtime** — Conexões WebSocket persistentes
2. **Queries Prisma no server** — Se o server demora, o client espera
3. **Middleware** — `refreshSession()` roda em CADA request
4. **Service Worker** — `sw.js` (50 KB) pode estar interceptando requests
5. **Falta de loading states** — Usuário vê tela branca enquanto server processa

---

## Recomendações

### Otimizações de Bundle (impacto moderado)
1. **Lazy load Supabase Realtime** — Só carregar quando necessário (~80 KB economy)
2. **Dynamic import de Zod** — Carregar schemas sob demanda
3. **Tree-shake Lucide** — Verificar se todos os 60 ícones são usados

### Otimizações de Performance (impacto ALTO) ← PRIORIDADE
1. **Adicionar `loading.tsx`** — Skeletons nas rotas principais
2. **Otimizar queries Prisma** — Adicionar índices, reduzir `include`
3. **Cache de middleware** — Evitar `refreshSession()` em cada request
4. **Streaming SSR** — Next.js 15 suporta, usar ` Suspense`

---

## Conclusão

**O bundle client não é o problema principal.** 427 KB gzip é aceitável. A lentidão percebida vem de:
- Server-side: queries Prisma + middleware overhead
- Runtime: Supabase Realtime + Service Worker
- UX: Falta de loading states (tela branca = sensação de lentidão)

**Foco:** Adicionar loading states + otimizar queries server-side terá mais impacto que qualquer otimização de bundle.
