import { AlertTriangle } from 'lucide-react'

export const SIN_CIERRE = 'Fecha cumplida sin cierre registrado'

const ENTRADA = 'motion-safe:animate-[fade-swap-in_260ms_cubic-bezier(0.22,1,0.36,1)_both]'

const fecha = (v) => {
  if (!v) return '—'
  const d = new Date(String(v).length === 10 ? `${v}T12:00:00` : v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
const num = (v) => (typeof v === 'number' ? v.toLocaleString('es-CO', { maximumFractionDigits: 1 }) : (v ?? '—'))

function Bloque({ titulo, orden, children }) {
  return (
    <section className={ENTRADA} style={{ animationDelay: `${orden * 40}ms` }}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#111827]/60">{titulo}</h4>
      {children}
    </section>
  )
}

function Tabla({ columnas, filas }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-[#F8F9FA] text-xs text-[#111827]/60">
          <tr>{columnas.map((c) => <th key={c} scope="col" className="px-3 py-2 font-medium">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-[#111827]">{filas}</tbody>
      </table>
    </div>
  )
}

const td = 'px-3 py-2 align-top'

export default function AntecedentesComponente({ componente: c }) {
  const fm = c?.Fallas_mayores
  const acr = c?.ACR ?? []
  const repuesto = c?.Repuesto_critico
  const prePost = c?.Pre_post_mantenimientos ?? []
  if (!c || (!(fm?.N > 0) && !acr.length && !repuesto && !prePost.length)) return null

  let orden = 0
  return (
    <article className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${ENTRADA}`}>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[#111827]">{c.Componente}</h3>
        {c.Sistema && <span className="text-xs text-[#111827]/60">{c.Sistema}</span>}
      </header>

      <div className="space-y-5">
        {repuesto && (
          <div
            role="note"
            className={`flex gap-3 rounded-xl border border-[#F40000]/25 bg-[#F40000]/5 p-3 text-sm ${ENTRADA}`}
            style={{ animationDelay: `${orden++ * 40}ms` }}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#F40000]" aria-hidden="true" />
            <p className="text-[#111827]">
              <span className="font-semibold text-[#F40000]">Repuesto crítico · {repuesto.Nivel}</span>
              {repuesto.Motivo && <> — {repuesto.Motivo}</>}
            </p>
          </div>
        )}

        {fm?.N > 0 && (
          <Bloque titulo="Fallas mayores" orden={orden++}>
            <div className="mb-3 flex gap-3">
              <div className="rounded-xl bg-[#F8F9FA] px-4 py-2">
                <p className="text-xs text-[#111827]/60">Fallas</p>
                <p className="text-lg font-semibold text-[#111827]">{num(fm.N)}</p>
              </div>
              <div className="rounded-xl bg-[#F8F9FA] px-4 py-2">
                <p className="text-xs text-[#111827]/60">Minutos</p>
                <p className="text-lg font-semibold text-[#111827]">{num(fm.Minutos)}</p>
              </div>
            </div>
            {fm.Lista?.length > 0 && (
              <Tabla
                columnas={['Fecha', 'Minutos', 'Causa de falla', 'Causa de alto tiempo', 'Detalle']}
                filas={fm.Lista.map((f, i) => (
                  <tr key={i} className="transition-colors duration-150 hover:bg-[#F8F9FA]">
                    <td className={`${td} whitespace-nowrap`}>{fecha(f.Fecha)}</td>
                    <td className={td}>{num(f.Minutos)}</td>
                    <td className={td}>{f.Causa_falla ?? '—'}</td>
                    <td className={td}>{f.Causa_alto_tiempo ?? '—'}</td>
                    <td className={`${td} text-[#111827]/70`}>{f.Detalle ?? '—'}</td>
                  </tr>
                ))}
              />
            )}
          </Bloque>
        )}

        {acr.length > 0 && (
          <Bloque titulo="Análisis de causa raíz (ACR)" orden={orden++}>
            <div className="space-y-3">
              {acr.map((a, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-[#111827]">{a.Falla}</p>
                    <p className="text-xs text-[#111827]/60">{fecha(a.Fecha)} · {num(a.Duracion_min)} min</p>
                  </div>
                  {a.Causa_raiz && <p className="mt-1 text-sm text-[#111827]/80"><span className="font-medium">Causa raíz:</span> {a.Causa_raiz}</p>}
                  {a.Acciones?.length > 0 && (
                    <div className="mt-3">
                      <Tabla
                        columnas={['Actividad', 'Responsable', 'Fecha fin', 'Estado']}
                        filas={a.Acciones.map((ac, j) => {
                          const sinCierre = ac.Estado === SIN_CIERRE
                          return (
                            <tr key={j} className={sinCierre ? 'bg-[#F40000]/5' : 'transition-colors duration-150 hover:bg-[#F8F9FA]'}>
                              <td className={td}>{ac.Actividad}</td>
                              <td className={td}>{ac.Responsable ?? '—'}</td>
                              <td className={`${td} whitespace-nowrap`}>{fecha(ac.Fecha_fin)}</td>
                              <td className={`${td} ${sinCierre ? 'font-semibold text-[#F40000]' : ''}`}>
                                {sinCierre && <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-[#F40000]" aria-hidden="true" />}
                                {ac.Estado ?? '—'}
                              </td>
                            </tr>
                          )
                        })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Bloque>
        )}

        {prePost.length > 0 && (
          <Bloque titulo="Antes y después de mantenimientos mayores" orden={orden++}>
            <Tabla
              columnas={['Fecha', 'Orden', 'Tarea', 'Min. 30 d antes', 'Min. 30 d después', 'Cambio']}
              filas={prePost.map((p, i) => (
                <tr key={i} className="transition-colors duration-150 hover:bg-[#F8F9FA]">
                  <td className={`${td} whitespace-nowrap`}>{fecha(p.Fecha)}</td>
                  <td className={td}>{p.Orden ?? '—'}</td>
                  <td className={td}>{p.Tarea ?? '—'}</td>
                  <td className={td}>{num(p.Minutos_30d_antes)}</td>
                  <td className={td}>{num(p.Minutos_30d_despues)}</td>
                  <td className={`${td} font-medium ${p.Cambio_pct < 0 ? 'text-[#0D9488]' : p.Cambio_pct > 0 ? 'text-[#F40000]' : ''}`}>
                    {typeof p.Cambio_pct === 'number' ? `${p.Cambio_pct > 0 ? '+' : ''}${num(p.Cambio_pct)} %` : '—'}
                  </td>
                </tr>
              ))}
            />
          </Bloque>
        )}
      </div>
    </article>
  )
}
