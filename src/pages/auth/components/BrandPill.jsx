import cocaCola from '../../../assets/coca-cola.svg'
import femsa from '../../../assets/femsa.svg'

export default function BrandPill() {
  return (
    <div className="mx-auto mb-6 flex w-fit items-center rounded-full border border-neutral-200 bg-white px-5 py-2 shadow-sm shadow-black/5">
      <img src={cocaCola} alt="Coca-Cola" className="h-10 w-auto" />
      <img src={femsa} alt="FEMSA" className="h-10 w-auto" />
    </div>
  )
}
