import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { ComponentAttributePanel } from '../attribute-panel'

export const DesignOverlay: React.FunctionComponent = () => {
  return (
    <DraggablePanel title='Design Panel' id={Panels.Design}>
      <ComponentAttributePanel />
    </DraggablePanel>
  )
}
