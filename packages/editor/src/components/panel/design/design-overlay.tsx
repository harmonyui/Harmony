import { useHarmonyStore } from '../../../hooks/state'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { ComponentAttributePanel } from './attribute-panel'

export const DesignOverlay: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  return (
    <DraggablePanel
      title='Design Panel'
      id={Panels.Design}
      defaultActive={isDemo ?? false}
    >
      <ComponentAttributePanel />
    </DraggablePanel>
  )
}
