import { useMemo } from 'react'
import { useHarmonyStore } from '../../../hooks/state'
import { useDesignPanels } from './register-panels'
import { getComponentType } from './utils'

interface ComponentAttributePanelProps {}
export const ComponentAttributePanel: React.FunctionComponent<
  ComponentAttributePanelProps
> = () => {
  const panels = useDesignPanels()
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const harmonyComponents = useHarmonyStore((store) => store.harmonyComponents)
  const componentType = useMemo(
    () =>
      selectedComponent
        ? getComponentType(selectedComponent.element, harmonyComponents)
        : undefined,
    [selectedComponent],
  )
  const currPanels = useMemo(
    () => (componentType ? panels[componentType] : []),
    [panels, componentType],
  )

  return (
    <div className='flex flex-col max-w-[300px] min-w-[258px] space-y-4'>
      {currPanels.map((Panel, index) => (
        <Panel key={index} />
      ))}
    </div>
  )
}
