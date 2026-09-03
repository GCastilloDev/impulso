# Reglas de Negocio Financiero

## 1. Cálculo de Préstamos y Amortización
1. **Tasa de Interés Global Fija:**
   * El interés total se calcula como un porcentaje plano sobre el monto principal:
     $$\text{interesTotal} = \text{round}(\text{principal} \times (\text{tasaInteresGlobal} / 100))$$
   * Total a pagar:
     $$\text{totalAPagar} = \text{principal} + \text{interesTotal}$$
2. **Distribución de Cuotas:**
   * La cuota regular se calcula como:
     $$\text{cuotaRegular} = \text{round}(\text{totalAPagar} / \text{plazos})$$
   * **Ajuste de Centavos (Última Cuota):** Para garantizar que la suma de las cuotas sea exactamente igual a `totalAPagar`, la última cuota (`plazos`) debe absorber cualquier diferencia de redondeo acumulada en el saldo pendiente:
     $$\text{cuotaFinal} = \text{saldoPendiente}$$
3. **Frecuencias de Pago:**
   * **Semanal:** El primer pago se alinea al `diaCobroAsignado` del promotor o cliente (Lunes a Domingo). Los pagos subsecuentes vencen cada 7 días.
   * **Diario:** Los pagos vencen diariamente (de lunes a sábado según la configuración operativa).

---

## 2. Penalización por Mora en Cobranza de Campo
1. **Tipos de Penalización:**
   * **Porcentaje (`porcentaje`):** Se aplica un porcentaje sobre el valor de la cuota regular por cada cuota vencida.
   * **Monto Fijo (`monto_fijo`):** Se cobra un valor monetario fijo estipulado en el producto por cada cuota vencida.
2. **Cálculo Acumulado:**
   * La mora es acumulativa por cada pago/cuota atrasada a la fecha de corte:
     $$\text{moraTotal} = \text{cuotasAtrasadas} \times \text{moraUnitaria}$$
3. **Cobranza de Campo Exclusiva del Día:**
   * En la vista de cobranza en campo no se deben listar cuotas futuras anticipadas, únicamente cuotas vencidas/en mora y cuotas programadas para el día de cobro actual.

---

## 3. Ciclo de Vida y Auditoría de Préstamos
1. **Estatus Válidos:**
   * `En Evaluación` $\rightarrow$ Solicitud creada por un Promotor o Administrador.
   * `Aprobado` $\rightarrow$ Dictaminado positivamente por un Administrador.
   * `Rechazado` $\rightarrow$ Rechazado por un Administrador (requiere motivo de rechazo registrado).
   * `Activo` $\rightarrow$ Crédito entregado/desembolsado con amortización en curso.
   * `Pagado` / `Liquidado` $\rightarrow$ Total de cuotas cubiertas en su totalidad.
   * `En Mora` $\rightarrow$ Crédito con una o más cuotas vencidas sin liquidar.
   * `Incobrable` / `Cancelado` $\rightarrow$ Crédito castigado administrativamente.
2. **Trazabilidad Obligatoria:**
   * Todo préstamo debe registrar quién lo solicitó (`solicitadoPorNombre`, `solicitadoPorRol`, `fechaHoraSolicitud`) y quién lo aprobó (`aprobadoPorNombre`, `fechaHoraAprobacion`).
   * La reasignación de promotores en créditos activos o solicitudes es competencia exclusiva del rol **Administrador**.

---

## 4. Política de Abonos Parciales
1. **Monto Mínimo de Abono:**
   * El monto mínimo para registrar un abono parcial es de **$100.00**.
   * **Excepción de Liquidación de Remanente:** Se permiten montos inferiores a $100.00 (ej. $10, $20, $30, $50) **únicamente** cuando el saldo remanente pendiente de la cuota sea menor a $100.00, permitiendo al cliente liquidar la cuota con el monto exacto restante.
2. **Tratamiento del Remanente y Mora:**
   * Al registrar un abono parcial, la cuota pasa a estado `Parcial`.
   * El saldo remanente pendiente **no genera mora acumulativa** en las fechas subsecuentes; dicho saldo se liquida en el siguiente pago o al final del crédito.

---

## 5. Cierres de Ruta y Arqueo Diario de Cobranza
1. **Horario Límite de Corte (16:00 hrs):**
   * La jornada de cobranza del día concluye a las **16:00 horas**.
   * Todo cobro ingresado en el sistema a partir de las **16:00:01 hrs** se computa y acumula automáticamente en el arqueo del siguiente día hábil.
2. **Cuadre Íntegro Obligatorio (100%):**
   * El promotor debe reportar ficha o folio de depósito/transferencia bancaria por el **100% exacto** de lo recaudado en su jornada. No se permiten cierres parciales ni montos discrepantes.
3. **Conciliación:**
   * El depósito queda registrado en el módulo de arqueo para su cotejo y validación por parte del Administrador.

---

## 6. Cálculo de Comisiones Semanales a Promotores
1. **Base Comisionable:**
   * La comisión se calcula exclusivamente sobre la cobranza ordinaria (monto de cuota cobrado). La mora recaudada **no genera comisión** para evitar incentivos perversos.
2. **Criterio de Escalón:**
   * Por regla general, el escalón porcentual se determina con base en el **total de clientes activos asignados** en la cartera del promotor.
   * El panel de administración debe contar con la opción manual/configurable para calcularlo por clientes efectivamente cobrados si el Administrador lo determina.
3. **Tabulador de Comisiones:**
   * **0 a 19 clientes:** 5%
   * **20 a 29 clientes:** 6%
   * **30 a 49 clientes:** 7%
   * **50 a 69 clientes:** 8%
   * **70 a 89 clientes:** 9%
   * **90 o más clientes:** 10%

---

## 7. Visitas en Campo No Exitosas y Exención de Mora
1. **Registro de Visita Fallida:**
   * Si el promotor no puede cobrar por causa de fuerza mayor (condiciones climáticas, enfermedad comprobable, etc.), registra la visita con importe $0 y motivo tipificado.
2. **Bandeja de Autorización:**
   * La solicitud de exención de mora entra a la bandeja en estado `en_revision`.
3. **Dictamen de Administrador:**
   * El Administrador aprueba (condona la mora de esa cuota) o rechaza (aplica la mora regular del producto).
