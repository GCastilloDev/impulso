# Manual de Usuario y Operación — Financiera Impulso

Bienvenido a la guía oficial de usuario y operación de **Financiera Impulso**. Esta plataforma integral ha sido diseñada para optimizar el ciclo de originación de créditos, gestión de cartera de clientes, control de cobranza móvil en campo, arqueo diario de caja y dispersión de comisiones para microfinancieras.

---

## Tabla de Contenido
1. [Cuentas de Prueba y Credenciales de Acceso](#1-cuentas-de-prueba-y-credenciales-de-acceso)
2. [Guía de Uso según tu Rol: ¿Cómo operar la aplicación?](#2-guía-de-uso-según-tu-rol-cómo-operar-la-aplicación)
3. [Arquitectura General y Matriz de Roles](#3-arquitectura-general-y-matriz-de-roles)
4. [Módulo 1: Autenticación y Acceso Seguro](#4-módulo-1-autenticación-y-acceso-seguro)
5. [Módulo 2: Panel Ejecutivo y Métricas en Tiempo Real](#5-módulo-2-panel-ejecutivo-y-métricas-en-tiempo-real)
6. [Módulo 3: Directorio y Expediente de Clientes](#6-módulo-3-directorio-y-expediente-de-clientes)
7. [Módulo 4: Préstamos, Simulador y Originación](#7-módulo-4-préstamos-simulador-y-originación)
8. [Módulo 5: Cobranza en Campo, Abonos Parciales y Arqueo](#8-módulo-5-cobranza-en-campo-abonos-parciales-y-arqueo)
9. [Módulo 6: Comisiones Semanales de Cobranza](#9-módulo-6-comisiones-semanales-de-cobranza)
10. [Módulo 7: Catálogo de Productos Financieros](#10-módulo-7-catálogo-de-productos-financieros)
11. [Módulo 8: Gestión de Personal y Usuarios](#11-módulo-8-gestión-de-personal-y-usuarios)
12. [Políticas Financieras y Reglas de Negocio](#12-políticas-financieras-y-reglas-de-negocio)
13. [Buenas Prácticas de Interfaz y Navegación](#13-buenas-prácticas-de-interfaz-y-navegación)

---

## 1. Cuentas de Prueba y Credenciales de Acceso

La plataforma cuenta con usuarios precargados en la base de datos para probar todas las funciones según cada perfil:

| Rol | Nombre de Colaborador | Correo Electrónico | Contraseña | Enfoque de Operación / Pruebas |
| :--- | :--- | :--- | :---: | :--- |
| **Administrador** | Carlos Mendoza | `carlos.mendoza@financieraimpulso.com` | `123456` | **Perfil de Oficina:** Control total, aprobación/rechazo de préstamos, autorización de cobros extemporáneos y visitas fallidas, conciliación de arqueos bancarios, configuración de productos y comisiones. |
| **Promotor de Campo** | Pedro Ramírez | `pedro.ramirez@financieraimpulso.com` | `123456` | **Perfil Móvil en Calle:** Registro de clientes de su cartera, solicitudes de crédito, cobranza en campo, abonos parciales (≥ $100), reporte de visitas no exitosas y arqueo de ruta antes de las 16:00 hrs. |
| **Promotor de Campo** | Laura Méndez | `laura.mendez@financieraimpulso.com` | `123456` | **Segunda Cartera de Campo:** Permite validar la segregación estricta de carteras (un promotor no ve la ruta del otro), reasignación de clientes y cálculo independiente de comisiones semanales. |

---

## 2. Guía de Uso según tu Rol: ¿Cómo operar la aplicación?

### 2.1 Flujo Operativo Diario: Promotor de Campo (Perfil Móvil)
El promotor utiliza la plataforma principalmente desde su teléfono o tableta durante su jornada de cobranza:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 JORNADA DE TRABAJO: PROMOTOR DE CAMPO                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
 1. INICIO DE SESIÓN ──────────▶ Accede con su correo y contraseña.
                                 El sistema lo dirige directo a /cobranza.
                                       │
                                       ▼
 2. RUTA DEL DÍA ──────────────▶ Revisa la pestaña "Ruta de Hoy".
                                 Consulta clientes a cobrar y cuotas en mora.
                                       │
                                       ▼
 3. GESTIÓN DE COBRO ──────────▶ Abre la cuota del cliente y elige acción:
                                 • Cobro Ordinario: Cuota completa + mora.
                                 • Abono Parcial: Mínimo $100.00 (congela mora).
                                 • Visita Fallida: Si hay lluvia/fuerza mayor,
                                   registra $0 con causa para pedir condonación.
                                       │
                                       ▼
 4. RECIBO DIGITAL ────────────▶ Se genera folio de recibo de inmediato
                                 para respaldo del cliente.
                                       │
                                       ▼
 5. CORTE & ARQUEO ────────────▶ A las 16:00 hrs concluye la jornada:
    (Límite 16:00 hrs)           • Entra a la pestaña "Arqueo y Cierre".
                                 • Deposita en el banco el 100% exacto recaudado.
                                 • Captura el folio de ficha bancaria y envía.
                                       │
                                       ▼
 6. REVISIÓN DE COMISIONES ────▶ Consulta en /comisiones su porcentaje ganado
                                 (5% al 10%) sobre la cobranza ordinaria.
```

### 2.2 Flujo Operativo Diario: Administrador (Perfil Directivo)
El administrador supervisa las operaciones, autoriza excepciones y mantiene las finanzas sanas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 JORNADA DE TRABAJO: ADMINISTRADOR                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
 1. INICIO DE SESIÓN ──────────▶ Accede con su correo y contraseña.
                                 Ingresa al Panel Ejecutivo General (/).
                                       │
                                       ▼
 2. SUPERVISIÓN MATUTINA ──────▶ Monitorea Cartera Activa, Índice de Morosidad
                                 y el comportamiento de cobro semanal.
                                       │
                                       ▼
 3. BANDEJA DE PRÉSTAMOS ──────▶ Entra a /prestamos para evaluar solicitudes:
                                 • Aprueba créditos viables (pasan a 'Activo').
                                 • Rechaza solicitudes inviables con motivo.
                                 • Reasigna promotores en caso de bajas/cambios.
                                       │
                                       ▼
 4. AUTORIZACIONES EN CAMPO ───▶ En /cobranza > Autorizaciones:
                                 • Dictamina cobros extemporáneos.
                                 • Dictamina visitas fallidas (perdona o cobra mora).
                                       │
                                       ▼
 5. CONCILIACIÓN DE ARQUEOS ───▶ En /cobranza > Arqueo y Cierre:
                                 • Coteja las fichas bancarias enviadas al 100%.
                                 • Concilia o rechaza cierres con observaciones.
                                       │
                                       ▼
 6. DISPERSIÓN DE NÓMINA ──────▶ En /comisiones:
                                 • Revisa el tabulador institucional por promotor.
                                 • Ajusta criterio de escalón (cartera o cobrados).
                                 • Exporta totales consolidados de la semana.
```

---

## 3. Arquitectura General y Matriz de Roles

El sistema implementa control de acceso basado en roles (**RBAC**). La interfaz adapta automáticamente las opciones del menú lateral y las acciones disponibles según el nivel de autorización del colaborador autenticado.

```
                                 ┌─────────────────────────┐
                                 │    Inicio de Sesión     │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                     ¿Rol de Usuario?
                                     /              \
                   ┌────────────────┘                └────────────────┐
                   ▼                                                  ▼
     ┌───────────────────────────┐                      ┌───────────────────────────┐
     │       ADMINISTRADOR       │                      │     PROMOTOR DE CAMPO     │
     │      (Perfil Oficina)     │                      │      (Perfil Móvil)       │
     └─────────────┬─────────────┘                      └─────────────┬─────────────┘
                   │                                                  │
                   ▼                                                  ▼
     ┌───────────────────────────┐                      ┌───────────────────────────┐
     │  Panel Ejecutivo General  │                      │ Ruta de Cobranza en Campo │
     │  • KPIs & Cartera Activa  │                      │ • Cuotas Exigibles de Hoy │
     │  • Aprobación de Créditos │                      │ • Cobros & Recibos        │
     │  • Arqueos & Comisiones   │                      │ • Abonos Parciales (≥$100)│
     │  • Productos & Personal   │                      │ • Cierre de Ruta 16:00 hrs│
     └───────────────────────────┘                      └───────────────────────────┘
```

### Matriz de Responsabilidades por Rol

| Módulo / Función | Administrador | Promotor de Campo |
| :--- | :---: | :---: |
| **Panel Ejecutivo (KPIs y Gráficas)** | Visualización Completa | Acceso restringido |
| **Directorio de Clientes** | Alta, edición, reasignación libre | Registro auto-asignado a su cartera |
| **Originación de Préstamos** | Creación inmediata en estado `Activo` | Solicitud en estado `En Evaluación` |
| **Dictamen de Solicitudes** | Aprobar o Rechazar con motivo | Sin permisos |
| **Reasignación de Cartera** | Permitido en clientes y préstamos | Estrictamente bloqueado |
| **Cobranza en Campo** | Supervisión global | Cobro exclusivo de cuotas asignadas |
| **Abonos Parciales** | Autorización y supervisión | Registro en campo (mínimo $100.00) |
| **Visitas Fallidas (Fuerza Mayor)** | Dictamen (Aprobar o Rechazar mora) | Registro con causa tipificada |
| **Cierre de Ruta y Arqueo** | Conciliación de fichas de depósito | Envío de comprobante al 100% (corte 16:00 hrs) |
| **Autorizaciones Extemporáneas** | Dictamen de aprobación/rechazo | Solicitud con justificación escrita |
| **Cálculo de Comisiones** | Vista institucional consolidada | Vista personal de su liquidación |
| **Catálogo de Productos** | Creación, edición y borrado | Acceso bloqueado |
| **Gestión de Personal** | Altas, edición y control de estatus | Acceso bloqueado |

---

## 4. Módulo 1: Autenticación y Acceso Seguro

Ubicación: `/login`

El punto de entrada al sistema garantiza la confidencialidad de la información y la trazabilidad de cada acción operativa.

### Pasos para Iniciar Sesión
1. Ingrese su **Correo Electrónico** corporativo registrado.
2. Ingrese su **Contraseña**. Puede hacer clic en el ícono de ojo para verificar los caracteres ingresados.
3. Haga clic en **Iniciar Sesión**.
4. **Enrutamiento Automático:**
   * Si es **Promotor de Campo**, el sistema lo redirigirá inmediatamente al módulo de **Cobranza en Campo** (`/cobranza`) para iniciar su jornada sin distracciones.
   * Si es **Administrador**, será dirigido al **Panel Ejecutivo** (`/`).

### Cierre de Sesión
* Haga clic en el botón de **Cerrar Sesión** ubicado en el extremo derecho de la barra superior (**Navbar**) o al final de la barra lateral (**Sidebar**).

---

## 5. Módulo 2: Panel Ejecutivo y Métricas en Tiempo Real

Ubicación: `/` (Exclusivo Administradores)

Ofrece una visión panorámica de la salud financiera de la microfinanciera, sincronizada en tiempo real con la base de datos PostgreSQL.

### Indicadores Clave de Desempeño (KPIs)
* **Cartera Activa:** Monto monetario total pendiente de cobro en créditos con estatus `Activo` y `En Mora`.
* **Cobrado Hoy:** Suma neta acumulada de todos los pagos registrados por promotores durante el día en curso.
* **Índice de Morosidad:** Porcentaje de préstamos que presentan cuotas vencidas en comparación con el total de la cartera.
* **Clientes Activos:** Número de expedientes de clientes en estado vigente.

### Gráficas de Análisis
1. **Comportamiento de Cobranza Semanal (Gráfica de Área):** Compara día a día (Lunes a Domingo) la meta de cobro proyectada frente al importe real recaudado.
2. **Salud de la Cartera (Gráfica de Dona):** Distribución visual entre créditos *Activos al día*, *En Mora* y *Liquidados*.

### Herramientas del Panel
* **Exportar JSON:** Descarga un respaldo íntegro de clientes, préstamos y pagos en formato JSON estructurado.
* **Ir a Ruta de Cobro:** Acceso directo a la supervisión operativa del día.
* **Transacciones Recientes:** Bitácora en vivo con los últimos recibos generados (número de recibo, cliente, folio del préstamo, cuota amortizada, monto y método de pago).

---

## 6. Módulo 3: Directorio y Expediente de Clientes

Ubicación: `/clientes` y `/clientes/[id]`

Permite gestionar el expediente completo de cada beneficiario, su historial crediticio y sus referencias personales.

### 6.1 Búsqueda y Filtrado
* **Buscador de Texto:** Localice clientes en tiempo real por Nombre, Folio de expediente (`CLI-XXXX`), CURP o Teléfono.
* **Filtro por Score Crediticio:** Excelente, Bueno, Regular, Alto Riesgo.
* **Filtro por Promotor Asignado:** Permite al Administrador filtrar la cartera por colaborador.

### 6.2 Registro de Nuevo Cliente
Haga clic en **Nuevo Cliente** para abrir el formulario estructurado. Los campos se validan secuencialmente de arriba hacia abajo:

1. **Datos Personales:**
   * **Nombre Completo:** Obligatorio (mínimo 3 caracteres).
   * **Teléfono Celular:** 10 dígitos numéricos estrictos.
   * **Correo Electrónico:** Opcional (formato válido si se ingresa).
   * **CURP:** 18 caracteres alfanuméricos oficiales.
   * **Folio INE / Identificación:** Obligatorio.
   * **RFC:** Opcional.
   * **Score Crediticio:** Selección entre Excelente, Bueno, Regular o Alto Riesgo.
2. **Asignación de Cartera:**
   * **Promotor de Campo:** El campo queda bloqueado y se auto-asigna a su propio usuario.
   * **Administrador:** Puede seleccionar libremente un promotor activo mediante el buscador integrado.
3. **Dirección Estructurada del Domicilio:**
   * Calle, Número Exterior, Número Interior (opcional), Colonia, Código Postal (5 dígitos), Ciudad y Estado.
4. **Referencias Personales Obligatorias (2 Referencias):**
   * Por cada referencia se debe registrar: Nombre completo, Parentesco (*Familiar*, *Amigo*, *Vecino*, *Compañero/Socio*), Teléfono de 10 dígitos y Domicilio completo estructurado.

### 6.3 Expediente Detallado del Cliente (`/clientes/[id]`)
Al hacer clic sobre cualquier cliente en la lista, accederá a su expediente individual:
* **Marcación Telefónica Directa:** Al hacer clic en el número telefónico, se dispara el marcador del dispositivo (`tel:`). El botón adyacente copia el número limpio al portapapeles.
* **Envío de Correo Directo:** Enlace `mailto:` y botón de copiado rápido.
* **Copiado de Folios:** Copie CURP, INE, RFC o direcciones con un solo clic.
* **Reasignación de Cartera:** Botón exclusivo para Administradores para transferir el cliente a otro promotor.
* **Historial de Créditos:** Resumen de préstamos otorgados, saldo restante y estatus.
* **Historial de Recibos:** Lista cronológica de todos los pagos realizados por el cliente.
* **Otorgar Nuevo Crédito:** Botón superior para iniciar una solicitud precargando al cliente.

---

## 7. Módulo 4: Préstamos, Simulador y Originación

Ubicación: `/prestamos` y `/prestamos/nuevo`

Gestiona el ciclo de vida crediticio: solicitud, evaluación de riesgo, tabla de amortización, aprobación y seguimiento.

```
           [Promotor de Campo]                     [Administrador]
                   │                                      │
                   ▼                                      ▼
           ┌──────────────┐                        ┌──────────────┐
           │En Evaluación │                        │    Activo    │
           └───────┬──────┘                        └──────┬───────┘
                   │                                      │
        ┌──────────┴──────────┐                           │
        ▼                     ▼                           │
 ┌──────────────┐      ┌──────────────┐                   │
 │   Aprobado   │      │  Rechazado   │                   │
 └──────┬───────┘      └──────────────┘                   │
        │                                                 │
        └─────────────────┬───────────────────────────────┘
                          │ (Desembolso / Cobranza en curso)
                          ▼
                   ┌──────────────┐
                   │    Activo    │◄────────────┐
                   └──────┬───────┘             │
                          │                     │
                (Cuota vencida)         (Pago con mora)
                          │                     │
                          ▼                     │
                   ┌──────────────┐             │
                   │   En Mora    │─────────────┘
                   └──────┬───────┘
                          │ (Liquidación total de cuotas)
                          ▼
                   ┌──────────────┐
                   │  Liquidado   │
                   └──────────────┘
```

### 7.1 Originación de Crédito (`/prestamos/nuevo`)
1. **Selección del Cliente:** Buscador dinámico por nombre o folio. (Los promotores solo visualizan sus clientes asignados).
2. **Selección del Producto Financiero:** Carga automáticamente la tasa de interés global fija y el plazo predeterminado.
3. **Monto Principal:** Ingrese el capital solicitado (debe ser mayor a $0 MXN).
4. **Fecha de Desembolso / Inicio:** Fecha en que arranca el calendario. No puede ser anterior al día actual.
5. **Promotor Responsable:**
   * Si el usuario es Promotor, queda fijo a su nombre.
   * Si es Administrador, puede asignar al promotor correspondiente.
6. **Simulador de Amortización en Vivo:**
   * A la derecha se genera en tiempo real el desglose de cuotas regulares, fecha de cada vencimiento, capital, interés y saldo pendiente.
   * **Regla de Centavos:** La última cuota absorbe los remanentes de redondeo para garantizar que la suma exacta coincida al 100% con el Total a Pagar.
7. **Guardar Solicitud:**
   * Si fue iniciada por un **Promotor**, se guarda con estatus `En Evaluación`.
   * Si fue iniciada por un **Administrador**, se guarda directamente como `Activo`.

### 7.2 Bandeja de Gestión de Préstamos (`/prestamos`)
* **Aprobación de Solicitudes (Admin):** Al presionar **Aprobar**, el préstamo pasa a estado `Activo`, activando sus cuotas en la ruta de cobro.
* **Rechazo de Solicitudes (Admin):** Al presionar **Rechazar**, se abre un modal obligatorio que exige registrar el motivo del dictamen.
* **Reasignación de Promotor (Admin):** Permite cambiar el promotor asignado a un crédito activo, actualizando automáticamente el teléfono de contacto y el día de cobro semanal.
* **Detalle del Préstamo (Modal):** Permite consultar la tabla de amortización completa, estado individual de cada cuota (`Pendiente`, `Pagado`, `Mora`, `Parcial`, `En Revisión`), fecha real de pago y penalizaciones cobradas.

---

## 8. Módulo 5: Cobranza en Campo, Abonos Parciales y Arqueo

Ubicación: `/cobranza`

Es el módulo central de operación en calle para los promotores y de supervisión para la administración.

> [!IMPORTANT]
> **Regla de Cobranza en Campo:** En la vista operativa **NO se muestran cuotas futuras**. Únicamente se listan cuotas vencidas/en mora y cuotas programadas para la fecha actual.

### 8.1 Pestañas de Cobranza
1. **Ruta de Hoy (Pendientes):** Cuotas que vencen el día de hoy y cuotas con abonos parciales pendientes de liquidación.
2. **En Mora:** Cuotas con atraso acumulado que presentan recargos por penalización.
3. **Cobrados Hoy:** Cuotas cobradas con éxito durante la jornada en curso.
4. **Arqueo y Cierre:** Resumen financiero del día, cuadre de caja y envío de comprobante de depósito.
5. **Autorizaciones (Solo Administrador):** Solicitudes pendientes de cobros extemporáneos y visitas fallidas con exención de mora.

---

### 8.2 Registro de Cobro Regular
1. Ubique al cliente en la pestaña **Ruta de Hoy** o **En Mora**.
2. Haga clic en **Cobrar Cuota**.
3. El modal muestra el saldo de la cuota y calcula automáticamente el recargo por mora si está vencida.
4. Seleccione el método de pago: **Efectivo**, **Transferencia** o **Tarjeta**.
5. Presione **Confirmar Cobro**. Se emitirá el recibo digital foliado y se actualizará el saldo del crédito.

---

### 8.3 Política de Abonos Parciales
El sistema admite pagos parciales bajo lineamientos estrictos de control financiero:

* **Monto Mínimo:** Todo abono parcial debe ser de al menos **$100.00 MXN**. El sistema rechazará montos inferiores.
* **Excepción para Liquidación de Remanente:** Si el saldo pendiente para terminar de pagar una cuota es menor a $100.00 (por ejemplo, restan $40.00), el sistema permite ingresar ese monto exacto para finiquitar la cuota.
* **Estado `Parcial`:** La cuota adopta el estado `Parcial`.
* **Congelamiento de Mora:** La política estipula que una cuota en estado parcial **no genera recargos moratorios adicionales** en los días subsecuentes sobre el saldo remanente.

---

### 8.4 Cobros Extemporáneos
Cuando un promotor cobra en campo sin conexión o fuera de horario y registra el cobro posteriormente:
1. En el modal de cobro, marque la casilla **¿Es un cobro extemporáneo?**.
2. Seleccione en el calendario la **Fecha Real de Cobro** (no puede ser una fecha futura).
3. Escriba la **Justificación Obligatoria** (mínimo 10 caracteres).
4. El pago se registra en estado `Pendiente` y se envía a la pestaña de **Autorizaciones** del Administrador para su validación formal.

---

### 8.5 Reporte de Visita Fallida (Causa de Fuerza Mayor)
Si el promotor se presenta en el domicilio pero no puede cobrar por motivos de fuerza mayor:
1. En la tarjeta de la cuota, haga clic en **Reportar Visita No Exitosa**.
2. Seleccione el motivo tipificado:
   * *Condiciones climáticas adversas / Inaccesibilidad en ruta*
   * *Emergencia médica o de salud comprobable del cliente*
   * *Siniestro o causa de fuerza mayor en el domicilio*
   * *Cliente ausente con aviso previo justificado*
3. Redacte el detalle de la situación (mínimo 10 caracteres).
4. La cuota pasa a estado `En Revisión` y se traslada a la bandeja de **Autorizaciones** del Administrador:
   * **Aprobada por Admin:** Se exenta y condona la mora de esa cuota.
   * **Rechazada por Admin:** Se restituye la penalización moratoria regular del producto.

---

### 8.6 Arqueo y Cierre Diario de Ruta
Al finalizar las visitas de cobro, el promotor debe realizar su corte contable en la pestaña **Arqueo y Cierre**:

```
Promotor de Campo                      Sistema                      Administrador
       │                                  │                               │
       │─── 1. Cobra hasta las 16:00 ────▶│                               │
       │                                  │ (Cobros >16:00 pasan mañana)  │
       │─── 2. Consulta Arqueo de Hoy ───▶│                               │
       │◀── 3. Total a Depositar (100%) ──│                               │
       │                                  │                               │
       │ (Deposita en banco el 100%)      │                               │
       │─── 4. Envía Folio de Depósito ──▶│                               │
       │                                  │─── 5. Arqueo 'Pendiente' ────▶│
       │                                  │                               │
       │                                  │◀── 6. Concilia Depósito ──────│
       │◀── 7. Notificación Conciliado ───│                               │
```

#### Reglas del Arqueo Diario:
1. **Horario Límite de Corte (16:00:00 hrs):**
   * Todos los cobros registrados antes de las 16:00 hrs entran en el arqueo del día.
   * Cualquier cobro asentado a partir de las **16:00:01 hrs** se separa y se acumula automáticamente en el arqueo del siguiente día hábil.
2. **Cuadre Íntegro Obligatorio (100%):**
   * El promotor debe depositar el total exacto recaudado en efectivo y reportar el **Folio de Depósito Bancario**.
   * No se permiten cierres con montos discrepantes o incompletos.
3. **Conciliación Administrativa:**
   * El Administrador revisa el arqueo reportado, verifica el comprobante bancario y dictamina: **Conciliar** o **Rechazar** (indicando motivo).

---

## 9. Módulo 6: Comisiones Semanales de Cobranza

Ubicación: `/comisiones`

Calcula la remuneración semanal de los promotores de campo bajo un modelo transparente y libre de incentivos distorsionados.

### 9.1 Principios Financieros de Comisión
* **Base Comisionable:** Se calcula **exclusivamente sobre la cobranza ordinaria** (capital e interés de la cuota).
* **Exclusión de Mora:** La mora recaudada **no genera comisión**. Esto garantiza que el promotor priorice mantener a los clientes al corriente.

### 9.2 Tabulador Institucional Escalonado

| Rango de Clientes | Porcentaje de Comisión |
| :---: | :---: |
| **0 a 19 clientes** | **5%** |
| **20 a 29 clientes** | **6%** |
| **30 a 49 clientes** | **7%** |
| **50 a 69 clientes** | **8%** |
| **70 a 89 clientes** | **9%** |
| **90 o más clientes** | **10%** |

### 9.3 Criterios de Asignación de Escalón
El Administrador puede alternar el criterio de cálculo en cualquier momento:
1. **Cartera Asignada (Predeterminado):** El escalón porcentual se determina por el número total de clientes activos en la cartera del promotor.
2. **Clientes Cobrados en Semana:** El escalón se determina por la cantidad de clientes que realizaron al menos un pago durante la semana evaluada.

### 9.4 Navegación Semanal
* El selector de semanas permite auditar la **Semana en Curso**, la **Semana Pasada** o semanas históricas anteriores.
* Los Administradores disponen de un filtro por promotor y una fila de **Totales Institucionales** para coordinar la dispersión de nómina.

---

## 10. Módulo 7: Catálogo de Productos Financieros

Ubicación: `/productos` (Exclusivo Administradores)

Permite definir las condiciones crediticias de los productos ofrecidos por la financiera.

### Parámetros de un Producto Financiero
* **Nombre Comercial:** Identificador del producto (ej. *Crédito Semanal Impulso 10 Semanas*).
* **Descripción:** Condiciones generales y público objetivo.
* **Frecuencia de Pago:** `semanal` o `diario`.
* **Plazo:** Número total de cuotas fijas a liquidar (ej. 10 cuotas).
* **Tasa de Interés Global (%):** Porcentaje fijo sobre el capital prestado.
* **Tipo de Penalización por Mora:**
  * **Porcentaje (`porcentaje`):** Se aplica un porcentaje sobre la cuota regular por cada período vencido.
  * **Monto Fijo (`monto_fijo`):** Se aplica un valor monetario estipulado por cada período vencido.
* **Valor de Penalización:** Importe numérico del recargo.

### Acciones Disponibles
* **Crear / Editar Producto:** Abre el modal de configuración con validación estricta de parámetros.
* **Activar / Pausar:** Permite suspender temporalmente la oferta de un producto sin eliminarlo del historial.
* **Eliminación Segura:** Requiere confirmación mediante `ConfirmModal`. Si el producto ya cuenta con créditos asociados, se preserva su integridad referencial.

---

## 11. Módulo 8: Gestión de Personal y Usuarios

Ubicación: `/usuarios` (Exclusivo Administradores)

Centraliza el alta, modificación y control de accesos de todo el equipo operativo.

### 11.1 Alta de Colaboradores
Al hacer clic en **Nuevo Colaborador**, se despliega el formulario validado:
1. **Credenciales Básicas:**
   * Nombre completo, Correo electrónico institucional, Contraseña segura (mínimo 6 caracteres con mayúsculas y números), Teléfono de 10 dígitos.
   * Selección de Avatar institucional.
2. **Rol del Sistema:**
   * `Administrador`: Acceso total.
   * `Promotor de Campo`: Operación de cartera y cobranza.
3. **Día de Cobro Asignado:**
   * Catálogo de Lunes a Domingo para promotores con rutas semanales.
4. **Expediente Completo para Promotores:**
   * CURP (18 caracteres).
   * Folio de Identificación Oficial (INE).
   * Fecha de Nacimiento (valida automáticamente mayoría de edad).
   * Domicilio particular estructurado.
   * Dos referencias familiares/personales con domicilio y número telefónico.

### 11.2 Control de Estado
* Desde la tabla principal, el Administrador puede activar o suspender el acceso de cualquier colaborador con un clic en el interruptor de estatus.

---

## 12. Políticas Financieras y Reglas de Negocio

A continuación se resumen las fórmulas y directrices matemáticas que rigen la plataforma:

### 12.1 Cálculo de Préstamos
$$\text{interesTotal} = \text{round}\left(\text{principal} \times \frac{\text{tasaInteresGlobal}}{100}\right)$$
$$\text{totalAPagar} = \text{principal} + \text{interesTotal}$$
$$\text{cuotaRegular} = \text{round}\left(\frac{\text{totalAPagar}}{\text{plazos}}\right)$$
$$\text{cuotaFinal} = \text{saldoPendiente}$$

### 12.2 Penalización por Mora Acumulada
$$\text{moraTotal} = \text{cuotasAtrasadas} \times \text{moraUnitaria}$$

### 12.3 Resumen de Límites y Horarios Operativos
* **Monto mínimo de abono parcial:** **$100.00 MXN** (salvo liquidación de remanente menor a $100).
* **Corte diario de cobranza:** **16:00:00 hrs**.
* **Cuadre de depósito:** **100% exacto**.
* **Base de comisiones:** Cobranza ordinaria (mora excluida al 100%).

---

## 13. Buenas Prácticas de Interfaz y Navegación

* **Uso de Modales:** Todos los modales del sistema se cierran de forma segura presionando la tecla `Escape` o haciendo clic en el botón de cancelar. No se cierran por clic accidental en el fondo para evitar pérdida involuntaria de datos.
* **Sin Diálogos Nativos:** Las operaciones sensibles emplean componentes React con confirmación explícita, nunca alertas nativas del navegador.
* **Validación Secuencial:** Los formularios reportan errores de arriba hacia abajo, indicando con precisión el primer campo que requiere atención.
* **Operación Móvil:** Todas las pantallas de cobranza y detalle de clientes están optimizadas para su utilización en dispositivos móviles y tabletas en campo.

---
*Manual oficial de usuario para Financiera Impulso. Versión 1.0.*
