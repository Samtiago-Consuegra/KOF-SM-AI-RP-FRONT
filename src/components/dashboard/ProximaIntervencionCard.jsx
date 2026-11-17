import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarCog, CalendarPlus, Clock3, Factory, ListChecks, Upload } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import CondicionParadaBadge from '../mantenimiento/CondicionParadaBadge.jsx'
import EjecucionBadge from '../mantenimiento/EjecucionBadge.jsx'
import { textoMaquinas } from '../../utils/paradas.js'
import { duracion, tareaPrincipal, textoRelativo, useProximaIntervencion } from '../../hooks/useProximaIntervencion.js'

// Mismos colores de prioridad que las tablas de Mantenimiento; Crítica usa el rojo de marca.
const PRIORIDAD = {
  'Crítica': 'bg-primary-500 text-white',
  'Alta': 'bg-primary-50 text-primary-600',
  'Media': 'bg-ink-100 text-ink-700',
  'Baja': 'bg-tertiary-50 text-tertiary-700',
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors active:scale-[0.98]'

/** Próxima parada real del motor (toda la línea; no sigue el filtro de máquinas). */
export default function ProximaIntervencionCard() {
  const { loading, calculando, sinDatosMotor, mensaje, parada, urgentesPendientes, semanaInicio, hoy } = useProximaIntervencion()
  const estado = calculando ? 'calculando' : loading ? 'cargando' : sinDatosMotor ? 'sin-datos' : parada ? 'parada' : 'vacio'
  const principal = tareaPrincipal(parada)
  const nTareas = parada?.tareasDetalle?.length ?? 0
  const todaLaLinea = (parada?.maquinas?.length ?? 0) >= 4

  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Subtítulo en su propio renglón, alineado con el texto del título (no con el icono) */}
      <div className="flex items-start gap-2">
        <CalendarCog className="size-5 shrink-0 mt-0.5 text-tertiary-600" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="font-bold leading-snug text-ink-900 text-balance">Planes de mantenimiento</h2>
          <p className="kof-fade text-xs text-ink-500 whitespace-nowrap">Toda la Línea 4</p>
        </div>
      </div>

      {/* key por estado: cada cambio entra con el mismo fade del dashboard */}
      <div key={estado} className="kof-fade-up flex flex-col gap-4" aria-live="polite">
        {estado === 'cargando' && <Skeleton className="h-[220px]" />}

        {estado === 'calculando' && (
          <p className="flex items-center gap-3 rounded-xl bg-tertiary-50 p-4 text-sm font-medium text-tertiary-800">
            <span className="kof-pulse-teal relative inline-flex size-2.5 shrink-0" aria-hidden="true">
              <span className="kof-pulse-ring absolute inset-0 rounded-full bg-tertiary-600" />
              <span className="relative inline-flex size-2.5 rounded-full bg-tertiary-600" />
            </span>
            Calculando el plan…
          </p>
        )}

        {estado === 'sin-datos' && (
          <>
            <p className="flex items-start gap-2 rounded-xl bg-neutral-50 p-4 text-sm text-ink-600">
              <AlertTriangle className="size-4 mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
              {mensaje ?? 'El motor aún no tiene archivos para calcular el plan.'}
            </p>
            <Link to="/mantenimiento" className={`${btn} bg-neutral-100 hover:bg-neutral-200 text-ink-900`}>
              <Upload className="size-4" aria-hidden="true" /> Ir a Mantenimiento para subir archivos
            </Link>
          </>
        )}

        {estado === 'vacio' && (
          <>
            <p className="rounded-xl bg-neutral-50 p-4 text-sm text-ink-600">No hay paradas programadas en las próximas dos semanas.</p>
            <Link to="/mantenimiento" className={`${btn} bg-primary-500 hover:bg-primary-600 text-white`}>
              <CalendarPlus className="size-4" aria-hidden="true" /> Programar parada
            </Link>
          </>
        )}

        {estado === 'parada' && (
          <>
            <div className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-ink-500">Próxima intervención</p>
                <span className="text-xs font-semibold text-ink-900 whitespace-nowrap">{textoRelativo(parada.fecha, parada.horaInicio, hoy)}</span>
              </div>
              <p className="mt-1 text-lg font-bold leading-snug text-ink-900 line-clamp-2">{parada.titulo}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-600">
                <Factory className="size-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                <span className="truncate">{todaLaLinea ? 'Toda la línea' : textoMaquinas(parada) || 'Sin máquina'}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-700">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock3 className="size-4 text-ink-400" aria-hidden="true" />
                  {parada.horaInicio} – {parada.horaFin}
                  <span className="text-ink-400">· {duracion(parada.horaInicio, parada.horaFin)}</span>
                </span>
                <CondicionParadaBadge condicion={parada.condicion} />
                {parada.ejecucion && <EjecucionBadge ejecucion={parada.ejecucion} />}
              </div>

              <div className="mt-3 border-t border-neutral-100 pt-3 text-sm">
                <p className="flex items-center gap-1.5 text-ink-600">
                  <ListChecks className="size-4 text-ink-400" aria-hidden="true" />
                  {nTareas === 0 ? 'Sin tareas asignadas' : `${nTareas} tarea${nTareas === 1 ? '' : 's'} asignada${nTareas === 1 ? '' : 's'}`}
                </p>
                {principal && (
                  <p className="mt-1.5 flex items-start justify-between gap-2">
                    <span className="min-w-0 line-clamp-2 font-medium text-ink-900">{principal.descripcion}</span>
                    {PRIORIDAD[principal.prioridad] && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORIDAD[principal.prioridad]}`}>
                        {principal.prioridad}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {urgentesPendientes > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary-700">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                {urgentesPendientes} tarea{urgentesPendientes === 1 ? '' : 's'} crítica{urgentesPendientes === 1 ? '' : 's'} o alta{urgentesPendientes === 1 ? '' : 's'} sin programar esta semana
              </p>
            )}

            <Link
              to={`/mantenimiento?semana=${semanaInicio}&parada=${encodeURIComponent(parada.id)}`}
              className={`${btn} bg-neutral-100 hover:bg-neutral-200 text-ink-900`}
            >
              Ver plan de mantenimiento <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </Card>
  )
}
