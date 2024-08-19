import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { getClass } from '@harmony/util/src/utils/common'
import type { CommonTools } from '../../types'
import { useComponentAttribute } from '../../attribute-provider'

export interface ButtonItem<P extends CommonTools> {
  children: React.ReactNode
  value: CSSProperties[P]
}
interface AttributeButtonGroupProps<P extends CommonTools> {
  items: ButtonItem<P>[]
  attribute: P
}
export const AttributeButtonGroup = <P extends CommonTools>({
  items,
  attribute,
}: AttributeButtonGroupProps<P>) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const currentValue = useMemo(
    () => getAttribute(attribute),
    [getAttribute, attribute],
  )
  const onChange = (value: ButtonItem<P>['value']) => () =>
    onAttributeChange({ name: attribute, value: value as string })

  return (
    <div className='hw-p-2 hw-flex hw-gap-2 hw-rounded-lg hw-bg-[#E5E7EB] hw-col-span-2'>
      {items.map((item) => (
        <Button
          className={getClass(
            'hw-flex-1 !hw-border-0',
            item.value === currentValue
              ? 'hw-text-white *:hw-fill-[white]'
              : '',
          )}
          key={item.value}
          mode='other'
          backgroundColor={item.value === currentValue ? '#4B5563' : '#E5E7EB'}
          onClick={onChange(item.value)}
        >
          {item.children}
        </Button>
      ))}
    </div>
  )
}
