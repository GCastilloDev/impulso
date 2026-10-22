# Sistema de Diseño Institucional — Stripe Dashboard UI
## Financiera Impulso — Plataforma Operativa de Microfinanzas

> **Documento Rector del Sistema de Diseño Visual y Ergonómico**  
> **Estado:** `PROPUESTA ALINEADA A REFERENCIA REAL (STRIPE DASHBOARD)`  
> **Especialista:** Agente UI/UX Senior (`skill: ui-ux`)  
> **Fecha:** Octubre 2026  
> **Versión:** 2.0.0 (Basado en capturas directas de `dashboard.stripe.com`)  
> **Maqueta Interactiva:** [`docs/design-system/preview.html`](file:///Users/gustavo/Documents/Personal/financiera-impulso/docs/design-system/preview.html)

---

## 1. Contexto de Negocio y Alineación Visual

Financiera Impulso es un **Core / ERP Operativo de Microfinanzas**, donde administradores y promotores gestionan colocación de créditos diarios/semanales, expedientes de acreditados, avales, cálculo de mora y cobranza en campo.

### 1.1. Enfoques Descartados y Aprendizaje
1. **Escalado Extremo de Accesibilidad ("Efecto Lupa"):**
   * *Problema:* H1 de 30px, cuerpo de 16px y filas de tabla de 54px destruían la densidad de información y hacían ver la plataforma como un prototipo infantil o genérico.
2. **Estética Google Material 3 / Gmail:**
   * *Problema:* Las píldoras de 9999px, colores pastel difusos y buscadores centrados flotantes daban la sensación de un cliente de correo electrónico o consumer app, careciendo de la sobriedad financiera requerida.
3. **Mega-Menús de Marketing de Stripe.com:**
   * *Problema:* Los menús horizontales desplegables pertenecen a landing pages públicas para vender producto, no a un panel de control operativo SaaS donde el usuario necesita navegación lateral persistente.

### 1.2. El Paradigma Definitivo: Stripe Dashboard Web App
El estándar adoptado proviene directamente de las pantallas operativas de **Stripe Dashboard** (`dashboard.stripe.com`):
* Barra lateral izquierda fija con selector de organización, enlaces directos, sub-enlaces anidados y acceso inferior a herramientas de desarrollo y modo de prueba.
* Barra superior ultra-limpia con buscador contextual, feedback directo y badge numérico de notificaciones.
* Layout dividido en **2 columnas**:
  * **Columna Izquierda (30%):** Ficha del cliente, identificador `cli_...` en píldora monospace, datos de contacto colapsables y aval.
  * **Columna Derecha (70%):** Barra de pestañas contextuales, botón insignia `#635bff` `Acciones ▼`, tarjeta de crédito activo con badge verde y tabla de cobros/recibos con casillas de selección.

---

## 2. Tokens de Color Oficiales (Stripe Dashboard)

A diferencia de los colores de marketing o librerías genéricas, la interfaz web del dashboard de Stripe utiliza una paleta cromática de alta precisión y contraste:

```css
:root {
  /* Tipografía */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Source Code Pro', 'JetBrains Mono', monospace;

  /* Acción Principal de Marca */
  --stripe-purple: #635bff;            /* Stripe Blurple Oficial (Botón Acciones, foco, enlaces activos) */
  --stripe-purple-hover: #5146e5;
  --stripe-purple-light: #f4f3ff;

  /* Jerarquía de Texto y Tintas */
  --stripe-text-primary: #1a1f36;      /* Títulos principales, nombres, montos contables destacados */
  --stripe-text-secondary: #3c4257;    /* Cuerpo de texto, etiquetas descriptivas, labels */
  --stripe-text-muted: #697386;        /* Captions, fechas, encabezados de tabla, texto de apoyo */
  --stripe-link: #0052cc;              /* Enlaces textuales de acción ("Editar", "Ver todos") */

  /* Superficies y Bordes */
  --stripe-bg-app: #ffffff;            /* Fondo blanco óptico limpio */
  --stripe-bg-subtle: #f7f8f9;         /* Fondos sutiles de hover o tarjetas secundarias */
  --stripe-border: #e3e8ee;            /* Borde hairline exacto (1px sólido) */

  /* Badges Semánticos de Estado (4px a 10px radius, texto sobrio) */
  --badge-green-bg: #e3fcef;
  --badge-green-text: #00875a;         /* Al corriente / Cobrado con icono ✓ */

  --badge-blue-bg: #deebff;
  --badge-blue-text: #0052cc;          /* Principal / Pendiente ordinario */

  --badge-yellow-bg: #fffae6;
  --badge-yellow-text: #b76e00;        /* Parcial / En revisión */

  --badge-red-bg: #ffebe6;
  --badge-red-text: #de350b;           /* En mora / Rechazado */

  /* Radios Geométricos Conservadores */
  --radius-sm: 4px;                    /* Botones, inputs, badges de ID, checkboxes */
  --radius-md: 6px;                    /* Menús y tarjetas internas */
  --radius-lg: 8px;                    /* Modales y paneles principales */
}
```

---

## 3. Arquitectura de Navegación Lateral (Sidebar)

Basado en la estructura exacta de las capturas de Stripe Dashboard:

1. **Selector de Organización Superior:**
   * Icono circular con inicial verde esmeralda (`#00875a` sobre `#e3fcef`).
   * Nombre de la financiera: **Financiera Impulso** con chevron desplegable `▼`.
2. **Lista Jerárquica de Módulos:**
   * `Inicio`: Resumen de colocación y cobranza del día.
   * `Cobranzas`: Agenda y ruta diaria de cobro en calle.
   * `Saldos y Caja`: Arqueo diario a las 16:00 hrs y balance general.
   * `Clientes y Créditos` (Módulo Activo):
     * *Sub-enlace anidado:* `Créditos Activos`
     * *Sub-enlace anidado:* `Expedientes`
     * *Sub-enlace anidado:* `Recibos Emitidos`
   * `Promotores de Campo`: Gestión y asignación de rutas por promotor.
   * `Productos de Crédito`: Catálogo de plazos (diario, semanal) y tasas.
   * `Informes de Cartera`: Reportes de colocación, mora y comisiones.
   * `Configuración`: Parámetros institucionales y tabulador.
3. **Pie de Barra Lateral (Panel Inferior Fijo):**
   * **Botón `[ >_ Desarrolladores |→ ]`:** Botón rectangular blanco con borde `#e3e8ee` y chevron lateral para acceso técnico.
   * **Switch `Ver datos de prueba`:** Interruptor discreto para alternar entre entorno de pruebas y datos reales de producción.

---

## 4. Estructura de la Pantalla Operativa (Ficha de Cliente y Crédito)

### 4.1. Barra Superior (Topbar)
* **Buscador:** Input rectangular plano con icono de lupa, placeholder `Buscar...` y borde hairline `#e3e8ee`.
* **Herramientas:** Enlace `Feedback?` con icono de mensaje, campana de notificaciones con badge circular rojo (`2`), icono de ayuda y avatar de usuario.

### 4.2. Cabecera de Acreditado (Customer Header Split)
* **Izquierda:**
  * Nombre del cliente en 24px semi-negrita (`María del Carmen López`).
  * Email o teléfono en 13.5px `text-muted`.
  * **Fila de Micro-KPIs:**
    * *Colocado total:* `$10,000.00`
    * *Acreditada desde:* `Oct 2024`
    * *Saldo insoluto:* `$4,800.00 ▼`
* **Derecha:**
  * Pestañas superiores: `Visión general` (activa con barra inferior púrpura) y `Eventos y registros`.
  * **Botón Principal:** Botón sólido púrpura `#635bff` `Acciones ▼` con tipografía blanca de 13px y radio de 4px.

### 4.3. Grilla de 2 Columnas (Layout 30% / 70%)

#### Columna Izquierda: Detalles del Acreditado
* Bloque colapsable `Detalles` con enlace de acción `Editar` a la derecha.
* Píldora de código monospace con el ID del cliente: `cli_HwySSSrWEuVeTp`.
* Pares clave-valor limpios:
  * *Nombre del negocio:* Abarrotes La Lupita
  * *Domicilio de cobro:* Col. Las Flores, Mza 4 Lote 12
  * *Teléfono de contacto:* +52 55 4192 8841
  * *Correo electrónico:* mariadelcarmen.lopez@example.com
  * Enlace `Mostrar más`
* Bloque colapsable secundario: `Metadatos y Aval`.

#### Columna Derecha: Créditos, Cobros y Promotor
1. **Sección Créditos Activos:**
   * Barra de título con enlace azul `Crear crédito`.
   * **Tarjeta de Crédito Activo:** Contenedor blanco con borde `#e3e8ee`, icono verde de tarjeta, título `Crédito Diario 20 Días`, badge verde `Al corriente`, descripción de cuota (`$600.00 • Próximo cobro: Hoy 14:15 hrs por Juan Pérez`) y botones agrupados de acción rápida (editar, cancelar, opciones).
2. **Sección Cobros y Recibos:**
   * Barra de título con enlaces `Ver todos` y `Registrar cobro`.
   * **Tabla de Pagos Stripe:**
     * Checkbox en cabecera y en cada fila.
     * Columna **Monto:** Cifra en negrita `$600.00` acompañada de `MXN` en gris tenue.
     * Columna **Estado:** Badge con checkmark verde `Cobrado ✓`.
     * Columna **Descripción:** `Cuota 12 de 20 · Recibo #481`.
     * Columna **Fecha:** `Sep 14, 11:14 PM` en gris muted de 12px.
     * Menú de tres puntos `•••` al extremo derecho.
3. **Sección Promotor Asignado y Aval:**
   * Fila con badge rectangular `RUTA`, nombre del promotor (`Juan Pérez · Ruta Centro 01`), badge azul `Principal` y horario habitual de visita.
4. **Sección Saldo Pendiente de Liquidación:**
   * Importe monumental tabular de `$4,800.00 MXN`.

---

## 5. Hoja de Ruta de Implementación en Código

> **IMPORTANTE:** Ningún archivo en `src/` será modificado hasta que el usuario dé su aprobación formal a la maqueta interactiva.

Una vez autorizada la propuesta visual:
1. **Tokens Globales (`src/app/globals.css`):** Reemplazar variables CSS por los tokens exactos de Stripe (`#635bff`, `#1a1f36`, `#3c4257`, `#697386`, `#e3e8ee`).
2. **Primitivas UI (`src/components/ui/`):**
   * `button.tsx`: Añadir variante `stripe-actions` (`bg-[#635bff] hover:bg-[#5146e5] text-white rounded-[4px] h-[34px] px-3 text-[13px] font-medium`).
   * `badge.tsx`: Ajustar radios a `4px` o `10px` con tipografía de `11px` y formato con iconos de estado (`✓`).
   * `table.tsx`: Espaciado de celdas a 38px de altura por fila con checkbox integrado y números tabulares.
   * `input.tsx`: Borde hairline `#e3e8ee` y halo púrpura al foco.
3. **Navegación Institucional (`src/components/shared/Sidebar.tsx`):**
   * Replicar el sidebar con Org Switcher, sub-items anidados en Clientes/Créditos, botón de Desarrolladores y switch de datos de prueba.
4. **Vistas Clave:**
   * Actualizar `/clientes/[id]` para coincidir con el layout de 2 columnas.
   * Actualizar `/cobranza` y `/prestamos` con la tabla y badges de Stripe.
5. **Verificación Estricta:**
   * Compilación TypeScript con cero errores (`npx tsc --noEmit`).
   * Commits atómicos convencionales en español.
