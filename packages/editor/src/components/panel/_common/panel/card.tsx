import {
  DropdownIcon,
  DropdownItem,
} from '@harmony/ui/src/components/core/dropdown'
import { EllipsisHorizontalIcon } from '@harmony/ui/src/components/core/icons'

export interface CardProps<T> {
  label?: string
  children: React.ReactNode
  options?: DropdownItem<T>[]
  onOptionChange?: (item: DropdownItem<T>) => void
  container?: HTMLElement | undefined
}
export const Card = <T,>({
  label,
  children,
  options,
  onOptionChange,
  container,
}: CardProps<T>): React.JSX.Element => {
  return (
    <div className='bg-white rounded-lg p-4 shadow-sm'>
      {label ? (
        <div className='flex justify-between items-center mb-2'>
          <h3 className='text-sm text-gray-600'>{label}</h3>
          {options ? (
            <DropdownIcon
              className='!p-0'
              buttonClass='border-none'
              items={options}
              icon={EllipsisHorizontalIcon}
              onChange={onOptionChange}
              container={container}
            >
              {options[0].name}
            </DropdownIcon>
          ) : (
            <div />
          )}
        </div>
      ) : null}

      <div>{children}</div>
    </div>
  )
}
