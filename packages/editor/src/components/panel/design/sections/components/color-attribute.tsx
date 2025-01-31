import ColorPicker from '@harmony/ui/src/components/core/color-picker'
import { getClass } from '@harmony/util/src/utils/common'
import { useMemo } from 'react'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { ColorTools } from '../../../../attributes/types'
import { useTokenLink } from '../hooks/token-link'
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
      return Math.round(percentage)
    }

    return Math.round(Number(value) * 100)
  }, [getAttribute, colorValue])
  const { isExpanded, setIsExpanded } = useTokenLink(attribute)

  const onOpacityChange = (value: string) => {
    onAttributeChange({ name: attribute, value: colorValue.slice(0, 7) })
    onAttributeChange({ name: 'opacity', value: `${Number(value) / 100}` })
  }

  return (
    <div
      className={getClass('flex gap-1 items-center h-6 col-span-3', className)}
    >
      {isExpanded ? (
        <TokenDropdown attribute={attribute} />
      ) : (
        <div className='flex gap-1 items-center flex-1'>
          <ColorPicker
            className='h-6'
            value={colorValue}
            onChange={(value) =>
              onAttributeChange({ name: attribute, value: value.slice(0, 7) })
            }
            container={
              document.getElementById('harmony-container') || undefined
            }
          />
          <DesignInput
            className='h-full w-[80px]'
            value={colorValue.slice(1, 7)}
            onChange={(value) =>
              onAttributeChange({
                name: attribute,
                value: `#${value.slice(0, 6)}`,
              })
            }
          />
          <DesignInput
            className='h-full w-[60px]'
            value={`${opacity}`}
            onChange={onOpacityChange}
          />
        </div>
      )}
      <LinkButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
    </div>
  )
}
