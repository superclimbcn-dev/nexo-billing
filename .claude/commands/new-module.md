---
description: Crea un nuevo módulo dentro de un paquete existente con estructura estándar
argument-hint: <paquete> <nombre-modulo>
---

# Crear módulo en paquete: $ARGUMENTS

Crea un nuevo módulo siguiendo la convención `packages/<paquete>/src/<feature>/` del proyecto.

## Reglas

1. **Leer primero**:
   - `/CLAUDE.md` raíz
   - `/packages/<paquete>/CLAUDE.md` si existe
   - Archivos existentes del paquete para entender el estilo

2. **Crear la estructura**:
   ```
   packages/<paquete>/src/<feature>/
   ├── types.ts
   ├── schemas.ts        # Zod schemas
   ├── service.ts        # Lógica de negocio
   ├── <feature>.test.ts # Tests
   └── index.ts          # Barrel export del módulo
   ```

3. **Reglas obligatorias**:
   - TypeScript strict, sin `any`
   - Validación de entradas con Zod
   - Tests unitarios (happy path + al menos 3 casos de error)
   - JSDoc en funciones públicas
   - Exportar desde `src/index.ts` del paquete solo lo que es API pública

4. **Preguntar al usuario** qué responsabilidades tendrá el módulo antes de implementar.

5. **Al terminar**:
   - `pnpm typecheck`
   - `pnpm test <paquete>`
   - Commit con mensaje `feat(<paquete>): add <feature> module`
