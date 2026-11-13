import { AlertOctagon, FileSearch, History, PackageX, ShieldCheck } from 'lucide-react'

export const fechaCorta = (iso) => {
  if (!iso) return '—'
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}
const n0 = (v) => (v == null ? '—' : Math.round(v).toLocaleString('es-CO'))

const th = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500 whitespace-nowrap'
const td = 'px-3 py-2 align-top text-ink-700'

function Seccion({ icon: Icon, titulo, extra, children, idx }) {
  return (
    <section className="ant-in rounded-xl border border-neutral-200 bg-white" style={{ animationDelay: `${idx * 70}ms` }}>
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Icon className="size-4" aria-hidden="true" /></span>
          <h3 className="text-sm font-semibold text-ink-900">{titulo}</h3>
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}

/** Antecedentes del motor (Fase 23) de un componente: fallas mayores, ACR, repuesto crítico y antes/después. */
export default function AntecedentesComponente({ antecedentes }) {
  const estilos = (
    <style>{`
      @keyframes ant-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes ant-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      .ant-in { animation: ant-in 260ms cubic-bezier(.2,.8,.2,1) both; }
      .ant-float { animation: ant-float 2.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .ant-in, .ant-float { animation: none !important; } }
    `}</style>
  )

  if (!antecedentes) {
    return (
      <div className="ant-in flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center">
        {estilos}
        <div className="ant-float grid size-12 place-items-center rounded-2xl bg-white ring-1 ring-neutral-200">
          <ShieldCheck className="size-6 text-tertiary-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-ink-900">Este componente no tiene fallas mayores ni ACR registrados</p>
      </div>
    )
  }

  const { fallasMayores, acr, repuestoCritico, prePost } = antecedentes
  let idx = 0

  return (
    <div className="space-y-3">
      {estilos}

      {fallasMayores.lista.length > 0 && (
        <Seccion
          idx={idx++}
          icon={AlertOctagon}
          titulo="Fallas mayores"
          extra={<span className="text-xs text-ink-500 tabular-nums">{fallasMayores.n} · {n0(fallasMayores.minutos)} min</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-neutral-100"><th className={th}>Fecha</th><th className={th}>Minutos</th><th className={th}>Causa de falla</th><th className={th}>Causa de alto tiempo</th><th className={th}>Detalle</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {fallasMayores.lista.map((f, i) => (
                  <tr key={i}>
                    <td className={`${td} whitespace-nowrap`}>{fechaCorta(f.fecha)}</td>
                    <td className={`${td} tabular-nums`}>{n0(f.minutos)}</td>
                    <td className={td}>{f.causaFalla || '—'}</td>
                    <td className={td}>{f.causaAltoTiempo || '—'}</td>
                    <td className={td}>{f.detalle || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
      )}

      {acr.length > 0 && (
        <Seccion idx={idx++} icon={FileSearch} titulo="Análisis de causa raíz (ACR)" extra={<span className="text-xs text-ink-500">{acr.length}</span>}>
          <div className="divide-y divide-neutral-100">
            {acr.map((a, i) => (
              <article key={a.archivo || i} className="space-y-2 p-3">
                <p className="text-sm font-medium text-ink-900">
                  {fechaCorta(a.fecha)} · {a.falla || 'Falla sin descripción'}
                  {a.duracionMin != null && <span className="font-normal text-ink-500"> · {n0(a.duracionMin)} min</span>}
                </p>
                {a.causaRaiz && <p className="text-sm text-ink-700"><span className="font-medium text-ink-900">Causa raíz: </span>{a.causaRaiz}</p>}
                {a.nota && <p className="text-xs text-ink-500">{a.nota}</p>}
                {a.acciones.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-neutral-100">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead><tr className="border-b border-neutral-100 bg-neutral-50"><th className={th}>Actividad</th><th className={th}>Responsable</th><th className={th}>Fecha fin</th><th className={th}>Estado</th></tr></thead>
                      <tbody className="divide-y divide-neutral-100">
                        {a.acciones.map((x, j) => (
                          <tr key={j} className={x.vencida ? 'bg-primary-50/70' : undefined}>
                            <td className={td}>{x.actividad || '—'}</td>
                            <td className={td}>{x.responsable || '—'}</td>
                            <td className={`${td} whitespace-nowrap`}>{fechaCorta(x.fechaFin)}</td>
                            <td className={td}>
                              {x.vencida ? (
                                <span className="inline-flex items-center rounded-full border border-primary-200 bg-white px-2 py-0.5 text-xs font-semibold text-primary-600 whitespace-nowrap">Vencida sin cierre</span>
                              ) : (x.estado || '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            ))}
          </div>
        </Seccion>
      )}

      {repuestoCritico && (
        <Seccion idx={idx++} icon={PackageX} titulo="Repuesto crítico" extra={<span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600">{repuestoCritico.nivel}</span>}>
          <p className="p-3 text-sm leading-relaxed text-ink-700">{repuestoCritico.motivo || '—'}</p>
        </Seccion>
      )}

      {prePost.length > 0 && (
        <Seccion idx={idx++} icon={History} titulo="Antes y después de mantenimientos mayores">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-neutral-100"><th className={th}>Fecha</th><th className={th}>Orden</th><th className={th}>Tarea</th><th className={th}>Horas</th><th className={th}>Min 30 d antes</th><th className={th}>Min 30 d después</th><th className={th}>Cambio</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {prePost.map((p, i) => (
                  <tr key={`${p.orden}-${i}`}>
                    <td className={`${td} whitespace-nowrap`}>{fechaCorta(p.fecha)}</td>
                    <td className={`${td} tabular-nums`}>{p.orden ?? '—'}</td>
                    <td className={td}>{p.tarea || '—'}</td>
                    <td className={`${td} tabular-nums`}>{n0(p.horas)}</td>
                    <td className={`${td} tabular-nums`}>{n0(p.antes)}</td>
                    <td className={`${td} tabular-nums`}>{n0(p.despues)}</td>
                    <td className={`${td} tabular-nums font-semibold ${p.cambioPct == null ? '' : p.cambioPct > 0 ? 'text-primary-600' : 'text-tertiary-700'}`}>
                      {p.cambioPct == null ? '—' : `${p.cambioPct > 0 ? '+' : ''}${Math.round(p.cambioPct)} %`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccion>
      )}
    </div>
  )
}
