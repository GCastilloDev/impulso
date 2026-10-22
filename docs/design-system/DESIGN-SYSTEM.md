# Sistema de Diseño Institucional — Stripe Dashboard UI (Definitivo)
## Financiera Impulso — Plataforma Operativa de Microfinanzas

> **Documento Oficial de Especificación y Contratos de UI/UX**  
> **Estado:** `APROBADO POR EL CLIENTE`  
> **Referencia Visual:** [preview.html](file:///Users/gustavo/Documents/Personal/financiera-impulso/docs/design-system/preview.html)  
> **Fecha:** Octubre 2026  
> **Versión:** 1.0.0 Oficial

---

## 1. Fundamentos Tipográficos Aprobados

La plataforma adopta un esquema tipográfico dual de alta precisión técnica:

1. **Tipografía Principal de UI (`--font-sans`):** **Inter**
   - Pesos: `400` (Regular), `500` (Medium), `600` (Semi-bold).
   - Uso: Títulos, navegación, etiquetas de formulario, botones y descripciones.
   - Escala y Jerarquía:
     - **Nombre de Acreditado / H1:** $22\text{px}$ a $24\text{px}$ (`font-semibold`, tracking `-0.015em`, color `#1a1f36`).
     - **Títulos de Sección / H2:** $15\text{px}$ (`font-semibold`, color `#1a1f36`).
     - **Encabezados Colapsables:** $14\text{px}$ (`font-semibold`, color `#1a1f36`).
     - **Navegación y Cuerpo Base:** $13\text{px}$ a $13.5\text{px}$ (`font-normal` o `font-medium`, color `#3c4257`).
     - **Encabezados de Tabla (TH):** $11.5\text{px}$ a $12\text{px}$ (`font-medium`, color `#697386`, `tracking-normal`).
     - **Captions y Metadatos de Apoyo:** $11.5\text{px}$ a $12\text{px}$ (`font-normal`, color `#697386`).

2. **Tipografía Numérica y de Código (`--font-mono`):** **Source Code Pro** (o `Geist Mono`)
   - Pesos: `400` (Regular), `500` (Medium).
   - Función obligatoria: `font-feature-settings: 'tnum' 1;` (números tabulares monoespaciados).
   - Uso:
     - **Cifras Monetarias:** `$600.00 MXN`, saldos insolutos, cuotas y sumatorias (alineación derecha en tablas).
     - **Identificadores Únicos:** Claves de cliente y contrato (`cli_HwySSSrWEuVeTp`, `pre_9812A`) en píldoras con radio de 4px.

---

## 2. Tokens de Color Oficiales (`src/app/globals.css`)

```css
:root {
  /* Tipografía */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Source Code Pro', monospace;

  /* Colores de Marca y Acción */
  --primary: #635bff;                 /* Stripe Blurple Oficial */
  --primary-hover: #5146e5;
  --primary-foreground: #ffffff;
  --primary-subtle: #f4f3ff;

  /* Tintas y Textos */
  --foreground: #1a1f36;              /* Texto principal de alto contraste */
  --text-secondary: #3c4257;          /* Textos de formulario y descripciones */
  --text-muted: #697386;              /* Fechas, captions y headers de tabla */
  --link: #0052cc;                    /* Enlaces de acción ("Editar", "Ver todos") */

  /* Lienzo y Superficies */
  --background: #ffffff;              /* Lienzo base blanco puro */
  --card: #ffffff;
  --card-foreground: #1a1f36;
  --surface-subtle: #f7f8f9;          /* Filas alternas y fondos secundarios */
  --border: #e3e8ee;                  /* Borde hairline exacto de 1px */
  --input: #e3e8ee;
  --ring: rgba(99, 91, 255, 0.35);    /* Anillo de foco accesible */

  /* Badges Semánticos de Estado (Contraste WCAG AAA) */
  --badge-success-bg: #e3fcef;
  --badge-success-text: #00875a;      /* Al corriente / Cobrado con ✓ */

  --badge-info-bg: #deebff;
  --badge-info-text: #0052cc;         /* Principal / Ordinario */

  --badge-warning-bg: #fffae6;
  --badge-warning-text: #b76e00;      /* Parcial / En revisión */

  --badge-danger-bg: #ffebe6;
  --badge-danger-text: #de350b;       /* En mora / Vencido */

  /* Radios Geométricos */
  --radius-sm: 4px;                   /* Botones, inputs, badges de código, checkboxes */
  --radius-md: 6px;                   /* Menús y tarjetas internas */
  --radius-lg: 8px;                   /* Paneles y modales */
}
```

---

## 3. Especificación de Primitivas de UI (`src/components/ui/`)

### 3.1. Botones (`Button`)
* **Variante `stripe-actions` (Principal):**
  - Fondo `#635bff`, texto blanco, altura $34\text{px}$, padding horizontal $12\text{px}$, radio $4\text{px}$, tipografía $13\text{px}$ `font-medium`. Chevron `▼` de $12\text{px}$.
* **Variante `secondary` / `outline`:**
  - Fondo blanco, borde $1\text{px}$ `#e3e8ee`, texto `#3c4257`, hover `#f7f8f9`.
* **Variante `ghost` / `link`:**
  - Sin fondo ni borde, color `#0052cc`, hover con subrayado.

### 3.2. Badges de Estado (`Badge` & `StatusBadges`)
* **Badges de Proceso Financiero:**
  - Radio de $10\text{px}$ o $4\text{px}$, tipografía de $11\text{px}$ `font-semibold`.
  - Icono integrado: Checkmark (`✓`) para cobrado/al corriente, alerta (`!`) para mora.
* **Badges de Código / ID:**
  - Fondo blanco, borde `#e3e8ee`, tipografía `Source Code Pro` $12\text{px}$, padding `2px 6px`, radio $4\text{px}$.

### 3.3. Tabla Contable y de Cobros (`Table`)
* **Encabezados (`<th>`):** Altura $34\text{px}$, texto en $11.5\text{px}$ `font-medium` `#697386`, borde inferior $1\text{px}$ `#e3e8ee`.
* **Filas (`<tr>`):** Altura $38\text{px}$, borde inferior $1\text{px}$ `#e3e8ee`, hover sutil `#fbfcfd`.
* **Checkboxes integrados:** Checkbox con radio de $3\text{px}$ y borde `#cbd5e1`.
* **Celdas Numéricas:** Alineación derecha, tipografía monoespaciada con etiqueta subordinada de moneda (`MXN` en $11\text{px}$ `#697386`).
* **Acciones inline:** Menú de tres puntos `•••` discreto al final de cada fila.

---

## 4. Arquitectura de Shell y Layout

### 4.1. Barra Lateral (`Sidebar.tsx`)
* Ancho fijo de $236\text{px}$, fondo blanco con borde derecho $1\text{px}$ `#e3e8ee`.
* **Cabecera:** Switcher de organización (`Financiera Impulso ▼`) con icono circular verde (`#00875a` sobre `#e3fcef`).
* **Navegación:** Enlaces con icono SVG de $15\text{px}$ y grosor $1.75\text{px}$. Estado activo con texto `#635bff` y fondo `#f4f3ff` o línea indicadora.
* **Sub-items anidados:** Indentación a $32\text{px}$ para enlaces dependientes (ej. en *Clientes y Créditos*: `Créditos Activos`, `Expedientes`, `Recibos`).
* **Pie Fijo:**
  - Botón `[ >_ Desarrolladores |→ ]` con radio de $4\text{px}$.
  - Toggle `Ver datos de prueba` con switch deslizante.

### 4.2. Layout de 2 Columnas para Vistas de Detalle
* Proporción $30\% \ / \ 70\%$ con separación de $2.5\text{rem}$.
* **Columna Izquierda:** Ficha del cliente, ID en píldora, pares clave-valor y bloques colapsables (*Detalles*, *Metadatos y Aval*).
* **Columna Derecha:** Tarjetas de créditos activos, tabla de cobros/recibos y promotor asignado.

---

## 5. Criterios de Aceptación y Calidad
1. Cero errores de TypeScript (`npx tsc --noEmit`).
2. Preservación estricta de las reglas de modales (Escape, no clic fuera).
3. Respeto al protocolo de `noStore` en Server Actions para datos de campo en tiempo real.
4. Commits atómicos convencionales en español.
