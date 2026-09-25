export default function Avatar({ user, size = 'md', className = '' }) {
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' }
  const initials = user.name.replace(/^Ing\.\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('')
  return user.photo ? (
    <img src={user.photo} alt={`Foto de ${user.name}`} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white ${className}`} />
  ) : (
    <span aria-hidden="true" className={`${sizes[size]} rounded-full bg-ink-900 text-white font-semibold grid place-items-center ring-2 ring-white ${className}`}>
      {initials}
    </span>
  )
}
