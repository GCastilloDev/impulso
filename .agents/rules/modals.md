# Reglas de Comportamiento para Modales

1. **Cierre con Tecla Escape**: Todos los modales del sistema DEBEN cerrar al presionar la tecla `Escape`.
2. **Sin Cierre por Clic Externo (Backdrop Click)**: Queda ESTRICTAMENTE PROHIBIDO cerrar modales al hacer clic fuera de ellos (en el fondo o backdrop). El usuario únicamente puede cerrar el modal usando la tecla `Escape`, el botón de cerrar (`✕`) o el botón `Cancelar`.
3. **Dropdowns y Comboboxes**: Los menús desplegables (combobox, selectores flotantes) pueden cerrar al hacer clic fuera, pero los modales de diálogo no.
4. **No Usar `confirm()` ni `alert()` Nativos de JavaScript**: Todos los mensajes de confirmación o fricción (eliminaciones, acciones críticas, advertencias) DEBEN utilizar modales de React personalizados (ej. `ConfirmModal`) con el estilo visual de la aplicación. Queda estrictamente prohibido usar alertas/diálogos nativos del navegador.
