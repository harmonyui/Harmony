import { useMemo } from 'react'
import { useHarmonyStore } from '../../../../hooks/state'
import { translatePropertyName } from '../../../../utils/element-utils'
import { useHarmonyContext } from '../../../harmony-context'
import { PropertyInput } from '../../_common/property/property-input'
import { getPropertyType } from '../../../image/utils'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'

export const PropertySection: DesignPanelSectionComponent = () => {
  const { onPropertyChange } = useHarmonyContext()
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const props = useMemo(
    () =>
      selectedComponent?.props.filter(
        (prop) => prop.isStatic && prop.type === 'property',
      ) ?? [],
    [selectedComponent],
  )

  if (props.length === 0) return null

  const onPropChange = (propName: string, value: string) => {
    onPropertyChange(propName, value, selectedComponent?.element)
  }

  return (
    <Section label='Properties'>
      <div className='hw-grid hw-grid-cols-3 hw-items-center hw-gap-2'>
        {props.map((prop) => (
          <Label
            key={prop.propName}
            label={translatePropertyName(prop.propName)}
          >
            <PropertyInput
              type={getPropertyType(prop.propName)}
              key={prop.propName}
              value={
                selectedComponent?.element.getAttribute(prop.propName) ?? ''
              }
              onChange={(value) => onPropChange(prop.propName, value)}
            />
          </Label>
        ))}
      </div>
    </Section>
  )
}
