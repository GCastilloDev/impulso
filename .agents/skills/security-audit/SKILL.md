---
name: security-audit
description: >-
  Auditor de Seguridad Full-Stack y Protección de PII. Valida control de acceso basado en roles (RBAC), sanitización de inputs, integridad en Server Actions y resguardo de datos sensibles de clientes.
---

# Skill: Auditor de Seguridad Full-Stack y Protección de PII (security-audit)

Este skill define la responsabilidad del agente encargado de auditar y blindar la aplicación frente a vulnerabilidades lógicas, fugas de información confidencial y accesos no autorizados. Tratamos a Financiera Impulso con el rigor de un sistema bancario regulado.

---

## 1. Control de Acceso Basado en Roles (RBAC)

En Financiera Impulso conviven dos roles principales con límites operativos estrictos:
* **Administrador:** Acceso a métricas globales, catálogo de productos, reasignación de promotores, auditoría de arqueos y dictamen de visitas fallidas.
* **Promotor de Campo:** Acceso restringido exclusivamente a su ruta y cartera asignada.

### Reglas de Auditoría RBAC:
1. **Server Actions Blindadas:** Cada Server Action debe verificar la sesión activa y validar si el usuario autenticado tiene permisos para ejecutar la mutación. **Nunca confiar en que el frontend ocultó el botón.**
2. **Aislamiento de Expedientes:** Un Promotor de Campo solo puede ver o cobrar a clientes asignados a su identificador (`promotorId === session.user.id`). Cualquier intento de consultar o cobrar préstamos de otra ruta debe arrojar error de autorización.

---

## 2. Protección de PII (Datos Personales Sensibles)
Los expedientes de clientes y promotores resguardan datos de alta sensibilidad:
* CURP, Folio INE, Domicilio particular, Teléfonos personales y referencias familiares.
* **Regla de Exposición Mínima:** Las consultas de listados o tablas resumen nunca deben retornar campos innecesarios como CURP o INE a menos que se abra el detalle del expediente.
* **Credenciales:** Los hashes de contraseñas (`password`) jamás deben salir de la base de datos hacia el cliente, ni siquiera en objetos de sesión.

---

## 3. Seguridad Full-Stack y OWASP Top 10

### Frontend:
* **Cero Variables Privadas en Cliente:** Auditar que variables de entorno sensibles (ej. `DATABASE_URL`, secretos de NextAuth) no lleven el prefijo `NEXT_PUBLIC_` ni se importen en componentes `'use client'`.
* **Sanitización de Salidas:** Protección contra XSS al renderizar cadenas o notas de cobrador.

### Backend y Base de Datos:
* **Integridad de Parámetros:**
  * Validar montos positivos en pagos y préstamos ($Monto > 0$).
  * Prevenir inyecciones o desbordamientos mediante validación de tipos e inputs antes de llegar a Prisma.
* **Prevención de Ataques de Tiempo / Concurrencia:** Emplear transacciones de base de datos con bloqueo de registros cuando dos cobros intenten registrarse sobre la misma cuota simultáneamente.
