---
name: sdd-workflow
description: >-
  Guía y protocolo para ejecutar desarrollos siguiendo Spec-Driven Development (SDD): especificación de contratos, triaje de cambios (features, fixes, mejoras), ejecución con subagentes y verificación técnica.
---

# Metodología de Desarrollo Dirigido por Especificación (SDD)

Este skill define el flujo operativo riguroso para implementar cualquier requerimiento, corrección o mejora en Financiera Impulso.

---

## 1. Principio Fundamental
> **Primero los fundamentos y el contrato, luego el código.** Ningún componente de UI o Server Action debe escribirse sin antes haber definido su contrato de datos y reglas de negocio, o haber evaluado su impacto en el grafo existente.

---

## 2. Triaje Operativo: ¿Qué camino seguir?

Para evitar burocracia innecesaria en cambios menores y garantizar cero regresiones en cambios críticos, todo trabajo se clasifica en uno de los siguientes caminos:

### Camino A: Funcionalidades Nuevas (Ciclo Completo SDD)
Aplica cuando se introduce una nueva pantalla, módulo o flujo de negocio desde cero.
1. **Spec & Contratos:** El agente `sdd-spec` redacta un nuevo documento en `docs/sdd/SDD-XXX-<nombre>.md` usando la plantilla oficial.
2. **Grafo de Tareas (Task DAG):** Se descompone la funcionalidad en tareas atómicas con dependencias claras para ejecución paralela.
3. **Despacho a Subagentes:** El orquestador despacha los nodos del DAG a los agentes especializados (`fullstack-dev`, `ui-ux`) en Herdr.
4. **Auditoría Cruzada:** Verificación con `financial-core`, `security-audit`, `qa-testing` y `code-review`.
5. **Cierre:** Commits atómicos con `atomic-commits`.

### Camino B: Micro-Fixes (Vía Rápida / Bajo Impacto)
Aplica para correcciones visuales menores, textos, botones desalineados o ajustes de validación aislados que no alteran la base de datos ni las fórmulas financieras.
* **No requiere crear un nuevo SDD.**
* **Flujo directo:**
  1. El orquestador despacha la tarea directamente al implementador (`ui-ux` o `fullstack-dev`).
  2. El agente `code-review` audita que `npx tsc --noEmit` y `npm run lint` pasen limpios.
  3. El agente `atomic-commits` registra el cambio con prefijo `fix:` o `style:`.

### Camino C: Fixes de Lógica y Financieros (Impacto Medio-Alto)
Aplica cuando se detecta un error de cálculo, descuadre de centavos, desfase en mora, problema de corte a las 16:00 hrs o inconsistencia en arqueos.
* **El SDD es un Documento Vivo:** No se crea un SDD desde cero; se localiza y edita el SDD original de ese módulo en `docs/sdd/`.
* **Flujo:**
  1. **Análisis de Causa Raíz con Grafo:** Consultar `codegraph impact <simbolo>` para mapear todas las pantallas y Server Actions dependientes.
  2. **Adenda en el SDD:** Registrar una sección breve de *Adenda / Corrección de Regla de Negocio* en el archivo Markdown correspondiente para mantener actualizada la fuente de la verdad.
  3. **Corrección & Auditoría Financiera:** El cambio debe ser validado obligatoriamente por `financial-core` y `qa-testing` antes de ser aprobado.
  4. **Cierre:** Commit convencional `fix(...)` con `atomic-commits`.

### Camino D: Mejoras y Refactors Evolutivos
Aplica cuando se extiende una funcionalidad existente (ej. agregar frecuencia quincenal o un nuevo filtro en cobranza).
1. **Versionado del SDD:** Se actualiza el encabezado del SDD original (ej. de `v1.0` a `v1.1`).
2. **Actualización del Grafo DAG:** Se agregan únicamente los nuevos nodos de tarea requeridos.
3. **Despacho en Herdr:** Ejecución de subtareas en subagentes manteniendo el contexto aislado.

---

## 3. Matriz de Roles y Habilidades Disponibles

| Skill / Rol | Responsabilidad Primaria |
| :--- | :--- |
| **`sdd-spec`** | Modela el dominio, contratos técnicos y define el Grafo DAG de tareas. |
| **`financial-core`** | Audita fórmulas de amortización, prelación de mora, cortes de caja y comisiones. |
| **`ui-ux`** | Sistema de diseño (Tailwind v4), accesibilidad, validación secuencial y modales. |
| **`fullstack-dev`** | Implementación en Next.js 16, Server Actions con `noStore()`, Prisma y Zustand. |
| **`code-review`** | Calidad de código, cero errores en `tsc`, linters y análisis con CodeGraph. |
| **`security-audit`** | Control RBAC (Admin vs Promotor), protección de PII y seguridad en Server Actions. |
| **`qa-testing`** | Casos de borde, validaciones extremas, concurrencia y pruebas de estrés. |
| **`atomic-commits`** | Versionado granular en Git con Conventional Commits en español sin atribuciones a IA. |
