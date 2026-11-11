# KOF-SMART Maintenance AI — Frontend

App de mantenimiento predictivo para la Línea 4 BAQ (Coca-Cola FEMSA).
Stack: React + Vite + Tailwind v4. Backend: FastAPI en Render + Supabase.

## Reglas permanentes

- Usa las skills ui-ux-pro-max, animation-designer, ui-animation y ponytail en todo lo visual.
- Respeta la línea de diseño Stitch y la paleta: primario #F40000, oscuro #111827, teal #0D9488, gris #F8F9FA.
- Todo componente o estado nuevo lleva animaciones suaves y respeta prefers-reduced-motion.
- Nunca uses Playwright.
- No modifiques componentes visuales que no se mencionen en la tarea.
- Todas las llamadas al backend pasan por src/api/client.js (token, caché, aviso de servidor lento).

## Motor de planes (backend)

- Regla: "Python calcula, la app solo muestra". El front no calcula prioridades, IPM, MTTR, MTBF, alertas ni asignaciones.
- Los nombres de campo del motor van en español con mayúscula (Maquina, Id_componente, Prioridad…). La traducción a la forma que usan los componentes va en src/api/motorAdapter.js.
- Las respuestas 202 {"status":"calculando"} y {"available": false} son estados normales, no errores.
- Si dudas del formato de un endpoint, consulta el repo del back en ..\KOF-SM-AI-RP-BACK (app/routers/motor.py, app/routers/paradas.py y motor_planes/CONTRATO_DATOS.md).
