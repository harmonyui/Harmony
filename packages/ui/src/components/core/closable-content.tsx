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
    <div className={getClass('hw-relative', className)}>
      <div className='hw-absolute hw-top-[5px] hw-right-[5px]'>
        <button className='hover:hw-opacity-50' onClick={onClose} type='button'>
          <XMarkIcon
            className={xMarkClassName || 'hw-w-4 hw-h-4 dark:hw-fill-white'}
          />
        </button>
      </div>
      {children}
    </div>
  )
}
