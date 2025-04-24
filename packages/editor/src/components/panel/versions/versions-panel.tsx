import { reverseUpdates } from '@harmony/util/src/utils/component'
import { useHarmonyStore } from '../../../hooks/state'
import { findElementFromId } from '../../../utils/element-utils'
import { VersionUpdate } from '../../../utils/version-updates'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { VersionsView } from './versions-view'
import { ComponentUpdate } from '@harmony/util/src/types/component'

export const VersionsPanel: React.FunctionComponent = () => {
  const versionUpdates = useHarmonyStore((state) => state.versionUpdates)
  const setHoverElement = useHarmonyStore((state) => state.hoverComponent)
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const selectElement = useHarmonyStore((state) => state.selectElement)
  const makeUpdates = useHarmonyStore((state) => state.makeUpdates)

  const onHover = ({ update }: VersionUpdate['changes'][number]) => {
    const element = findElementFromId(
      update.componentId,
      update.childIndex,
      rootComponent?.element,
    )
    if (!element) return

    setHoverElement(element)
  }

  const onSelect = ({ update }: VersionUpdate['changes'][number]) => {
    const element = findElementFromId(
      update.componentId,
      update.childIndex,
      rootComponent?.element,
    )
    if (!element) return

    selectElement(element)
  }

  const onHideChange = (
    { update }: VersionUpdate['changes'][number],
    hideChanges: boolean,
  ) => {
    makeUpdates(
      hideChanges ? reverseUpdates([update]) : [update],
      rootComponent?.element,
    )
  }

  return (
    <DraggablePanel title='Changes' id={Panels.Versions} defaultActive={false}>
      <VersionsView
        data={versionUpdates}
        onHover={onHover}
        onSelect={onSelect}
        onHideChange={onHideChange}
      />
    </DraggablePanel>
  )
}
