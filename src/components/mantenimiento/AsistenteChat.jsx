import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot } from 'lucide-react'
import { enviarMensaje } from '../../services/asistenteService.js'

const SUG = ['¿Qué paradas hay esta semana?', '¿Qué componente falla más?', '¿Qué tareas están pendientes?']

export default function AsistenteChat({ open, onClose }) {
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hola, soy el Asistente de mantenimiento. ¿En qué te puedo ayudar?' }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => { if (open) ref.current?.scrollTo(0, ref.current.scrollHeight) }, [msgs, typing, open])

  if (!open) return null

  const send = async (txt) => {
    const t = txt || input
    if (!t.trim()) return
    setMsgs((m) => [...m, { role: 'user', text: t }])
    setInput('')
    setTyping(true)
    const res = await enviarMensaje([...msgs, { role: 'user', text: t }])
    setTyping(false)
    setMsgs((m) => [...m, { role: 'bot', text: res?.respuesta || '...' }])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:items-start md:justify-end p-4">
      <div className="absolute inset-0 md:hidden" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="asistente-title" className="relative w-full h-full md:h-[520px] md:w-[380px] bg-white rounded-none md:rounded-2xl border border-neutral-200 shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-ink-900 text-white">
          <div className="flex items-center gap-2">
            <Bot className="size-4" />
            <div>
              <p id="asistente-title" className="text-sm font-medium">Asistente de mantenimiento</p>
              <p className="text-xs text-white/70">Pregúntame por paradas, tareas o fallas</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-white/10"><X className="size-4" /></button>
        </div>
        <div ref={ref} className="flex-1 overflow-y-auto p-3 space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={m.role === 'user' ? 'max-w-[80%] rounded-2xl rounded-br-md bg-primary-500 text-white px-3 py-2 text-sm' : 'max-w-[80%] rounded-2xl rounded-bl-md bg-neutral-100 text-ink-900 px-3 py-2 text-sm'}>{m.text}</div>
            </div>
          ))}
          {typing && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-neutral-100 px-3 py-2 text-sm text-ink-500">Escribiendo...</div></div>}
          {msgs.length <= 1 && (
            <div className="flex flex-wrap gap-1.5">
              {SUG.map((s) => <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-neutral-200 px-2 py-1 hover:bg-neutral-50">{s}</button>)}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-neutral-200 flex items-center gap-2">
          <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send() }}} placeholder="Escribe un mensaje..." className="flex-1 h-9 rounded-lg border border-neutral-200 px-2 text-sm" />
          <button onClick={()=>send()} className="h-9 w-9 grid place-items-center rounded-lg bg-primary-500 text-white hover:bg-primary-600"><Send className="size-4" /></button>
        </div>
        <div aria-live="polite" className="sr-only">{typing ? 'Escribiendo respuesta' : ''}</div>
      </div>
    </div>
  )
}
