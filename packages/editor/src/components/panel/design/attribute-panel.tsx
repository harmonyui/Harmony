/* eslint-disable @typescript-eslint/no-empty-interface -- ok*/

import { useMemo } from 'react'
import { useHarmonyStore } from '../../hooks/state'
import { useDesignPanels } from './register-panels'
import { getComponentType } from './utils'

interface ComponentAttributePanelProps {}
export const ComponentAttributePanel: React.FunctionComponent<
  ComponentAttributePanelProps
> = () => {
  const panels = useDesignPanels()
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const componentType = useMemo(
    () =>
      selectedComponent
        ? getComponentType(selectedComponent.element)
        : undefined,
    [selectedComponent],
  )
  const currPanels = useMemo(
    () => (componentType ? panels[componentType] : []),
    [panels, componentType],
  )

  return (
    <div className='hw-flex hw-flex-col hw-divide-y-2 hw-max-w-[300px]'>
      {currPanels.map((Panel, index) => (
        <Panel key={index} />
      ))}
    </div>
  )
}
