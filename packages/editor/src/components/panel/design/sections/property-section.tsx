import { useCallback, useMemo } from 'react'
import type { ComponentProp } from '@harmony/util/src/types/component'
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import { useHarmonyStore } from '../../../../hooks/state'
import { translatePropertyName } from '../../../../utils/element-utils'
import { useHarmonyContext } from '../../../harmony-context'
import { PropertyInput } from '../../_common/property/property-input'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'

export const PropertySection: DesignPanelSectionComponent = () => {
  const { onElementPropertyChange, onComponentPropertyChange } =
    useHarmonyContext()
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const getPropValue = useCallback(
    (prop: ComponentProp) => {
      if (prop.type === 'classVariant') {
        const classes = selectedComponent?.element.getAttribute('class') ?? ''
        const value = Object.entries(prop.values).find(([_, _value]) =>
          classes.includes(_value),
        )
        if (value) return value[0]

        return ''
      }

      const attributeName = prop.name === 'className' ? 'class' : prop.name
      return selectedComponent?.element.getAttribute(attributeName) ?? ''
    },
    [selectedComponent],
  )

  const props = useMemo(
    () =>
      selectedComponent?.props
        .map((prop) => ({ ...prop, value: getPropValue(prop) }))
        .filter((prop) => prop.isEditable && prop.value) ?? [],
    [selectedComponent, getPropValue],
  )

  if (props.length === 0) return null

  const onPropChange = (prop: ComponentProp, value: string) => {
    if (prop.type === 'classVariant') {
      const oldValue = getPropValue(prop)
      const valueMapping = prop.values[value]
      const oldValueMapping = prop.values[oldValue]
      const updateValue: UpdateProperty = {
        type: 'classNameVariant',
        name: prop.name,
        value,
        valueMapping,
      }
      const oldUpdateValue: UpdateProperty = {
        type: 'classNameVariant',
        name: prop.name,
        value: oldValue,
        valueMapping: oldValueMapping,
      }
      onComponentPropertyChange(
        updateValue,
        oldUpdateValue,
        selectedComponent?.element,
      )
      return
    }
    onElementPropertyChange(prop.name, value, selectedComponent?.element)
  }

  return (
    <Section label='Properties'>
      <div className='grid grid-cols-3 items-center gap-2'>
        {props.map((prop) => (
          <Label key={prop.name} label={translatePropertyName(prop.name)}>
            <PropertyInput
              type={prop.type}
              key={prop.name}
              value={prop.value}
              onChange={(value) => onPropChange(prop, value)}
              values={prop.values}
            />
          </Label>
        ))}
      </div>
    </Section>
  )
}
