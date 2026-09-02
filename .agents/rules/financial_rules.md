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
