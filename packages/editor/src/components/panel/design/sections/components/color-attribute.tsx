import ColorPicker from '@harmony/ui/src/components/core/color-picker'
import { InputBlur } from '@harmony/ui/src/components/core/input'
import { getClass } from '@harmony/util/src/utils/common'
import { useComponentAttribute } from '../../attribute-provider'
import type { ColorTools } from '../../types'

export const ColorAttribute: React.FunctionComponent<{
  attribute: ColorTools
  className?: string
}> = ({ attribute, className }) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  return (
    <div
      className={getClass('hw-flex hw-gap-2 hw-items-center hw-h-5', className)}
    >
      <ColorPicker
        className='hw-h-full'
        value={getAttribute(attribute)}
        onChange={(value) => onAttributeChange({ name: attribute, value })}
        container={document.getElementById('harmony-container') || undefined}
      />
      <InputBlur
        className='hw-h-full hw-w-[100px]'
        value={getAttribute(attribute).slice(1)}
        onChange={(value) =>
          onAttributeChange({ name: attribute, value: `#${value}` })
        }
      />
      <InputBlur
        className='hw-h-full hw-w-[60px]'
        value={`${Number(getAttribute('opacity')) * 100}`}
        onChange={(value) =>
          onAttributeChange({
            name: 'opacity',
            value: `${Number(value) / 100}`,
          })
        }
      />
    </div>
  )
}
