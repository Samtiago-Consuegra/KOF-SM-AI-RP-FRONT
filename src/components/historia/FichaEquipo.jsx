import { useEffect, useState } from 'react'
import { Hourglass, Shuffle, Flame, Factory } from 'lucide-react'
import llenadora from '../../assets/maquinas/llenadora.webp'
import empacadora from '../../assets/maquinas/empacadora.webp'
import paletizadora from '../../assets/maquinas/paletizadora.webp'
import envolvedora from '../../assets/maquinas/envolvedora.webp'

const IMAGENES = { llenadora, empacadora, paletizadora, envolvedora }

const FALLA_TIPOS = {
  'Por desgaste': { Icon: Hourglass, chip: 'bg-primary-50 text-primary-600', tooltip: 'Las fallas aumentan con el uso (β de Weibull > 1).' },
  'Aleatoria': { Icon: Shuffle, chip: 'bg-ink-100 text-ink-700', tooltip: 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).' },
  'En racha': { Icon: Flame, chip: 'bg-primary-100 text-primary-800', tooltip: 'Varias fallas seguidas en poco tiempo.' },
}

// El motor rotula la forma como "Desgaste (…)", "Aleatoria (…)", "En racha (…)" o "Pocos datos"
function tipoFalla(forma) {
  const f = String(forma || '')
  if (f.startsWith('Desgaste') || f.startsWith('Por desgaste')) return FALLA_TIPOS['Por desgaste']
  if (f.startsWith('En racha')) return FALLA_TIPOS['En racha']
  return FALLA_TIPOS.Aleatoria
}

const TENDENCIA_CLS = {
  'Empeora': 'bg-[#F40000]/10 text-[#F40000]',
  'Mejora': 'bg-[#0D9488]/10 text-[#0D9488]',
}

const fmtCOP = (v) => (typeof v === 'number'
  ? v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
  : null)

function Fila({ label, children, index = 0, nueva = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 ${nueva ? 'animate-[fade-swap-in_220ms_cubic-bezier(0.22,1,0.36,1)_both]' : ''}`}
      style={nueva ? { animationDelay: `${Math.min(index, 8) * 35}ms` } : undefined}
    >
      <span className="shrink-0 text-sm text-ink-500">{label}</span>
      {children}
    </div>
  )
}

function FichaSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-36 animate-pulse rounded bg-neutral-100" />
      <div className="mt-4 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-5 w-full animate-pulse rounded bg-neutral-100" />)}
      </div>
      <div className="mt-6 h-[220px] animate-pulse rounded-xl bg-neutral-50" />
    </div>
  )
}

// Crossfade de la máquina: al cambiar, la imagen actual sale a la izquierda y
// la nueva entra desde la derecha (Sistema/Componente NO re-animan).
function ImagenMaquina({ maquina, src }) {
  const [prev, setPrev] = useState(null)
  const [current, setCurrent] = useState(maquina)

  useEffect(() => {
    if (maquina !== current) {
      setPrev(current)
      setCurrent(maquina)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquina])

  useEffect(() => {
    if (!prev) return
    const t = setTimeout(() => setPrev(null), 500)
    return () => clearTimeout(t)
  }, [prev])

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center">
      {prev && IMAGENES[prev.toLowerCase()] && (
        <img
          key={prev}
          src={IMAGENES[prev.toLowerCase()]}
          alt=""
          aria-hidden="true"
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 m-auto h-full w-auto max-w-full object-contain rounded-xl animate-[maquina-exit-left_500ms_ease-in_both]"
        />
      )}
      {src ? (
        <img
          key={current}
          src={src}
          alt={`${maquina} de la Línea 4`}
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          className={`relative mx-auto h-full w-auto max-w-full object-contain rounded-xl ${prev ? 'animate-[maquina-enter-right_500ms_ease-out_both]' : 'animate-[maquina-enter-down_600ms_ease-out_both]'}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-neutral-100" role="img" aria-label={`${maquina} de la Línea 4 — imagen no disponible`}>
          <Factory className="size-10 text-ink-300" aria-hidden="true" />
          <span className="text-sm text-ink-400">Imagen no disponible</span>
        </div>
      )}
    </div>
  )
}

