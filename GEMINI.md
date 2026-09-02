# Financiera Impulso - Guía del Proyecto y Arquitectura

## 1. Visión General
Financiera Impulso es una plataforma web para la administración y operación de microfinanciera, centrada en la colocación de créditos, gestión de clientes y cobranza en campo.

---

## 2. Stack Tecnológico y Arquitectura
* **Framework:** Next.js 16 (App Router) + React 19 + TypeScript.
* **Persistencia:** PostgreSQL (Neon) gestionado con Prisma ORM (`prisma/schema.prisma`).
* **Capa de Negocio:** Server Actions (`'use server'`) ubicadas en `src/app/actions/`.
  * **Regla de Carga en Tiempo Real:** Las consultas a base de datos deben utilizar `unstable_noStore as noStore` para evitar datos obsoletos en caché al operar en campo.
* **Estado Global:** Zustand (`src/store/useImpulsoStore.ts`), sincronizado con la base de datos a través de Server Actions.
* **UI & Estilos:** Tailwind CSS v4, Lucide React, Recharts.
* **Inteligencia y Grafo:** CodeGraph (`.codegraph/`) para análisis de impacto y dependencias.

---

## 3. Metodología de Trabajo: SDD (Spec-Driven Development)
Todo cambio funcional o refactorización relevante debe seguir el flujo SDD:
1. **Especificación (Spec):** Definir claramente la necesidad de negocio, impacto en el modelo de datos (`schema.prisma`), contratos de tipos (`src/types/index.ts`) y Server Actions antes de codificar.
2. **Plan Atómico (Plan):** Desglosar el trabajo en tareas unitarias con orden lógico de dependencia.
3. **Implementación:** Desarrollar componente por componente o acción por acción respetando las reglas de validación y UI existentes.
4. **Verificación:** Validar tipos (`npx tsc --noEmit`), linting y lógica de negocio antes de dar por cerrada la tarea.

Consulte la skill en `.agents/skills/sdd-workflow/SKILL.md` para el protocolo completo.

---

## 4. Política de Commits Atómicos
* **Commits Unitarios:** Cada commit debe resolver una única responsabilidad (SRP). Está prohibido realizar "mega-commits" que junten esquema, backend y múltiples pantallas.
* **Convención:** Conventional Commits en **español** (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`).
* **Atribución:** **PROHIBIDO** incluir `Co-Authored-By` o referencias a herramientas de IA. Solo mensajes convencionales humanos y directos.

Consulte la skill en `.agents/skills/atomic-commits/SKILL.md` para el procedimiento detallado.

---

## 5. Reglas del Workspace (`.agents/rules/`)
* **`modals.md`:** Manejo estricto de modales (tecla Escape, sin cierre por clic en backdrop, sin `alert`/`confirm` nativos).
* **`client_assignment.md`:** Restricción y asignación automática de clientes para Promotores de Campo vs Administradores.
* **`form_validations.md`:** Validación secuencial visual de formularios de arriba hacia abajo.
* **`financial_rules.md`:** Fórmulas financieras, cálculo de cuotas, mora y ciclo de vida de préstamos.
