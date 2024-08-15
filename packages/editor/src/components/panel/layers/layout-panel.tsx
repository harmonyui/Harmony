import { useCallback, useMemo } from 'react'
import { useHarmonyContext } from '../../harmony-context'
import { isSelectable } from '../../inspector/inspector'
import type { ComponentElement } from '../../inspector/component-identifier'
import { useHarmonyStore } from '../../hooks/state'
import type { TreeViewItem } from '../tree-view'
import { TreeView } from '../tree-view'

export const ComponentLayoutPanel: React.FunctionComponent<
  ComponentTreeViewProps
> = ({ selectedComponent }) => {
  return (
    <div className='hw-max-w-[500px] hw-p-2'>
      <ComponentTreeView selectedComponent={selectedComponent} />
    </div>
  )
}

export const useComponentTreeItems = (
  root: ComponentElement | undefined,
  selectedComponent: HTMLElement | undefined,
): TreeViewItem<ComponentElement>[] => {
  const { scale } = useHarmonyContext()
  const getTreeItems = useCallback(
    (children: ComponentElement[]): TreeViewItem<ComponentElement>[] => {
      return children
        .filter((child) => isSelectable(child.element, scale))
        .map<TreeViewItem<ComponentElement>>((child) => ({
          id: child,
          content: child.name,
          items: getTreeItems(child.children),
          selected: selectedComponent === child.element,
        }))
    },
    [scale],
  )
  const treeItems: TreeViewItem<ComponentElement>[] = useMemo(
    () => (root ? getTreeItems([root]) : []),
    [root, getTreeItems],
  )

  return treeItems
}
interface ComponentTreeViewProps {
  selectedComponent: ComponentElement | undefined
}
const ComponentTreeView: React.FunctionComponent<
  ComponentTreeViewProps
> = () => {
  const { onComponentHover, onComponentSelect, selectedComponent } =
    useHarmonyContext()
  const rootComponent = useHarmonyStore((state) => state.rootComponent)

  const treeItems = useComponentTreeItems(rootComponent, selectedComponent)

  return (
    <TreeView
      items={treeItems}
      expand={true}
      onClick={(item) => {
        onComponentSelect(item)
      }}
      onHover={(item) => {
        onComponentHover(item)
      }}
    />
  )
}
