import { getClass } from '@harmony/util/src/utils/common'
import { ChevronDownIcon, ChevronUpIcon } from './icons'

export interface ChevronSwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  className?: string
}
export const ChevronSwitch: React.FunctionComponent<ChevronSwitchProps> = ({
  value,
  onChange,
  label,
  className,
}) => {
  const Icon = value ? ChevronUpIcon : ChevronDownIcon
  return (
    <button
      className={getClass(
        className,
        'flex items-center hover:bg-gray-200 dark:text-white dark:hover:bg-gray-800 rounded-md px-2 py-1 font-semibold',
      )}
      onClick={() => {
        onChange(!value)
      }}
      type='button'
    >
      {label}
      <Icon className='w-3 h-3 ml-1' />
    </button>
  )
}