export default function FichaEquipo({ ficha, maquina, loading }) {
  if (loading || !ficha) return <FichaSkeleton />

  const tipo = tipoFalla(ficha.fallaPredominante)
  const { Icon } = tipo
  const keyImagen = maquina.toLowerCase()
  const totalMaquinas = ficha.rankingFallas?.length || 4

  const criticidad = typeof ficha.criticidad === 'number'
    ? { texto: `Puesto ${ficha.criticidad} de ${totalMaquinas} en minutos de paro`, clase: 'bg-ink-100 text-ink-700' }
    : ficha.criticidad === 'mas_danada'
      ? { texto: 'Máquina con más minutos de paro de la línea', clase: 'bg-primary-50 text-primary-600' }
      : null

  // Filas nuevas que entrega el motor: solo se pintan cuando hay valor
  const costoCorrectivo = fmtCOP(ficha.costos?.correctiva)
  const extras = [
    ficha.tendencia && {
      k: 'tendencia',
      label: 'Tendencia (6 meses)',
      node: (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${TENDENCIA_CLS[ficha.tendencia] ?? 'border border-neutral-200 bg-[#F8F9FA] text-[#111827]/75'}`}>
          {ficha.tendencia}
        </span>
      ),
    },
    ficha.modoPrincipal && { k: 'modo', label: 'Modo principal', node: <span className="text-sm font-semibold text-ink-900 text-right">{ficha.modoPrincipal}</span> },
    ficha.sintomas && { k: 'sintomas', label: 'Síntomas', node: <span className="text-sm text-ink-900 text-right line-clamp-2">{ficha.sintomas}</span> },
    ficha.confianza && { k: 'confianza', label: 'Confianza', node: <span className="text-sm font-semibold text-ink-900">{ficha.confianza}</span> },
    costoCorrectivo && { k: 'costo', label: 'Costo correctivo', node: <span className="text-sm font-semibold text-ink-900 tabular-nums">{costoCorrectivo}</span> },
  ].filter(Boolean)

  return (
    <div className="h-full flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold text-ink-900">Ficha del equipo</h2>
        <div className="mt-2 divide-y divide-neutral-200">
          <Fila label="Falla predominante">
            <span className="flex items-center gap-2" title={tipo.tooltip}>
              <span className={`grid size-7 place-items-center rounded-full ${tipo.chip}`} aria-hidden="true">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink-900 text-right">{ficha.fallaPredominante ?? 'Pocos datos'}</span>
            </span>
          </Fila>
          <Fila label="Componente principal">
            <span className="text-sm font-semibold text-ink-900 text-right">
              {ficha.componentePrincipal
                ? `${ficha.componentePrincipal.nombre}${ficha.componentePrincipal.paros !== null && ficha.componentePrincipal.paros !== undefined ? ` (${ficha.componentePrincipal.paros} paros)` : ''}`
                : 'Sin datos del motor'}
            </span>
          </Fila>
          <Fila label="Tarea preventiva vigente">
            <span className="text-sm font-semibold text-ink-900 text-right line-clamp-2">{ficha.planesPreventivosVigentes ?? 'Sin tarea identificada'}</span>
          </Fila>
          {ficha.ordenesSinEjecutar !== null && ficha.ordenesSinEjecutar !== undefined && (
            <Fila label="Órdenes sin ejecutar">
              <span className={`text-sm font-semibold ${ficha.ordenesSinEjecutar > 0 ? 'text-primary-600' : 'text-ink-900'}`}>
                {ficha.ordenesSinEjecutar}
              </span>
            </Fila>
          )}
          {criticidad && (
            <Fila label="Criticidad">
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${criticidad.clase}`}>{criticidad.texto}</span>
            </Fila>
          )}
          {extras.map((e, i) => (
            <Fila key={e.k} label={e.label} index={i} nueva>{e.node}</Fila>
          ))}
        </div>
      </div>

      {/* Imagen siempre visible: ocupa el espacio restante (la altura la marca la card de indicadores) */}
      <div className="relative flex-1 min-h-[220px] lg:min-h-0 overflow-hidden px-6 py-4">
        <ImagenMaquina maquina={maquina} src={IMAGENES[keyImagen]} />
      </div>
    </div>
  )
}
