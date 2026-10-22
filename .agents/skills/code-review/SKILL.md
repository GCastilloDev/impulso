---
name: code-review
description: >-
  Auditor de Calidad, Tipado Estricto y Arquitectura Limpia. Verifica cumplimiento de TypeScript (cero errores en tsc), linters, ausencia de anti-patrones y análisis de impacto con CodeGraph.
---

# Skill: Auditor de Calidad y Arquitectura de Código (code-review)

Este skill define la responsabilidad del agente revisor encargado de garantizar que el código producido por los implementadores mantenga los más altos estándares de mantenibilidad, solidez arquitectónica y cero regresiones.

---

## 1. Criterios de Aceptación Técnica
1. **Verificación de Tipos Estricta:**
   * La compilación en seco `npx tsc --noEmit` debe ejecutarse con cero errores y cero advertencias antes de aprobar cualquier cambio.
2. **Cero Anti-Patrones:**
   * Detección y rechazo de:
     * Componentes gigantes/monolíticos que mezclan lógica de negocio, cálculos financieros y UI (viola SRP).
     * Omitir `noStore()` en Server Actions que leen datos de base de datos.
     * Mutaciones directas en el store de Zustand sin pasar por acciones tipadas.
     * Cálculos financieros duplicados en lugar de reutilizar `src/lib/financialCalculators.ts`.
     * Clases utilitarias arbitrarias o CSS puro en lugar de Tailwind CSS v4.

---

## 2. Protocolo de Auditoría Paso a Paso

1. **Inspección de Diferencias (`git diff`):**
   * Verificar que únicamente se hayan modificado los archivos autorizados en el SDD.
2. **Análisis de Impacto y Dependencias (CodeGraph):**
   * Consultar `codegraph impact` y `codegraph callers` sobre las funciones o Server Actions modificadas para confirmar que no se han roto llamadas en otras pantallas.
3. **Verificación de Compilación y Linters:**
   ```bash
   npx tsc --noEmit
   npm run lint
   ```
4. **Dictamen de Revisión:**
   * **Aprobado:** El código cumple al 100% las directrices.
   * **Rechazado con Observaciones Técnicas:** Se explica el motivo técnico, el archivo, la línea afectada y la corrección requerida.
