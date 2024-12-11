import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import React, { useMemo } from 'react'
import {
  BoldIcon,
  StrikeThroughIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  UnderlineIcon,
} from '@harmony/ui/src/components/core/icons'
import { useHarmonyContext } from '../../../harmony-context'
import { useComponentAttribute } from '../../../attributes/attribute-provider'
import type { CommonTools } from '../../../attributes/types'
import { Section } from './components/section'
import type { DesignPanelSectionComponent } from './components/section'
import { Label } from './components/label'
import { AttributeButtonGroup } from './components/attribute-button-group'
import { ColorAttribute } from './components/color-attribute'
import { DesignDropdown } from './components/design-dropdown'
import { DesignInput } from './components/design-input'
import { ButtonGroupButton } from './components/button-group'
import { TokenDropdown } from './components/token-dropdown'

export const TypographySection: DesignPanelSectionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  const spacing = useMemo(() => getAttribute('letterSpacing'), [getAttribute])
  const onChange = (name: CommonTools) => (value: string) =>
    onAttributeChange({ name, value })

  return (
    <Section label='Typography'>
      <div className='hw-grid hw-grid-cols-3 hw-gap-2 hw-items-center'>
        <FontDropdown />
        <FontWeightDropdown />
        <TokenDropdown attribute='fontSize' />
        <ColorAttribute className='hw-col-span-2' attribute='color' />
        <TextAlignSection />
        <TextTypeSection />
        <Label label='Line Height'>
          <DesignInput
            className='hw-w-full hw-col-span-2'
            value={getAttribute('lineHeight')}
            onChange={onChange('lineHeight')}
          />
        </Label>
        <Label label='Letter Spacing'>
          <DesignInput
            className='hw-w-full hw-col-span-2'
            value={spacing === 'normal' ? '0px' : spacing}
            onChange={onChange('letterSpacing')}
          />
        </Label>
      </div>
    </Section>
  )
}

const FontDropdown: React.FunctionComponent = () => {
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

  if (!fonts) return null

  return (
    <DesignDropdown
      className='hw-col-span-3 hw-w-full'
      items={items}
      initialValue={getAttribute('font')}
      onChange={(value) => onAttributeChange({ name: 'font', value: value.id })}
      container={document.getElementById('harmony-container') || undefined}
    />
  )
}

const FontWeightDropdown: React.FunctionComponent = () => {
  return (
    <TokenDropdown className='hw-col-span-2 hw-w-full' attribute='fontWeight' />
  )
}

const TextAlignSection: React.FunctionComponent = () => {
  return (
    <AttributeButtonGroup
      className='hw-col-span-2'
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
  )
}

const TextTypeSection: React.FunctionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const textDecorationLine = useMemo(
    () => getAttribute('textDecorationLine'),
    [getAttribute],
  )
  const isBold = useMemo(
    () => getAttribute('fontWeight') === '700',
    [getAttribute],
  )

  return (
    <div className='hw-flex hw-gap-1'>
      <ButtonGroupButton
        show={isBold}
        onClick={() =>
          onAttributeChange({
            name: 'fontWeight',
            value: isBold ? '400' : '700',
          })
        }
      >
        <BoldIcon className='hw-w-4 hw-h-4' />
      </ButtonGroupButton>
      <ButtonGroupButton
        show={textDecorationLine === 'underline'}
        onClick={() =>
          onAttributeChange({
            name: 'textDecorationLine',
            value: textDecorationLine === 'underline' ? 'none' : 'underline',
          })
        }
      >
        <UnderlineIcon className='hw-w-4 hw-h-4' />
      </ButtonGroupButton>
      <ButtonGroupButton
        show={textDecorationLine === 'line-through'}
        onClick={() =>
          onAttributeChange({
            name: 'textDecorationLine',
            value:
              textDecorationLine === 'line-through' ? 'none' : 'line-through',
          })
        }
      >
        <StrikeThroughIcon className='hw-w-4 hw-h-4' />
      </ButtonGroupButton>
    </div>
  )
}
