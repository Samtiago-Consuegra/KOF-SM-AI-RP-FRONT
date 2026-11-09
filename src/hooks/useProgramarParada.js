import { useState } from 'react'
import { JERARQUIA } from '../data/mock/historiaClinica.js'

export function useProgramarParada({ initialPrecarga = null } = {}) {
  const [titulo, setTitulo] = useState(initialPrecarga?.titulo || '')
  const [fecha, setFecha] = useState(initialPrecarga?.fecha || new Date().toISOString().slice(0, 10))
  const [horaInicio, setHoraInicio] = useState(initialPrecarga?.horaInicio || '06:00')
  const [horaFin, setHoraFin] = useState(initialPrecarga?.horaFin || '10:00')
  const [condicion, setCondicion] = useState(initialPrecarga?.condicion || 'frio')
  const [maquina, setMaquina] = useState(initialPrecarga?.maquina || '')
  const [sistema, setSistema] = useState(initialPrecarga?.sistema || '')
  const [componente, setComponente] = useState(initialPrecarga?.componente || '')
  const [tipoTarea, setTipoTarea] = useState(initialPrecarga?.tipoTarea || 'Preventiva')
  const [tareaInput, setTareaInput] = useState('')
  const [cards, setCards] = useState(initialPrecarga?.cardsIniciales || (initialPrecarga?.cardInicial ? [initialPrecarga.cardInicial] : []))
  const [editingCardId, setEditingCardId] = useState(null)
  const [editingTask, setEditingTask] = useState(null) // { cardId, taskIndex }
  const [errores, setErrores] = useState({})
  const [msgTarea, setMsgTarea] = useState('')

  const sistemas = maquina ? (JERARQUIA[maquina] || []).map(s => ({ id: s.id, nombre: s.nombre })) : []
  const componentes = (maquina && sistema) ? (JERARQUIA[maquina]?.find(s => s.id === sistema)?.componentes || []) : []

  const onChangeMaquina = (m) => {
    setMaquina(m)
    setSistema('')
    setComponente('')
    setErrores(e => ({ ...e, maquina: undefined, sistema: undefined, componente: undefined }))
  }

  const onChangeSistema = (s) => {
    setSistema(s)
    setComponente('')
    setErrores(e => ({ ...e, sistema: undefined, componente: undefined }))
  }

  const onChangeComponente = (c) => {
    setComponente(c)
    setErrores(e => ({ ...e, componente: undefined }))
  }

  const addCard = (tareaDesc) => {
    const id = 'card-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    const card = {
      id,
      maquina,
      sistemaId: sistema,
      sistemaNombre: JERARQUIA[maquina]?.find(s => s.id === sistema)?.nombre || sistema,
      componenteId: componente,
      componenteNombre: componentes.find(c => c.id === componente)?.nombre || componente,
      estado: 'abierta', // abierta | confirmada | edicion
      tareas: [{ descripcion: tareaDesc, tipo: tipoTarea, id: 't-' + Date.now() }]
    }
    setCards(prev => [...prev, card])
    return card
  }

  const findCardByCombo = () => {
    return cards.find(c => c.maquina === maquina && c.sistemaId === sistema && c.componenteId === componente)
  }

  const handleAddTarea = () => {
    setMsgTarea('')
    setErrores({})
    const newErr = {}
    if (!titulo) newErr.titulo = 'Requerido'
    if (!fecha) newErr.fecha = 'Requerido'
    if (!horaInicio) newErr.horaInicio = 'Requerido'
    if (!horaFin) newErr.horaFin = 'Requerido'
    if (horaInicio && horaFin && horaFin <= horaInicio) newErr.horaFin = 'Debe ser posterior a la hora de inicio'
    if (!condicion) newErr.condicion = 'Requerido'
    if (!maquina) newErr.maquina = 'Requerido'
    if (!sistema) newErr.sistema = 'Requerido'
    if (!componente) newErr.componente = 'Requerido'
    if (!tipoTarea) newErr.tipoTarea = 'Requerido'
    if (Object.keys(newErr).length > 0) { setErrores(newErr); return }

    const desc = tareaInput.trim()
    if (!desc) return

    // Check if editing existing task
    if (editingTask) {
      setCards(prev => prev.map(card => {
        if (card.id !== editingTask.cardId) return card
        const tareas = [...card.tareas]
        tareas[editingTask.taskIndex] = { ...tareas[editingTask.taskIndex], descripcion: desc, tipo: tipoTarea }
        return { ...card, tareas }
      }))
      setEditingTask(null)
      setTareaInput('')
      setMsgTarea('')
      return
    }

    const existingCard = findCardByCombo()
    if (existingCard) {
      if (existingCard.estado === 'confirmada') {
        setMsgTarea('Este componente ya está confirmado. Usa el botón Editar de su card para agregar tareas.')
        return
      }
      // check duplicate
      const dup = existingCard.tareas.some(t => t.descripcion.toLowerCase() === desc.toLowerCase())
      if (dup) {
        setMsgTarea('Esta tarea ya está en el componente')
        return
      }
      // add to card
      setCards(prev => prev.map(card => {
        if (card.id !== existingCard.id) return card
        return { ...card, tareas: [...card.tareas, { descripcion: desc, tipo: tipoTarea, id: 't-' + Date.now() }] }
      }))
    } else {
      addCard(desc)
    }
    setTareaInput('')
    setMsgTarea('')
  }

  const confirmarCard = (cardId) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card
      return { ...card, estado: 'confirmada' }
    }))
    if (editingCardId === cardId) {
      setEditingCardId(null)
      setEditingTask(null)
      setTareaInput('')
    }
  }

  const editarCard = (cardId) => {
    // confirmar cualquier otra card en edición
    setCards(prev => prev.map(card => {
      if (card.estado === 'edicion') return { ...card, estado: 'confirmada' }
      return card
    }))
    const card = cards.find(c => c.id === cardId)
    if (card) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, estado: 'edicion' } : c))
      setEditingCardId(cardId)
      setMaquina(card.maquina)
      setSistema(card.sistemaId)
      setComponente(card.componenteId)
      if (card.tareas[0]) setTipoTarea(card.tareas[0].tipo)
      setTareaInput('')
      setEditingTask(null)
    }
  }

  const eliminarTarea = (cardId, taskIndex) => {
    setCards(prev => {
      const updated = prev.map(card => {
        if (card.id !== cardId) return card
        const tareas = card.tareas.filter((_, idx) => idx !== taskIndex)
        return { ...card, tareas }
      })
      return updated.filter(card => card.tareas.length > 0)
    })
    if (editingTask?.cardId === cardId && editingTask?.taskIndex === taskIndex) {
      setEditingTask(null)
      setTareaInput('')
    }
  }

  const cargarTareaParaEditar = (cardId, taskIndex) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    if (card.estado !== 'edicion') return // tooltip will handle
    setEditingTask({ cardId, taskIndex })
    setTareaInput(card.tareas[taskIndex].descripcion)
    setTipoTarea(card.tareas[taskIndex].tipo)
  }

  const cancelarEdicionTarea = () => {
    setEditingTask(null)
    setTareaInput('')
  }

  const validarParaGuardar = () => {
    const newErr = {}
    if (!titulo) newErr.titulo = 'Requerido'
    if (!fecha) newErr.fecha = 'Requerido'
    if (!horaInicio) newErr.horaInicio = 'Requerido'
    if (!horaFin) newErr.horaFin = 'Requerido'
    if (horaInicio && horaFin && horaFin <= horaInicio) newErr.horaFin = 'Debe ser posterior a la hora de inicio'
    if (!condicion) newErr.condicion = 'Requerido'
    setErrores(newErr)
    if (Object.keys(newErr).length > 0) return false
    if (cards.length === 0) return false
    const hayAbiertasOEdicion = cards.some(c => c.estado === 'abierta' || c.estado === 'edicion')
    if (hayAbiertasOEdicion) return false
    return true
  }

  const getParadaData = () => {
    const tareas = []
    cards.forEach(card => {
      card.tareas.forEach(t => {
        tareas.push({
          maquina: card.maquina,
          sistema: card.sistemaNombre,
          sistemaId: card.sistemaId,
          componente: card.componenteNombre,
          componenteId: card.componenteId,
          tipo: t.tipo,
          descripcion: t.descripcion
        })
      })
    })
    // determinar tipo predominante
    const counts = { Correctiva: 0, Predictiva: 0, Preventiva: 0 }
    tareas.forEach(t => { if (counts.hasOwnProperty(t.tipo)) counts[t.tipo]++ })
    let tipoPred = 'Preventiva'
    if (counts.Correctiva >= counts.Predictiva && counts.Correctiva >= counts.Preventiva) tipoPred = 'Correctiva'
    else if (counts.Predictiva >= counts.Preventiva) tipoPred = 'Predictiva'
    const maquinas = [...new Set(cards.map((card) => card.maquina).filter(Boolean))]

    return {
      titulo,
      fecha,
      horaInicio,
      horaFin,
      condicion,
      maquinas,
      maquina: maquinas[0] || maquina,
      tipo: tipoPred,
      tareas: tareas.map(t => t.descripcion),
      tareasDetalle: tareas
    }
  }

  return {
    titulo, setTitulo,
    fecha, setFecha,
    horaInicio, setHoraInicio,
    horaFin, setHoraFin,
    condicion, setCondicion,
    maquina, setMaquina: onChangeMaquina,
    sistema, setSistema: onChangeSistema,
    componente, setComponente: onChangeComponente,
    tipoTarea, setTipoTarea,
    tareaInput, setTareaInput,
    cards, setCards,
    editingCardId,
    editingTask,
    errores, setErrores,
    msgTarea, setMsgTarea,
    sistemas,
    componentes,
    handleAddTarea,
    confirmarCard,
    editarCard,
    eliminarTarea,
    cargarTareaParaEditar,
    cancelarEdicionTarea,
    validarParaGuardar,
    getParadaData
  }
}
