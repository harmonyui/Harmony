import { Button } from '@harmony/ui/src/components/core/button'
import { getClass } from '@harmony/util/src/utils/common'

export interface ButtonItem {
  children: React.ReactNode
  value: string | number
}
interface ButtonGroupProps {
  items: ButtonItem[]
  value: string | number
  onChange: (value: string | number) => void
  className?: string
}
export const ButtonGroup = ({
  items,
  value,
  onChange,
  className,
}: ButtonGroupProps) => {
  return (
    <div
      className={getClass(
        'flex gap-1 rounded-lg',
        className ? className : 'col-span-2',
      )}
    >
      {items.map((item) => (
        <ButtonGroupButton
          className='flex-1'
          key={item.value}
          show={
            item.value === value ||
            (item.value === 'inherit' && !items.find((i) => i.value === value))
          }
          onClick={() => onChange(item.value)}
        >
          {item.children}
        </ButtonGroupButton>
      ))}
    </div>
  )
}

export const ButtonGroupButton: React.FunctionComponent<{
  show: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}> = ({ show, onClick, children, className }) => {
  return (
    <Button
      className={getClass(
        'flex items-center justify-center p-1 !border-0 hover:bg-[#E5E7EB] rounded-lg',
        show ? 'bg-[#E5E7EB]' : '',
        className,
      )}
      mode='none'
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
