import ColorPicker from '@harmony/ui/src/components/core/color-picker'
import { Input, InputBlur } from '@harmony/ui/src/components/core/input'
import { useComponentAttribute } from '../attribute-provider'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'

export const BackgroundSection: DesignPanelSectionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  return (
    <Section label='Background'>
      <div className='hw-flex hw-gap-2 hw-items-center hw-h-5'>
        <ColorPicker
          className='hw-h-full'
          value={getAttribute('backgroundColor')}
          onChange={(value) =>
            onAttributeChange({ name: 'backgroundColor', value })
          }
        />
        <InputBlur
          className='hw-h-full hw-w-[100px]'
          value={getAttribute('backgroundColor').slice(1)}
          onChange={(value) =>
            onAttributeChange({ name: 'backgroundColor', value: `#${value}` })
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
    </Section>
  )
}
