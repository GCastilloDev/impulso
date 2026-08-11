# Reglas de Validación de Formularios

1. **Validación Estricta de Arriba hacia Abajo (Orden Visual)**: 
   Las validaciones de cualquier formulario DEBEN ejecutarse en el MISMO ORDEN VISUAL en que aparecen los campos en la pantalla (de arriba hacia abajo y de izquierda a derecha en cada sección).
   
2. **Secuencia de Errores Esperada**:
   Al enviar un formulario incompleto o inválido, el sistema DEBE evaluar y reportar el PRIMER campo faltante o inválido según el orden del formulario.

3. **Sin Omisiones de Campos Obligatorios**:
   No se debe validar un campo posterior (ej. teléfono o contraseña) antes de haber verificado los campos requeridos anteriores (ej. Nombre Completo, Correo Electrónico, Rol, CURP, etc.).
