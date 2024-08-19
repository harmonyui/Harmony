import { InputBlur } from '@harmony/ui/src/components/core/input'
import { capitalizeFirstLetter } from '@harmony/util/src/utils/common'
import { overlayStyles } from '../../../inspector/inspector'
import { useComponentAttribute } from '../attribute-provider'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'

export const SpacingSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Spacing'>
      <EditSpacing spacing='margin' />
      <EditSpacing spacing='padding' />
    </Section>
  )
}

const sides = ['Top', 'Bottom', 'Left', 'Right'] as const
type Side = (typeof sides)[number]

interface EditAttributeProps {
  label: string
  children?: React.ReactNode
  sameLine: React.ReactNode
  color?: string
}
const EditAttribute: React.FunctionComponent<EditAttributeProps> = ({
  label,
  sameLine,
  children,
  color,
}) => {
  return (
    <div
      className='hw-flex hw-flex-col hw-gap-1'
      style={{ backgroundColor: color }}
    >
      <div className='hw-flex hw-justify-between hw-items-center'>
        <label className='hw-block hw-text-sm hw-font-medium hw-leading-6 hw-text-gray-900'>
          {label}
        </label>
        {sameLine}
      </div>
      {children}
    </div>
  )
}

interface EditSpacingProps {
  spacing: 'margin' | 'padding'
}
const EditSpacing: React.FunctionComponent<EditSpacingProps> = ({
  spacing,
}) => {
  const { onAttributeChange, getAttribute } = useComponentAttribute()

  const onChange = (side: `${typeof spacing}${Side}`) => (value: string) =>
    onAttributeChange({ name: side, value })

  const color =
    spacing === 'margin' ? overlayStyles.margin : overlayStyles.padding

  return (
    <EditAttribute
      label={capitalizeFirstLetter(spacing)}
      color={color}
      sameLine={<></>}
    >
      <div className='hw-flex hw-gap-1 hw-text-xs hw-text-gray-400'>
        {sides.map((side) => (
          <div key={side} className='hw-flex-1'>
            <InputBlur
              className='hw-w-full'
              value={getAttribute(`${spacing}${side}`)}
              onChange={onChange(`${spacing}${side}`)}
            />
            <div>{side}</div>
          </div>
        ))}
      </div>
    </EditAttribute>
  )
}
