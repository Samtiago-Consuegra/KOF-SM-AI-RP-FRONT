import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Agrupa dependencias estables en chunks propios para que el navegador las
 * cachee entre despliegues y no viajen en el arranque del login.
 * Los ids de Rollup siempre usan `/`, pero normalizamos por si acaso.
 */
function manualChunks(id) {
  // El helper de precarga de Vite acaba dentro de vendor-export porque ExcelJS
  // usa import() internos; si vive ahí, el index lo importa y el navegador
  // descarga todo el chunk de exportación al abrir el login. Lo fijamos al
  // chunk de React, que ya se carga siempre.
  if (id.includes('preload-helper')) return 'vendor-react'
  if (!id.includes('node_modules')) return undefined
  const path = id.replace(/\\/g, '/')

  if (/\/(react|react-dom|react-router|react-router-dom|@remix-run|scheduler)\//.test(path)) {
    return 'vendor-react'
  }
  if (/\/(recharts|recharts-scale|react-smooth|victory-vendor)\//.test(path) || /\/d3-[^/]+\//.test(path)) {
    return 'vendor-charts'
  }
  if (/\/(exceljs|jspdf|jspdf-autotable|html2canvas)\//.test(path)) {
    return 'vendor-export'
  }
  return undefined
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
