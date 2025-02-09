import { useCallback, useMemo } from 'react'
import type { ComponentProp } from '@harmony/util/src/types/component'
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import { useHarmonyStore } from '../../../../hooks/state'
import {
  findElementsFromId,
  translatePropertyName,
} from '../../../../utils/element-utils'
import { useHarmonyContext } from '../../../harmony-context'
import { PropertyInput } from '../../_common/property/property-input'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'

const isUnique = <T, K extends keyof T>(
  values: T[],
  keySelector: (value: T) => T[K],
) => {
  return values.filter((value) => {
    const key = keySelector(value)
    return values.filter((v) => keySelector(v) === key).length === 1
  })
}

export const PropertySection: DesignPanelSectionComponent = () => {
  const { onElementPropertyChange, onComponentPropertyChange, onTextChange } =
    useHarmonyContext()
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const rootElement = useHarmonyStore((state) => state.rootComponent)?.element
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

      const mappedElement = findElementsFromId(prop.mapping, rootElement)[0]
      if (!mappedElement) return ''

      if (prop.mappingType === 'attribute') {
        const attributeName = prop.name === 'className' ? 'class' : prop.name
        return mappedElement.getAttribute(attributeName) ?? ''
      } else {
        return mappedElement.textContent ?? ''
      }
    },
    [selectedComponent],
  )

  const props = useMemo(
    () =>
      isUnique(
        selectedComponent?.props
          .map((prop) => ({ ...prop, value: getPropValue(prop) }))
          .filter((prop) => prop.isEditable && prop.value) ?? [],
        (prop) => prop.name,
      ),
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

    const mappedElement = findElementsFromId(prop.mapping, rootElement)[0]
    if (!mappedElement) {
      throw new Error("Couldn't find element to update property")
    }

    if (prop.mappingType === 'attribute') {
      onElementPropertyChange(prop.name, value, mappedElement)
    } else {
      onTextChange(value, mappedElement.textContent ?? '', mappedElement)
    }
  }

  return (
    <Section label='Properties'>
      <div className='grid grid-cols-3 items-center gap-2'>
        {props.map((prop) => (
          <Label
            key={`${selectedComponent?.id}-${prop.name}`}
            label={translatePropertyName(prop.name)}
          >
            <PropertyInput
              type={prop.type}
              key={`${selectedComponent?.id}-${prop.name}`}
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
