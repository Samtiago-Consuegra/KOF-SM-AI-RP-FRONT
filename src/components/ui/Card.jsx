import { forwardRef } from 'react'

const Card = forwardRef(function Card({ children, className = '', as: Tag = 'section', ...props }, ref) {
  return (
    <Tag ref={ref} className={`bg-white rounded-2xl border border-neutral-200 ${className}`} {...props}>
      {children}
    </Tag>
  )
})

export default Card
