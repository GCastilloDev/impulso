# Regla: Orquestación Visual de Subagentes en Herdr

Esta regla establece el protocolo obligatorio para el despacho de subagentes en Financiera Impulso cuando el entorno se ejecuta bajo Herdr (`HERDR_ENV=1`).

---

## 1. Principio Fundamental
> **Cero Agentes Fantasma (Headless):** Queda terminantemente prohibido ejecutar subagentes de desarrollo o revisión como procesos invisibles en segundo plano sin terminal asignada. El usuario debe poder monitorear en tiempo real el ciclo de vida, progreso y consumo de cada agente en la pantalla y sidebar de Herdr.

---

## 2. Protocolo de Despacho en Herdr

Al despachar cualquier tarea derivada del Grafo de Tareas (Task DAG) del SDD:

1. **Creación de Pane Físico:**
   El orquestador debe crear un pane dividido dedicado conservando el directorio de trabajo y sin arrebatar el foco del usuario:
   ```bash
   herdr pane split --current --direction right --no-focus
   ```

2. **Ejecución y Asignación:**
   En el pane creado, se lanza el agente o comando correspondiente con su contexto delimitado al nodo:
   ```bash
   herdr pane run <returned_pane_id> "agy -p '...' "
   ```
   O cuando aplique agente interactivo:
   ```bash
   herdr agent start <pane_id> --agent <nombre_unico>
   ```

3. **Visibilidad en Sidebar y Pantalla:**
   * Cada pane debe etiquetarse con su tarea y rol (ej. `T2B: ui-ux`).
   * El orquestador espera el estado `idle` o `done` mediante los comandos de espera de Herdr (`herdr agent wait` o lectura de salida) sin saturar su propia ventana de contexto.

4. **Worktrees para Tareas Paralelas:**
   Si dos o más subagentes van a modificar archivos simultáneamente:
   * Deben crearse como worktrees hermanos en `../financiera-impulso-worktrees/<nombre-tarea>`.
   * **Prohibido** crear worktrees en directorios temporales (`/tmp`, `/var/tmp`).
   * Cada worktree debe inicializar su propio índice de CodeGraph.
