---
description: Crea un nuevo vertical en verticals/<nombre> con la estructura estándar
argument-hint: <nombre-del-vertical>
---

# Crear nuevo vertical: $ARGUMENTS

Eres el arquitecto del proyecto Nexo Billing. Tu tarea es crear un vertical completo siguiendo la arquitectura ya establecida.

## Pasos obligatorios

1. **Leer primero**:
   - `/CLAUDE.md` (raíz)
   - `/verticals/limpieza/CLAUDE.md` (como referencia del patrón)
   - `/infrastructure/prisma/schema.prisma`

2. **Crear la estructura del vertical en `verticals/$ARGUMENTS/`**:
   ```
   verticals/$ARGUMENTS/
   ├── src/
   │   ├── index.ts
   │   ├── components/
   │   ├── server-actions/
   │   ├── schemas.ts
   │   └── types.ts
   ├── CLAUDE.md
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

3. **Generar `CLAUDE.md` del vertical** con las secciones estándar:
   - Qué resuelve el vertical
   - Entidades del dominio específicas
   - Flujos específicos
   - UI específica
   - Rutas Next.js
   - Integraciones específicas
   - Qué NO hacer

   **Pregunta al usuario** qué entidades y flujos específicos necesita el vertical antes de rellenar. No inventes.

4. **Actualizar el enum `Vertical` en** `packages/core-types/src/vertical.ts` añadiendo el nuevo valor.

5. **Crear el middleware de ruta protegida** en `apps/web/src/middleware-verticals/$ARGUMENTS.ts` que valide que el tenant tiene este vertical activado.

6. **No tocar el core-billing**. Si el vertical necesita algo que no existe en el core, pregunta al usuario antes de añadirlo.

7. **Correr** `pnpm install` y `pnpm typecheck` al terminar.

## Principios inviolables

- El vertical importa del core, nunca al revés.
- Toda nueva tabla en Prisma tiene `tenantId` y política RLS.
- Datos específicos del sector en `Invoice.sectorMetadata` siempre que sea posible. Tablas nuevas solo si hay relaciones complejas.
- UI usa `packages/core-ui` como base.
