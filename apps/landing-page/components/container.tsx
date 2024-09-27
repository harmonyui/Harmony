import { clsx } from 'clsx'

export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={clsx(className, 'hw-px-6 lg:hw-px-8')}>
      <div className='hw-mx-auto hw-max-w-2xl lg:hw-max-w-7xl'>{children}</div>
    </div>
  )
}
