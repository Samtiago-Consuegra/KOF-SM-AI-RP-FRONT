import { Link } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'

export default function Proximamente({ title }) {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title={title} />
      <Card className="p-10 text-center">
        <Hammer className="size-10 mx-auto text-ink-300" />
        <p className="mt-4 font-semibold text-ink-900">Esta sección llega en la siguiente etapa</p>
        <p className="mt-1 text-sm text-ink-500">Por ahora puedes revisar el dashboard o las predicciones de falla.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/dashboard" className="rounded-xl bg-ink-900 text-white px-4 py-2 text-sm font-semibold">Ir al dashboard</Link>
          <Link to="/predicciones" className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-ink-900">Ver predicciones</Link>
        </div>
      </Card>
    </div>
  )
}
