import ColorPicker from '@harmony/ui/src/components/core/color-picker'
import { getClass } from '@harmony/util/src/utils/common'
import { useMemo } from 'react'
import { useComponentAttribute } from '../../attribute-provider'
import type { ColorTools } from '../../types'
import { useLink } from '../hooks/link'
import { DesignInput } from './design-input'
import { TokenDropdown } from './token-dropdown'
import { LinkButton } from './link-button'

export const ColorAttribute: React.FunctionComponent<{
  attribute: ColorTools
  className?: string
}> = ({ attribute, className }) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const colorValue = useMemo(() => getAttribute(attribute), [getAttribute])
  const opacity = useMemo(() => {
    const value = getAttribute('opacity')
    const colorOpacity = colorValue.slice(7, 9)
    if (colorOpacity) {
      const opacityValue = parseInt(colorOpacity, 16) / 255
      const percentage = opacityValue * 100
      return percentage
    }

    return Number(value) * 100
  }, [getAttribute, colorValue])
  const { isExpanded, setIsExpanded } = useLink(attribute)

  const onOpacityChange = (value: string) => {
    onAttributeChange({ name: attribute, value: colorValue.slice(0, 7) })
    onAttributeChange({ name: 'opacity', value: `${Number(value) / 100}` })
  }

  return (
    <div
      className={getClass(
        'hw-flex hw-gap-1 hw-items-center hw-h-6 hw-col-span-3',
        className,
      )}
    >
      {isExpanded ? (
        <TokenDropdown attribute={attribute} />
      ) : (
        <div className='hw-flex hw-gap-1 hw-items-center hw-flex-1'>
          <ColorPicker
            className='hw-h-6'
            value={colorValue}
            onChange={(value) =>
              onAttributeChange({ name: attribute, value: value.slice(0, 7) })
            }
            container={
              document.getElementById('harmony-container') || undefined
            }
          />
          <DesignInput
            className='hw-h-full hw-w-[80px]'
            value={colorValue.slice(1, 7)}
            onChange={(value) =>
              onAttributeChange({
                name: attribute,
                value: `#${value.slice(0, 6)}`,
              })
            }
          />
          <DesignInput
            className='hw-h-full hw-w-[60px]'
            value={`${opacity}`}
            onChange={onOpacityChange}
          />
        </div>
      )}
      <LinkButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
    </div>
  )
}
