import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { InputBlur } from '@harmony/ui/src/components/core/input'
import { useMemo } from 'react'
import {
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from '@harmony/ui/src/components/core/icons'
import { useHarmonyContext } from '../../../harmony-context'
import { useComponentAttribute } from '../attribute-provider'
import type { CommonTools } from '../types'
import { Section } from './components/section'
import type { DesignPanelSectionComponent } from './components/section'
import { Label } from './components/label'
import { AttributeButtonGroup } from './components/attribute-button-group'
import { ColorAttribute } from './components/color-attribute'

export const TypographySection: DesignPanelSectionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const { fonts } = useHarmonyContext()

  const items: DropdownItem<string>[] = useMemo(
    () =>
      (fonts ?? []).map((font) => ({
        id: font.id,
        name: font.name,
        className: font.id,
      })),
    [fonts],
  )

  const onChange = (name: CommonTools) => (value: string) =>
    onAttributeChange({ name, value })

  return (
    <Section label='Typography'>
      <div className='hw-grid hw-grid-cols-3 hw-gap-2'>
        <Label label='Font'>
          <div className='hw-col-span-2 hw-grid hw-grid-cols-3 hw-gap-2'>
            {fonts ? (
              <Dropdown
                className='hw-col-span-3 hw-w-full'
                items={items}
                initialValue={getAttribute('font')}
                onChange={(value) =>
                  onAttributeChange({ name: 'font', value: value.id })
                }
              />
            ) : null}

            <div className='hw-col-span-1 hw-flex hw-flex-col hw-gap-1 hw-text-xs hw-text-gray-400'>
              <InputBlur
                className='hw-flex-1'
                value={getAttribute('fontSize')}
                onChange={onChange('fontSize')}
              />
              <div>Size</div>
            </div>
            <div className='hw-col-span-1 hw-flex hw-flex-col hw-gap-1 hw-text-xs hw-text-gray-400'>
              <InputBlur
                className='hw-flex-1'
                value={getAttribute('lineHeight')}
                onChange={onChange('lineHeight')}
              />
              <div>Line</div>
            </div>
            <div className='hw-col-span-1 hw-flex hw-flex-col hw-gap-1 hw-text-xs hw-text-gray-400'>
              <InputBlur
                className='hw-flex-1'
                value={getAttribute('letterSpacing')}
                onChange={onChange('letterSpacing')}
              />
              <div>Spacing</div>
            </div>
          </div>
        </Label>
        <Label label='Alignment'>
          <AttributeButtonGroup
            attribute='textAlign'
            items={[
              {
                value: 'left',
                children: <TextAlignLeftIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'center',
                children: <TextAlignCenterIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'right',
                children: <TextAlignRightIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'justify',
                children: <TextAlignJustifyIcon className='hw-h-4 hw-w-4' />,
              },
            ]}
          />
        </Label>
        <Label label='Color'>
          <ColorAttribute attribute='color' />
        </Label>
      </div>
    </Section>
  )
}
