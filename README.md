# KOF-SMART Maintenance AI — Frontend (Etapa 1)

React + Vite + Tailwind CSS v4. Solo frontend, con datos simulados en `src/data/`.

## Arranque

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Páginas de esta etapa

- `/dashboard` — Dashboard (EDA): filtros de máquinas y periodo, 4 indicadores, 5 gráficas y vista previa de predicciones y mantenimiento.
- `/predicciones` — Predicciones de falla: 4 indicadores, 3 filtros y matriz predictiva con descarga CSV. Acepta `?maquina=M04`.

Las demás opciones del menú muestran una pantalla de "siguiente etapa".

## Estructura

```
src/
  components/layout   Navbar, Sidebar, menú de perfil, logo
  components/ui       Card, StatCard, Dropdown, filtros, botón Subir Excel
  components/charts   Gráficas (Recharts)
  context/            Usuario (foto, sesión) y avisos
  data/               Datos simulados: máquinas, paros, telemetría, predicciones
  pages/              Dashboard, Predicciones
```

## Conexión con el backend (siguiente etapa)

Los datos simulados están aislados en `src/data/`. Para conectar la API de FastAPI,
reemplaza esas funciones por llamadas `fetch` a `import.meta.env.VITE_API_URL`
y conecta `UploadExcelButton` al endpoint de subida.

`vercel.json` ya incluye la regla para que las rutas de React Router funcionen en Vercel.
