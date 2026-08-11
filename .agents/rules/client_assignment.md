# Regla de Asignación Automática de Clientes

1. **Asignación Obligatoria por Rol**: Cuando un usuario con rol **Promotor de Campo** registre a un nuevo cliente en el sistema, el cliente DEBE asignarse automáticamente a su propia cartera (a su ID y nombre).
2. **Restricción de Selección**: Los Promotores de Campo NO pueden seleccionar ni reasignar clientes a otros promotores. La interfaz de selección de promotor estará fija e inmutable para su usuario.
3. **Control para Administradores**: Únicamente los **Administradores** tienen la facultad de elegir, cambiar o dejar sin asignar a los promotores de la cartera de clientes.
