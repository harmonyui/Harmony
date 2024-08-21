import { useMemo } from 'react'
import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { useComponentAttribute } from '../../attribute-provider'
import type { CommonTools } from '../../types'
import { DesignInput } from './design-input'
import { Label } from './label'

interface AttributeExpandProps {
  attribute: CommonTools
  label: string
  isExpanded: boolean
  expandedAttributes: CommonTools[]
  icons?: IconComponent[]
  additionalContent?: React.ReactNode
}
export const AttributeExpand: React.FunctionComponent<AttributeExpandProps> = ({
  label,
  attribute,
  expandedAttributes,
  icons,
  isExpanded,
  additionalContent,
}) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  const attrValue = useMemo(() => {
    const val = getAttribute(attribute)
    const split = val.split(' ')
    if (split.length > 1) {
      return `${Math.max(...split.map((v) => parseInt(v === 'normal' ? '0' : v)))}px`
    }

    return split[0]
  }, [attribute, getAttribute])

  const values = useMemo(() => {
    const val = getAttribute(attribute)
    const split = val.split(' ')
    const vals: string[] = []
    for (let i = 0; i < expandedAttributes.length; i++) {
      const v = split[i % split.length]
      vals.push(v === 'normal' ? '0px' : v)
    }
    return vals
  }, [attribute, getAttribute])

  return (
    <>
      <Label label={label}>
        <div className='hw-col-span-2 hw-flex hw-gap-2'>
          <DesignInput
            className='hw-w-full'
            value={attrValue}
            onChange={(value) => onAttributeChange({ name: attribute, value })}
          />
          {additionalContent}
        </div>
      </Label>
      {isExpanded ? (
        <div className='hw-grid hw-grid-cols-2 hw-gap-2 hw-col-span-3'>
          {values.map((value, index) => {
            const Icon = icons ? icons[index] : null
            return (
              <div key={index} className='hw-col-span-1'>
                {Icon ? <Icon className='hw-h-4 hw-w-4' /> : null}
                <DesignInput
                  className='hw-w-full'
                  value={value}
                  onChange={(_value) =>
                    onAttributeChange({
                      name: expandedAttributes[index],
                      value: _value,
                    })
                  }
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
