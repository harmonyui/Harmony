import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import {
  BorderAllIcon,
  BorderBottomLeftIcon,
  BorderBottomRightIcon,
  BorderTopLeftIcon,
  BorderTopRightIcon,
} from '@harmony/ui/src/components/core/icons'
import { InputBlur } from '@harmony/ui/src/components/core/input'
import { Slider } from '@harmony/ui/src/components/core/slider'
import { useMemo } from 'react'
import type { CommonTools } from '../types'
import { useComponentAttribute } from '../attribute-provider'
import { Label } from './components/label'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'

export const BorderSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Border'>
      <div className='hw-grid hw-grid-cols-3 hw-items-center hw-gap-2'>
        <Label label='Radius'>
          <div className='hw-col-span-2'>
            <IconInput icon={BorderAllIcon} attribute='borderRadius' slider />
          </div>
        </Label>
        <div className='hw-col-span-1'>
          <IconInput icon={BorderTopLeftIcon} attribute='borderTopLeftRadius' />
        </div>
        <div className='hw-col-span-2'>
          <IconInput
            icon={BorderTopRightIcon}
            attribute='borderTopRightRadius'
          />
        </div>
        <div className='hw-col-span-1'>
          <IconInput
            icon={BorderBottomLeftIcon}
            attribute='borderBottomLeftRadius'
          />
        </div>
        <div className='hw-col-span-2'>
          <IconInput
            icon={BorderBottomRightIcon}
            attribute='borderBottomRightRadius'
          />
        </div>

        <Label label='Stroke'>
          <div className='hw-col-span-2'>
            <IconInput attribute='borderWidth' slider />
          </div>
        </Label>
        <div className='hw-col-span-1'>
          <IconInput label='T' attribute='borderTopWidth' />
        </div>
        <div className='hw-col-span-2'>
          <IconInput label='B' attribute='borderBottomWidth' />
        </div>
        <div className='hw-col-span-1'>
          <IconInput label='L' attribute='borderLeftWidth' />
        </div>
        <div className='hw-col-span-2'>
          <IconInput label='R' attribute='borderRightWidth' />
        </div>
      </div>
    </Section>
  )
}

const IconInput: React.FunctionComponent<{
  icon?: IconComponent
  label?: string
  attribute: CommonTools
  slider?: boolean
}> = ({ icon: Icon, label, attribute, slider }) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  const attrValue = useMemo(() => {
    const val = getAttribute(attribute)
    const split = val.split(' ')
    if (split.length > 1) {
      return `${Math.max(...split.map((v) => parseInt(v)))}px`
    }

    return split[0]
  }, [attribute, getAttribute])
  return (
    <div className='hw-flex hw-gap-2 hw-items-center'>
      {Icon || label ? (
        <div className='hw-bg-[#4B5563] hw-rounded-lg hw-px-1 hw-py-1.5 hw-text-white hw-fill-white'>
          {Icon ? (
            <Icon className='hw-h-4 hw-w-4 ' />
          ) : (
            <span className='hw-h-4 hw-w-4'>{label}</span>
          )}
        </div>
      ) : null}
      <InputBlur
        className='hw-w-full'
        value={attrValue}
        onChange={(value) => onAttributeChange({ name: attribute, value })}
      />
      {slider ? (
        <Slider
          className='!hw-min-w-[0px]'
          value={parseInt(attrValue)}
          onChange={(value) =>
            onAttributeChange({ name: attribute, value: `${value}px` })
          }
          max={100}
        />
      ) : null}
    </div>
  )
}
