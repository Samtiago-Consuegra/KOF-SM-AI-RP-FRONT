import { useState } from 'react'
import { ChevronDown, Factory } from 'lucide-react'
import llenadora from '../../assets/maquinas/llenadora.svg'
import empacadora from '../../assets/maquinas/empacadora.svg'
import paletizadora from '../../assets/maquinas/paletizadora.svg'
import envolvedora from '../../assets/maquinas/envolvedora.svg'

const IMAGENES = {
  llenadora,
  empacadora,
  paletizadora,
  envolvedora
}

export default function FichaEquipo({ ficha, maquina, maquinaKey, loading }) {
  const [expanded, setExpanded] = useState(false)
  
  if (loading || !ficha) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />)}
        </div>
      </div>
    )
  }
  
  const getFallaIcon = () => {
    if (ficha.fallaPredominante === 'Por desgaste') return '⚙️'
    if (ficha.fallaPredominante === 'Aleatoria') return '🎲'
    return '⚡'
  }
  
  const getFallaTooltip = () => {
    if (ficha.fallaPredominante === 'Por desgaste') return 'Las fallas aumentan con el uso (β de Weibull > 1).'
    if (ficha.fallaPredominante === 'Aleatoria') return 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).'
    return 'Varias fallas seguidas en poco tiempo.'
  }
  
  const criticidadBadge = ficha.criticidad === 'mas_danada' 
    ? { text: 'Máquina que más se daña de la línea', class: 'bg-primary-50 text-primary-600' }
    : { text: `Puesto ${ficha.criticidad.split('_')[1]} de 4 en fallas`, class: 'bg-ink-100 text-ink-700' }
  
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-400" style={{ minHeight: expanded ? 'auto' : 'auto' }}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-ink-900">Ficha del equipo</h3>
        <div className="mt-4 divide-y divide-neutral-200">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-500">Falla predominante</span>
            <div className="flex items-center gap-1.5" title={getFallaTooltip()}>
              <span className="text-sm">{getFallaIcon()}</span>
              <span className="text-sm font-semibold text-ink-900">{ficha.fallaPredominante}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-500">Componente principal</span>
            <span className="text-sm font-semibold text-ink-900">{ficha.componentePrincipal.nombre} ({ficha.componentePrincipal.paros} paros)</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-500">Planes preventivos vigentes</span>
            <span className="text-sm font-semibold text-ink-900">{ficha.planesPreventivosVigentes}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-500">Órdenes sin ejecutar</span>
            <span className={`text-sm font-semibold ${ficha.ordenesSinEjecutar > 0 ? 'text-primary-600' : 'text-ink-900'}`}>{ficha.ordenesSinEjecutar}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-500">Criticidad</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${criticidadBadge.class}`}>{criticidadBadge.text}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="maquina-imagen"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-ink-900"
        >
          {expanded ? 'Ocultar máquina' : 'Ver máquina'}
          <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div id="maquina-imagen" className="border-t border-neutral-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
          {IMAGENES[maquinaKey] ? (
            <img
              src={IMAGENES[maquinaKey]}
              alt={`${maquina} de la Línea 4`}
              className="w-full h-64 object-contain rounded-lg"
            />
          ) : (
            <div className="flex h-64 items-center justify-center flex-col gap-2 rounded-lg bg-neutral-100">
              <Factory className="size-10 text-ink-300" />
              <span className="text-sm text-ink-400">Imagen no disponible</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
