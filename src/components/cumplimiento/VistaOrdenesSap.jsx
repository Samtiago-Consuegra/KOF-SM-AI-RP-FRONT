import { useEffect, useMemo, useState } from 'react'
import { DatabaseZap } from 'lucide-react'
import Card from '../ui/Card.jsx'
import ResumenSapCards from './ResumenSapCards.jsx'
import CumplimientoChart from './CumplimientoChart.jsx'
import ChartExpandedModal from './ChartExpandedModal.jsx'
import OrdenesSapTable from './OrdenesSapTable.jsx'
import DetalleOrdenSapModal from '../mantenimiento/DetalleOrdenSapModal.jsx'
import {
  cumplimientoSapPorMaquina, desgloseTipos, getOrdenesSapPeriodo, resumenOrdenes,
} from '../../services/ordenesSapCumplimiento.js'

/** Vista "Órdenes de SAP": misma distribución que la de paradas, con /motor/ordenes-sap. */
export default function VistaOrdenesSap({ desde, hasta, maquina, tipo = 'week', etiqueta }) {
  const [res, setRes] = useState(null)
  const [orden, setOrden] = useState(null)
  const [ampliada, setAmpliada] = useState(false)

  useEffect(() => {
    let cancelado = false
    setRes(null)
    getOrdenesSapPeriodo({ desde, hasta, maquina })
      .catch((e) => ({ sinDatos: true, mensaje: e?.message || 'No se pudieron cargar las órdenes de SAP.', ordenes: [] }))
      .then((r) => { if (!cancelado) setRes(r) })
    return () => { cancelado = true }
  }, [desde, hasta, maquina])

  const loading = !res
  const ordenes = res?.ordenes
  const esMes = tipo === 'month'
  // La gráfica se calcula con las órdenes ya cargadas: por máquina (semana) o por semana y máquina (mes).
  const datos = useMemo(() => (ordenes
    ? { resumen: resumenOrdenes(ordenes), filas: cumplimientoSapPorMaquina(ordenes, { porSemana: esMes }), tipos: desgloseTipos(ordenes) }
    : null), [ordenes, esMes])

  if (res?.sinDatos) {
    return (
      <Card className="kof-fade-up flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-neutral-100 text-ink-400">
          <DatabaseZap className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-ink-800">Sin datos de SAP</p>
        <p className="max-w-md text-xs text-ink-500">{res.mensaje}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <ResumenSapCards resumen={datos?.resumen} loading={loading} />
      <CumplimientoChart
        rango={{ from: desde, to: hasta, type: tipo }}
        maquina={maquina}
        sap={{ filas: datos?.filas || [], tipos: datos?.tipos || {}, loading }}
        onExpand={() => setAmpliada(true)}
      />
      <ChartExpandedModal
        open={ampliada}
        onClose={() => setAmpliada(false)}
        title="Cumplimiento de órdenes SAP"
        rango={{ from: desde, to: hasta, type: tipo, label: etiqueta }}
        maquina={maquina}
        sap={{ filas: datos?.filas || [], tipos: datos?.tipos || {}, loading }}
        tipos={datos?.tipos || {}}
      />
      <OrdenesSapTable ordenes={ordenes || []} loading={loading} onVerOrden={setOrden} />
      <DetalleOrdenSapModal orden={orden} onClose={() => setOrden(null)} />
    </div>
  )
}
