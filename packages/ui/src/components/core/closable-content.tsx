import { getClass } from '@harmony/util/src/utils/common'
import { XMarkIcon } from './icons'

export interface ClosableContentProps {
  onClose: () => void
  children: React.ReactNode
  className?: string
  xMarkClassName?: string
}
export const ClosableContent: React.FunctionComponent<ClosableContentProps> = ({
  onClose,
  children,
  className,
  xMarkClassName,
}) => {
  return (
    <div className={getClass('relative', className)}>
      <div className='absolute top-[5px] right-[5px]'>
        <button className='hover:opacity-50' onClick={onClose} type='button'>
          <XMarkIcon className={xMarkClassName || 'w-4 h-4 dark:fill-white'} />
        </button>
      </div>
      {children}
    </div>
  )
}
