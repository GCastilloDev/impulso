---
name: financial-core
description: >-
  Especialista y Guardián de Fórmulas Financieras y Reglas de Negocio de Microcrédito. Audita cálculos de amortización, devengo de mora, prelación de pagos, cierres de caja y comisiones.
---

# Skill: Especialista en Fórmulas y Reglas Financieras (financial-core)

Este skill define la responsabilidad del agente encargado de garantizar la exactitud matemática y financiera de Financiera Impulso. En una institución microfinanciera, las diferencias de centavos y las reglas ambiguas rompen la contabilidad y la confianza operativa.

---

## 1. Principios Matemáticos y Financieros
1. **Cero Tolerancia a Desfases:** Todo cálculo debe cuadrar al centavo. La última cuota de una tabla de amortización debe absorber cualquier residuo por redondeo para que el total pagado iguale exactamente `Capital + Interés Total`.
2. **Moneda y Redondeo:** Los montos se manejan en pesos mexicanos (MXN) con redondeo estándar a 2 decimales (`Math.round(val * 100) / 100`), evitando acumulación de errores de coma flotante.
3. **Prelación Estricta de Aplicación de Pagos:**
   Ante cualquier abono o pago recibido, los fondos deben aplicarse en el siguiente orden riguroso:
   $$\text{Monto Recibido} \longrightarrow 1^\circ\ \text{Mora Acumulada} \longrightarrow 2^\circ\ \text{Interés Ordinario} \longrightarrow 3^\circ\ \text{Capital}$$

---

## 2. Reglas del Negocio Validadas

### A. Fórmulas de Crédito (Interés Global Fijo)
* **Interés Total:** $$\text{Interés} = \text{Monto Solicitado} \times \left(\frac{\text{Tasa Porcentual}}{100}\right)$$
* **Monto Total a Pagar:** $$\text{Total} = \text{Monto Solicitado} + \text{Interés}$$
* **Monto de Cuota Ordinaria:** $$\text{Cuota} = \text{round}\left(\frac{\text{Total}}{\text{Número de Cuotas}}\right)$$
* **Ajuste de Última Cuota:** $$\text{Última Cuota} = \text{Total} - (\text{Cuota} \times (\text{Número de Cuotas} - 1))$$

### B. Moratorios y Días de Gracia
* La mora se devenga únicamente tras vencer la fecha límite de pago y expirar los días de gracia estipulados en el producto.
* Cuota con mora = `Cuota Ordinaria + Recargo Moratorio`.

### C. Abonos Parciales
* **Monto Mínimo de Abono:** $\$100.00\ \text{MXN}$ (regla estricta). Excepción única: cuando el saldo remanente total para liquidar la cuenta sea inferior a $\$100.00$.
* **Estado de Cuota:** Pasa a `Parcial` y se congela el devengo de moratorios adicionales sobre el remanente mientras se mantenga el acuerdo de pago.

### D. Cierre de Ruta y Arqueo Diario (16:00 hrs)
* **Hora Límite de Corte:** 16:00 hrs. Los cobros registrados después de esta hora pasan contablemente a la ruta del día hábil siguiente.
* **Cuadre Estricto al 100%:** La suma de recibos de pago emitidos por el promotor debe coincidir exactamente con el efectivo reportado. No se autoriza cierre de arqueo con faltantes sin dictamen de supervisor.

### E. Tabulador de Comisiones Semanales
* Se calculan exclusivamente sobre cobranza ordinaria efectivamente cobrada (**la mora no comisiona**).
* El porcentaje aplicable (rango típico 5% - 10%) se determina según el tabulador escalonado por tamaño de cartera y meta alcanzada.
