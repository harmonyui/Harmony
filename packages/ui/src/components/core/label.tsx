import { getClass } from '@harmony/util/src/utils/common'

type LabelProps = {
  className?: string
  label: string
  sameLine?: boolean
} & React.PropsWithChildren
export const Label: React.FunctionComponent<LabelProps> = ({
  children,
  className,
  label,
  sameLine,
}) => {
  return (
    <div
      className={`${className || ''} ${
        sameLine ? 'hw-flex hw-items-center' : ''
      }`}
    >
      <label
        className={getClass(
          'hw-block hw-text-sm hw-font-medium hw-leading-6 hw-text-gray-900 dark:hw-text-white',
          sameLine ? 'hw-mr-2' : '',
        )}
      >
        {label}
      </label>
      {sameLine ? children : <div className='hw-mt-2'>{children}</div>}
    </div>
  )
}
