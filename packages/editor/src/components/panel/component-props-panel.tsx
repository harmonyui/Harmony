import { SideDrawer } from '@harmony/ui/src/components/core/side-drawer'
import type { ComponentProp } from '@harmony/util/src/types/component'
import { Input } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import { useMemo } from 'react'
import { useHarmonyStore } from '../../hooks/state'

interface ComponentPropsPanelProps {
  isOpen: boolean
  onClose: () => void
}
export const ComponentPropsPanel: React.FunctionComponent<
  ComponentPropsPanelProps
> = ({ isOpen, onClose }) => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const properties = useMemo(
    () => selectedComponent?.props.filter((prop) => prop.isEditable) || [],
    [selectedComponent],
  )
  return (
    <SideDrawer header='Component Props' isOpen={isOpen} onClose={onClose}>
      {properties.length
        ? properties.map((prop) => (
            <ComponentPropertyField
              key={`${prop.name}:${prop.defaultValue}`}
              property={prop}
              onChange={() => undefined}
            />
          ))
        : null}
    </SideDrawer>
  )
}

interface ComponentPropertyFieldProps {
  property: ComponentProp
  onChange: (value: string) => void
}

export const ComponentPropertyField: React.FC<ComponentPropertyFieldProps> = ({
  property,
  onChange,
}) => {
  return (
    <div>
      <Label label={property.name}>
        <Input value={property.defaultValue} onChange={onChange} />
      </Label>
    </div>
  )
}
