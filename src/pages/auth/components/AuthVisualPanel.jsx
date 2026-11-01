import ccFemsa from '../../../assets/cc-femsa.svg'

const bubbles = [
  { className: 'left-6 top-10 h-16 w-16 bg-primary-300/40', delay: '0s' },
  { className: 'right-10 top-16 h-10 w-10 bg-white/40', delay: '1.2s' },
  { className: 'left-1/3 top-6 h-6 w-6 bg-tertiary-300/40', delay: '2.1s' },
  { className: 'bottom-16 left-10 h-12 w-12 bg-primary-400/35', delay: '0.8s' },
  { className: 'bottom-10 right-12 h-14 w-14 bg-white/35', delay: '1.8s' },
  { className: 'bottom-24 right-1/3 h-8 w-8 bg-tertiary-300/35', delay: '2.6s' },
]

export default function AuthVisualPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-primary-500 to-primary-700">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute rounded-full blur-xl animate-float-bubble ${b.className}`}
          style={{ animationDelay: b.delay }}
        />
      ))}

      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        <div className="flex items-center justify-center rounded-3xl bg-white/90 px-10 py-8 shadow-2xl shadow-black/20 backdrop-blur animate-float-logo">
          <img src={ccFemsa} alt="CC-FEMSA" className="h-16 w-auto select-none" />
        </div>
      </div>
    </div>
  )
}
