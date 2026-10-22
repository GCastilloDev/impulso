---
name: qa-testing
description: >-
  Especialista en Aseguramiento de Calidad y Casos de Borde. Diseña matrices de prueba para cálculos financieros, concurrencia, validación de entradas extremas y regresión funcional.
---

# Skill: Especialista en QA y Casos de Borde (qa-testing)

Este skill define la responsabilidad del agente encargado de someter cada funcionalidad a pruebas de estrés, casos límite y validaciones cruzadas antes de dar por completado un nodo del grafo de tareas.

---

## 1. Filosofía de Pruebas
> **Si no se probó en el límite, está roto.** Las microfinanzas operan en escenarios caóticos: conectividad intermitente, cobros de última hora, clientes que pagan $101 pesos de una cuota de $500, o fechas límite en días festivos.

---

## 2. Matriz Obligatoria de Casos Límite

Para cada funcionalidad en el SDD, QA debe formular y comprobar los siguientes escenarios:

### A. Casos de Borde Financieros
1. **El Centavo Huérfano:** Verificar que una tabla de amortización de 14 semanas con montos impares (ej. préstamo de $\$3,333.00$ al 10%) cuadre exactamente al centavo en la cuota final.
2. **Abono Menor al Mínimo:** Intentar abonar $\$99.00$ y confirmar que el sistema lo rechaza por la regla del mínimo de $\$100.00$.
3. **Abono de Remanente Menor a $100:** Verificar que si el saldo restante para liquidar el préstamo es de $\$45.00$, el sistema **sí** permita cobrar los $\$45.00$ y marque el crédito como `Liquidado`.
4. **Prelación en Casos Mixtos:** Si un cliente debe $\$100$ de mora y $\$500$ de cuota, y paga $\$250$, verificar que se descuenten primero los $\$100$ de mora y los $\$150$ restantes se apliquen a interés/capital, dejando la cuota en estado `Parcial`.

### B. Casos de Calendario y Horario
1. **Corte de las 16:00 hrs:** Simular un cobro a las 15:59 hrs (entra al arqueo de hoy) vs 16:01 hrs (pasa a la cartera del siguiente día).
2. **Frecuencias y Días No Laborales:** Verificar que las fechas de pago no caigan en domingos cuando la política operativa lo prohíba.
3. **Años Bisiestos y Fin de Mes:** Verificar préstamos otorgados el 29 de febrero o el 31 de un mes.

### C. Concurrencia e Idempotencia
1. **Doble Clic en Cobro:** Comprobar que dos solicitudes simultáneas de cobro con el mismo monto no generen doble cargo a la cuota ni emitan dos recibos duplicados.
2. **Arqueo con Caja Abierta:** Intentar cerrar el arqueo de un promotor mientras una transacción de cobro sigue procesándose.

---

## 3. Salida de Validación
Cada informe de QA debe contener:
* Matriz de Casos Ejecutados (Entrada esperada vs Resultado real).
* Dictamen: **Pass** / **Fail**.
* En caso de fallo: Pasos de reproducción detallados y evidencia técnica para el rol `fullstack-dev`.
