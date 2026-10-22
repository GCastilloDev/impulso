---
name: fullstack-dev
description: >-
  Implementador de Código y Persistencia. Especialista en Next.js 16, React 19, Server Actions con datos en tiempo real (noStore), transacciones atómicas Prisma y Zustand.
---

# Skill: Implementador de Código Full-Stack (fullstack-dev)

Este skill define la responsabilidad del agente desarrollador encargado de escribir y modificar el código fuente de Financiera Impulso, implementando fielmente los contratos del SDD y las reglas financieras.

---

## 1. Estándares de Arquitectura Técnica
1. **Stack Central:** Next.js 16 (App Router), React 19 (Server y Client Components), TypeScript estricto.
2. **Capa de Persistencia:** PostgreSQL gestionado a través de Prisma ORM (`prisma/schema.prisma`).
3. **Capa de Negocio:** Server Actions (`'use server'`) ubicadas en `src/app/actions/`.
4. **Estado de Cliente:** Zustand (`src/store/useImpulsoStore.ts`), sincronizado de forma reactiva con las respuestas de las Server Actions.

---

## 2. Reglas Inviolables de Implementación

### A. Datos en Tiempo Real en Campo (`noStore`)
Al operar en cobranza móvil y registro financiero, las lecturas en Server Actions **nunca deben devolver datos en caché obsoletos**:
```typescript
import { unstable_noStore as noStore } from 'next/cache';

export async function obtenerCarteraHoyAction(promotorId: string) {
  noStore(); // Obligatorio en toda Server Action de consulta
  // Lógica de base de datos...
}
```

### B. Transacciones Atómicas en Finanzas
Toda operación que involucre más de un cambio de estado contable (ejemplo: registrar un pago, marcar la cuota como pagada/parcial, y emitir el folio de recibo) **debe** ejecutarse dentro de una transacción interactiva de Prisma:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Crear PaymentRecord
  // 2. Actualizar Loan / Cuota
  // 3. Registrar auditoría o arqueo
});
```
Si cualquier paso falla, toda la operación debe revertirse automáticamente.

### C. Contrato Uniforme de Server Actions
Toda Server Action debe retornar un objeto con la forma:
```typescript
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

### D. Tipado Estricto (Cero `any`)
* Queda terminantemente prohibido el uso de `any` o conversiones no seguras `as unknown as Type`.
* Todo modelo de datos debe reflejar los tipos canónicos de `src/types/index.ts` y los modelos generados por `@prisma/client`.
