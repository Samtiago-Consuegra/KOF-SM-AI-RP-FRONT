export async function enviarMensaje(historial) {
  const { enviarMensajeAsistente } = await import('./mantenimientoService.js')
  return enviarMensajeAsistente(historial)
}
