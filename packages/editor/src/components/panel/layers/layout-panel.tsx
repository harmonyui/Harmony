import { useCallback, useMemo, useState } from 'react'
import type { TreeData } from '@harmony/ui/src/components/core/tree'
import { Input } from '@harmony/ui/src/components/core/input'
import { useHarmonyContext } from '../../harmony-context'
import { isSelectable, isSizeThreshold } from '../../inspector/inspector'
import type { ComponentElement } from '../../inspector/component-identifier'
import { useHarmonyStore } from '../../../hooks/state'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { getComponentName } from '../design/utils'
import { Card } from '../_common/panel/card'
import { TreeView } from './tree-view'

export const LayoutPanel: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  if (isDemo || isDemo === undefined) return null

  return (
    <DraggablePanel title='Layers' id={Panels.Layers} defaultActive={false}>
      <Card>
        <ComponentTreeView />
      </Card>
    </DraggablePanel>
  )
}

const isLayerSelectable = (element: HTMLElement, scale: number): boolean => {
  const style = getComputedStyle(element)
  //Layers that have absolute can be selectable
  return (
    isSelectable(element, scale) ||
    (style.position === 'absolute' && isSizeThreshold(element, scale))
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
      const filtered = children.filter((child) =>
        isLayerSelectable(child.element, scale),
      )
      if (filtered.length === 0) return undefined

      return filtered.map<TreeData<HTMLElement>>((child) => {
        let id = child.id
        if (
          child.element.dataset.harmonyText === 'true' &&
          child.element.parentElement
        ) {
          id = `${child.element.parentElement.dataset.harmonyId}-text`
        }
        if (!id) {
          throw new Error('Element does not have an id')
        }
        const sameIds = ids.filter((_id) => _id === id)
        const finalId = `${id}-${sameIds.length}`
        ids.push(id)
        return {
          id: finalId,
          data: child.element,
          name: getComponentName(child),
          children: getTreeItems(child.children),
          selected: selectedComponent === child.element,
        }
      })
    },
    [scale, selectedComponent],
  )
  const treeItems: TreeData<HTMLElement>[] = useMemo(
    () => (root ? (getTreeItems([root]) ?? []) : []),
    [root, getTreeItems],
  )

  return treeItems
}

const ComponentTreeView: React.FunctionComponent = () => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const [search, setSearch] = useState('')

  const treeItems = useComponentTreeItems(
    rootComponent,
    selectedComponent?.element,
  )
  const filteredTreeItems = useFilterTreeItems(treeItems, search)

  return (
    <div className='flex flex-col gap-2'>
      <Input
        className='hw-w-full'
        placeholder='Search'
        value={search}
        onChange={setSearch}
      />
      <TreeView items={filteredTreeItems} />
    </div>
  )
}

const useFilterTreeItems = (
  treeItems: TreeData<HTMLElement>[],
  search: string,
) => {
  const filteredTreeItems = useMemo(() => {
    if (!search) return treeItems

    const filterItems = (
      items: TreeData<HTMLElement>[],
    ): TreeData<HTMLElement>[] => {
      return items.reduce<TreeData<HTMLElement>[]>((acc, item) => {
        const children = item.children ? filterItems(item.children) : undefined
        if (children && children.length > 0) {
          //acc.push({...item, children})
          acc.push(...children)
        } else if (
          (item.name as string).toLowerCase().includes(search.toLowerCase())
        ) {
          acc.push(item)
        }
        return acc
      }, [])
    }

    return filterItems(treeItems)
  }, [treeItems, search])

  return filteredTreeItems
}
