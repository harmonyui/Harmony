import { AllOrNothing } from '@harmony/util/src/types/utils'
import { DropdownIcon, type DropdownItem, type ItemAction } from './dropdown'
import { EllipsisHorizontalIcon } from './icons'

interface CardDropdown {
  items: DropdownItem<string>[]
  onChange: ItemAction<string>
}
export type CardProps = React.PropsWithChildren & {
  className?: string
  label?: string | React.ReactNode
  items?: DropdownItem<string>[]
} & AllOrNothing<CardDropdown>
export const Card: React.FunctionComponent<CardProps> = ({
  children,
  className,
  label,
  items,
  onChange,
}) => {
  const labelComponent: React.ReactNode =
    typeof label === 'string' ? (
      <span className='text-sm font-medium'>{label}</span>
    ) : (
      label
    )
  return (
    <div
      className={`${
        className || ''
      } bg-white border border-gray-200 rounded-xl shadow dark:bg-gray-800 dark:border-gray-700`}
    >
      <div className='flex justify-between px-4 pt-4 sm:px-8 sm:pt-8 items-center'>
        {labelComponent}
        {items ? (
          <DropdownIcon
            className='text-gray-500 dark:text-gray-400'
            icon={EllipsisHorizontalIcon}
            items={items}
            onChange={onChange}
          />
        ) : (
          <div />
        )}
      </div>
      <div className='p-4 sm:p-8 pt-4 sm:pt-4'>{children}</div>
    </div>
  )
}
