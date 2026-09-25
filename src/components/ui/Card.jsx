export default function Card({ children, className = '', as: Tag = 'section', ...props }) {
  return (
    <Tag className={`bg-white rounded-2xl border border-neutral-200 ${className}`} {...props}>
      {children}
    </Tag>
  )
}
