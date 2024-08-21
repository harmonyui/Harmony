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
}
export const ButtonGroup = ({ items, value, onChange }: ButtonGroupProps) => {
  return (
    <div className='hw-flex hw-gap-2 hw-rounded-lg hw-col-span-2'>
      {items.map((item) => (
        <Button
          className={getClass('hw-flex-1 !hw-border-0 hover:hw-bg-[#E5E7EB]')}
          key={item.value}
          mode='other'
          backgroundColor={item.value === value ? '#E5E7EB' : ''}
          onClick={() => onChange(item.value)}
        >
          {item.children}
        </Button>
      ))}
    </div>
  )
}
