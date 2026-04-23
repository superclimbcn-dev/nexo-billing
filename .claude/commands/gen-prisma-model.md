---
description: Genera un modelo Prisma con los campos multi-tenant estándar de Nexo Billing
argument-hint: <nombre-del-modelo> [vertical-opcional]
---

# Generar modelo Prisma: $ARGUMENTS

Genera un nuevo modelo Prisma siguiendo las convenciones del proyecto.

## Reglas inviolables

Todo modelo nuevo en `infrastructure/prisma/schema.prisma` DEBE tener:

1. **`id String @id @default(cuid())`** — identificador público opaco
2. **`tenantId String`** — multi-tenancy obligatorio
3. **`createdAt DateTime @default(now())`**
4. **`updatedAt DateTime @updatedAt`**
5. **Índice** `@@index([tenantId])` como mínimo
6. **`@@map("snake_case_name")`** — nombre de tabla SQL en snake_case

## Pasos

1. **Preguntar al usuario** los campos específicos del modelo si no los ha indicado.

2. **Generar el modelo** en `infrastructure/prisma/schema.prisma` al final del archivo.

3. **Generar la política RLS** en una nueva migración SQL en `infrastructure/supabase/migrations/`:

   ```sql
   -- Enable RLS
   ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;

   -- Tenant isolation policy
   CREATE POLICY "tenant_isolation" ON <tabla>
     FOR ALL
     USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
     WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
   ```

4. **Si el modelo pertenece a un vertical**, crear también el archivo Zod schema correspondiente en `verticals/<vertical>/src/schemas.ts`.

5. **Correr** `pnpm prisma generate` para actualizar los tipos.

6. **No correr** `pnpm prisma migrate dev` automáticamente. Avisar al usuario para que revise la migración antes.

## Ejemplo de salida esperada

Para `/gen-prisma-model Supplier construccion`:

```prisma
model Supplier {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  nif         String
  email       String?
  phone       String?
  address     String?
  // ... campos específicos según el usuario indique ...

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, nif])
  @@map("suppliers")
}
```
