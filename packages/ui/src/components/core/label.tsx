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
      className={`${className || ''} ${sameLine ? 'flex items-center' : ''}`}
    >
      <label
        className={getClass(
          'block text-sm font-medium leading-6 text-gray-900 dark:text-white',
          sameLine ? 'mr-2' : '',
        )}
      >
        {label}
      </label>
      {sameLine ? children : <div className='mt-2'>{children}</div>}
    </div>
  )
}
