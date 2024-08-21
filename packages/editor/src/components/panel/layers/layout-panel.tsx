import { useCallback, useMemo } from 'react'
import type { TreeData } from '@harmony/ui/src/components/core/tree'
import { useHarmonyContext } from '../../harmony-context'
import { isSelectable } from '../../inspector/inspector'
import type { ComponentElement } from '../../inspector/component-identifier'
import { useHarmonyStore } from '../../hooks/state'
import { TreeView } from '../tree-view'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'

export const LayoutPanel: React.FunctionComponent = () => {
  return (
    <DraggablePanel title='Layers' id={Panels.Layers}>
      <ComponentTreeView />
    </DraggablePanel>
  )
}

export const useComponentTreeItems = (
  root: ComponentElement | undefined,
  selectedComponent: HTMLElement | undefined,
): TreeData<HTMLElement>[] => {
  const { scale } = useHarmonyContext()
  const ids: string[] = []
  const getTreeItems = useCallback(
    (children: ComponentElement[]): TreeData<HTMLElement>[] | undefined => {
      const filtered = children.filter(
        (child) =>
          isSelectable(child.element, scale) &&
          child.element.dataset.harmonyText !== 'true',
      )
      if (filtered.length === 0) return undefined

      return filtered.map<TreeData<HTMLElement>>((child) => {
        if (!child.id) {
          throw new Error('Element does not have an id')
        }
        const sameIds = ids.filter((id) => id === child.id)
        const id = `${child.id}-${sameIds.length}`
        ids.push(child.id)
        return {
          id,
          data: child.element,
          name: child.name,
          children: getTreeItems(child.children),
          selected: selectedComponent === child.element,
        }
      })
    },
    [scale],
  )
  const treeItems: TreeData<HTMLElement>[] = useMemo(
    () => (root ? getTreeItems([root]) ?? [] : []),
    [root, getTreeItems],
  )

  return treeItems
}

const ComponentTreeView: React.FunctionComponent = () => {
  const { selectedComponent } = useHarmonyContext()
  const rootComponent = useHarmonyStore((state) => state.rootComponent)

  const treeItems = useComponentTreeItems(rootComponent, selectedComponent)

  return <TreeView items={treeItems} />
}
