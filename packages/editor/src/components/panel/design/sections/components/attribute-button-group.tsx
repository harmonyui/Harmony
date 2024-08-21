import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { CommonTools } from '../../types'
import { useComponentAttribute } from '../../attribute-provider'
import { ButtonGroup } from './button-group'

export interface ButtonItem<P extends CommonTools> {
  children: React.ReactNode
  value: Exclude<CSSProperties[P], undefined>
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
  const onChange = (value: ButtonItem<P>['value']) =>
    onAttributeChange({ name: attribute, value: value as string })

  return (
    <ButtonGroup
      items={items}
      value={currentValue}
      onChange={(value) =>
        onChange(value as Exclude<CSSProperties[P], undefined>)
      }
    />
  )
}
