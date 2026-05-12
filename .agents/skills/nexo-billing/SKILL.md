---
description: "Nexo Billing - Monorepo Turbo com Next.js, Verifactu e GoCardless. Fase final."
---

# Nexo Billing — Contexto do Projeto

## Status Atual
- **Fase:** Final de desenvolvimento (pré-beta)
- **Arquitetura:** Monorepo com Turbo + pnpm workspaces
- **Branch ativa:** `develop`
- **Decisão:** NÃO lançar beta ainda — preparar PWA primeiro

## Estrutura do Monorepo
nexo-billing/
├── apps/web/              ← Next.js App (frontend + API)
├── packages/
│   ├── ui/                ← shadcn/ui
│   ├── database/          ← Prisma + Supabase
│   ├── email/             ← Resend
│   └── verifactu/         ← XML, Zod schemas
├── verticals/             ← Módulos de negócio
├── docs/
├── infrastructure/
├── CLAUDE.md              ← REGRAS DO PROJETO
├── turbo.json
└── pnpm-workspace.yaml


## Stack Técnico
| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 App Router |
| Estilos | Tailwind + shadcn/ui |
| Banco | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Email | Resend |
| Cobrança | GoCardless (SEPA) |
| Faturação | Verifactu (XML/Zod) |
| Testes | Vitest |
| Deploy | Vercel |

## REGRAS OBRIGATÓRIAS
1. **TypeScript STRICT** — sem `any`
2. **ActionResult** para todos os erros
3. **Mensagens em espanhol**
4. **Commits só com autorização do Elias**
5. **Sempre consultar `CLAUDE.md`**

## Fases de Implementação
- ✅ FASE 1 — Verifactu (Tarefas 1.1 a 1.5)
- 🔄 FASE D — GoCardless (Tarefa D.2)
- 🔄 PWA — Foco atual (instalável, offline, touch-friendly)

## Bugs Conhecidos & Fixes
| Bug | Status |
|-----|--------|
| `createItemQuick()` sem try/catch | ✅ Fix (ActionResult) |
| `RectificativaButton` null-check | ✅ Fix (`ae3fa0a`) |
| Prisma Client no Vercel | ✅ Fix (`3227fed`) |

## Comandos Úteis
```bash
pnpm install     # Instalar deps
pnpm dev         # Dev mode
pnpm build       # Build
pnpm test        # Testes
pnpm typecheck   # TypeScript


## Decisões do Elias (NUNCA ignorar)
- Não lançar beta ainda
- Preparar PWA primeiro
- Supabase como backend
- Espanhol para erros
- Strict TypeScript
- Commits só com autorização
