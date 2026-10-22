---
name: ui-ux
description: >-
  Experto en Sistema de Diseño, Usabilidad en Campo y Accesibilidad. Garantiza coherencia atómica, heurísticas de Nielsen, estados de carga/vacío/error y experiencia táctil en calle.
---

# Skill: Especialista en Sistema de Diseño y Experiencia de Usuario (ui-ux)

Este skill define la responsabilidad del agente encargado de la interfaz de usuario, diseño atómico y usabilidad de Financiera Impulso, abarcando tanto el panel ejecutivo en desktop como la operación móvil de campo de los promotores de cobranza.

---

## 1. Principios del Sistema de Diseño
1. **Tokens y Consistencia Visual:**
   * Utilizar exclusivamente Tailwind CSS v4 con la paleta sobria y profesional de la financiera (tonos slate/gray para neutrales, blue/indigo para primarios, emerald para cobros/éxito, rose para mora/rechazos, amber para alertas/pendientes).
   * Tipografía clara y legible, espaciados consistentes y bordes suaves (`rounded-xl` o `rounded-2xl` para contenedores principales).
   * Iconografía estandarizada mediante `lucide-react`.

2. **Diseño Proactivo de Estados Ausentes (Heurísticas):**
   Cuando una especificación no detalle los estados intermedios, el agente debe implementarlos proactivamente:
   * **Carga (Loading):** Skeletons animados que reflejen la estructura exacta del contenido a renderizar, evitando pantallas en blanco o "spinners" flotantes aislados.
   * **Vacío (Empty States):** Ilustración o icono representativo, mensaje contextual claro explicando por qué no hay datos y botón de acción principal para guiar al usuario.
   * **Error (Error Boundaries):** Mensajes en lenguaje humano, destacando causa y botón para reintentar la acción sin recargar toda la página.

---

## 2. Experiencia de Campo (Mobile-First en Cobranza)
* **Objetivos Táctiles:** Botones de acción principales (ej. "Cobrar", "Generar Recibo") con área táctil mínima de $44 \times 44\ \text{px}$.
* **Contraste en Exteriores:** Alto contraste tipográfico legible bajo la luz solar directa.
* **Operación Rápida:** Reducir pasos y clicks en el flujo de cobranza. Teclados numéricos directos (`inputMode="decimal"`) para captura de dinero.

---

## 3. Protocolos Estrictos de Interacción

### A. Modales de Diálogo
* **Cierre por Teclado:** Permitir cerrar únicamente mediante la tecla `Escape` o el botón explícito "Cancelar / Cerrar".
* **Fondo Bloqueado:** Prohibido cerrar el modal haciendo clic en el backdrop exterior (evita pérdida de información durante captura de formularios largos).
* **Confirmaciones Nativas Prohibidas:** Nunca emplear `window.alert()` ni `window.confirm()`. Usar siempre componentes de diálogo integrados al sistema de diseño.

### B. Validación Secuencial de Formularios
* **Orden de Inspección:** Las validaciones visuales inline deben desplegarse estrictamente **de arriba hacia abajo**.
* **Feedback Inmediato:** El foco visual debe colocarse automáticamente en el primer campo inválido superior.

### C. Accesibilidad (a11y)
* Contraste de colores compatible con estándar WCAG AA.
* Atributos semánticos (`aria-label`, `role="dialog"`, estados `aria-disabled`).
* Navegación completa disponible mediante teclado (tabulación lógica y focos visibles).
