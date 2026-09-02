---
name: sdd-workflow
description: >-
  Guía y protocolo para ejecutar desarrollos siguiendo Spec-Driven Development (SDD): especificación de contratos, desglose de tareas, ejecución atómica y verificación técnica.
---

# Metodología de Desarrollo Dirigido por Especificación (SDD)

Este skill define el flujo de trabajo riguroso para implementar cualquier requerimiento, funcionalidad o refactor en Financiera Impulso.

---

## Principio Fundamental
> **Primero los fundamentos y el contrato, luego el código.** Ningún componente de UI o Server Action debe escribirse sin antes haber definido su contrato de datos y reglas de negocio.

---

## Flujo de Trabajo en 4 Fases

### Fase 1: Especificación (Spec)
Antes de modificar archivos de la aplicación, define:
1. **Modelo de Datos:** ¿Afecta a `prisma/schema.prisma`? ¿Requiere migración de base de datos (`npx prisma db push`)?
2. **Contratos de Tipos:** Actualizar o definir interfaces en `src/types/index.ts`.
3. **Firmas de Server Actions:** Definir qué inputs recibe y qué objeto (`{ success: boolean, data?: ..., message?: string }`) retorna cada acción en `src/app/actions/`.
4. **Reglas de Negocio Afectadas:** Identificar si impacta reglas de modales, validaciones de formularios, asignación de promotores o cálculos financieros.

### Fase 2: Plan de Tareas Atómicas (Plan)
Desglosar la ejecución en pasos pequeños e independientes:
1. Cambios en esquema y tipos.
2. Server Actions y lógica de persistencia.
3. Actualización de estado global en Zustand (si aplica).
4. Componentes y pantallas de UI.
5. Verificación y validación de borde.

### Fase 3: Ejecución Atómica (Apply)
1. Desarrollar un paso a la vez.
2. Seguir las reglas visuales y de UX (ej. orden de validaciones de arriba a abajo en formularios, modales con Escape sin cierre por fondo).
3. Utilizar `noStore()` en Server Actions para asegurar datos en tiempo real.

### Fase 4: Verificación (Verify)
1. Ejecutar verificación de tipos de TypeScript: `npx tsc --noEmit`.
2. Verificar linters: `npm run lint`.
3. Comprobar que no se rompieron flujos existentes usando `CodeGraph`.
4. Proceder a versionar con commits atómicos siguiendo `atomic-commits`.
