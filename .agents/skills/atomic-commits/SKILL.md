---
name: atomic-commits
description: >-
  Procedimiento para generar commits atómicos en git con Conventional Commits en español. Desglosa los cambios paso a paso evitando mega-commits y sin atribuciones a IA.
---

# Guía de Commits Atómicos y Convencionales

Este skill define el procedimiento estricto para registrar el trabajo en Git de manera limpia, granular y trazable.

---

## 1. Reglas Inquebrantables
1. **Commits Atómicos (SRP):** Cada commit debe contener un único cambio lógico independiente. Si se modificó la base de datos, un server action y una pantalla de UI, deben crearse commits separados para cada capa.
2. **Cero Mega-Commits:** Queda terminantemente prohibido hacer un solo commit que englobe todo el trabajo de una sesión.
3. **Conventional Commits en Español:** Los prefijos y la descripción deben estar redactados en español formal y claro.
4. **Sin Atribución a IA:** **NUNCA** incluir `Co-Authored-By`, `Generated-by` ni ninguna mención a herramientas o asistentes de IA. Solo mensajes convencionales humanos.

---

## 2. Tipos de Commits Permitidos
* `feat:` Nueva funcionalidad para el usuario o sistema (ej. `feat(prestamos): agregar dictamen con motivo de rechazo`).
* `fix:` Corrección de un error o comportamiento inesperado (ej. `fix(cobranza): corregir desfase de centavos en la ultima cuota`).
* `refactor:` Reorganización de código que no altera el comportamiento externo (ej. `refactor(actions): desacoplar calculo de amortizacion`).
* `style:` Ajustes visuales, espaciados o diseño sin alterar lógica (ej. `style(modales): ajustar espaciado del boton cancelar`).
* `docs:` Documentación, reglas del agente o README (ej. `docs(rules): documentar formulas de interes global`).
* `chore:` Mantenimiento de configuración, dependencias o tooling (ej. `chore: actualizar configuracion de codegraph`).
* `test:` Adición o corrección de pruebas unitarias o de integración.

---

## 3. Protocolo de Ejecución Paso a Paso

1. **Inspección de Cambios:**
   Ejecutar `git status -s` y `git diff` para mapear qué archivos fueron modificados.
2. **Clasificación y Agrupación:**
   Agrupar los archivos por responsabilidad:
   * Grupo A: Esquema Prisma / Migraciones.
   * Grupo B: Tipos y Reglas de Negocio.
   * Grupo C: Server Actions / Backend.
   * Grupo D: Componentes y Pantallas UI.
3. **Staging y Commit Granular:**
   Para cada grupo lógico:
   ```bash
   git add <archivos_especificos>
   git commit -m "<tipo>(<alcance>): <descripcion clara y en minusculas>"
   ```
4. **Validación:**
   Verificar con `git log -n <N> --oneline` y `git status` que no queden cambios residuales desordenados.
