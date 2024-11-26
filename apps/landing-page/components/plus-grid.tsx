import { clsx } from 'clsx'

export function PlusGrid({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={className}>{children}</div>
}

export function PlusGridRow({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        className,
        'hw-group/row hw-relative hw-isolate hw-pt-[calc(theme(spacing.2)+1px)] last:hw-pb-[calc(theme(spacing.2)+1px)]',
      )}
    >
      <div
        aria-hidden='true'
        className='hw-absolute hw-inset-y-0 hw-left-1/2 -hw-z-10 hw-w-screen -hw-translate-x-1/2'
      >
        <div className='hw-absolute hw-inset-x-0 hw-top-0 hw-border-t hw-border-black/5'></div>
        <div className='hw-absolute hw-inset-x-0 hw-top-2 hw-border-t hw-border-black/5'></div>
        <div className='hw-absolute hw-inset-x-0 hw-bottom-0 hw-hidden hw-border-b hw-border-black/5 group-last/row:hw-block'></div>
        <div className='hw-absolute hw-inset-x-0 hw-bottom-2 hw-hidden hw-border-b hw-border-black/5 group-last/row:hw-block'></div>
      </div>
      {children}
    </div>
  )
}

export function PlusGridItem({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={clsx(className, 'hw-group/item hw-relative')}>
      <PlusGridIcon
        placement='top left'
        className='hw-hidden group-first/item:hw-block'
      />
      <PlusGridIcon placement='top right' />
      <PlusGridIcon
        placement='bottom left'
        className='hw-hidden group-last/row:group-first/item:hw-block'
      />
      <PlusGridIcon
        placement='bottom right'
        className='hw-hidden group-last/row:hw-block'
      />
      {children}
    </div>
  )
}

export function PlusGridIcon({
  className = '',
  placement,
}: {
  className?: string
  placement: `${'top' | 'bottom'} ${'right' | 'left'}`
}) {
  const [yAxis, xAxis] = placement.split(' ')

  const yClass = yAxis === 'hw-top' ? '-hw-top-2' : '-hw-bottom-2'
  const xClass = xAxis === 'hw-left' ? '-hw-left-2' : '-hw-right-2'

  return (
    <svg
      viewBox='0 0 15 15'
      aria-hidden='true'
      className={clsx(
        className,
        'hw-absolute hw-size-[15px] hw-fill-black/10',
        yClass,
        xClass,
      )}
    >
      <path d='M8 0H7V7H0V8H7V15H8V8H15V7H8V0Z' />
    </svg>
  )
}
