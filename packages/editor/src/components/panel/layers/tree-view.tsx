import { useMemo, useState } from 'react'
import type { TreeData, TreeProps } from '@harmony/ui/src/components/core/tree'
import { Tree } from '@harmony/ui/src/components/core/tree'
import {
  FrameIcon,
  ImageIcon,
  TIcon,
  ComponentIcon as ComponentIconRaw,
} from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { ContextMenuItem } from '@harmony/ui/src/components/core/context-menu'
import { createUpdate } from '@harmony/util/src/updates/utils'
import type {
  ReorderComponent,
  WrapUnwrapComponent,
} from '@harmony/util/src/updates/component'
import type { ComponentUpdateWithoutGlobal } from '../../harmony-context'
import { useHarmonyContext } from '../../harmony-context'
import { getComponentIdAndChildIndex } from '../../../utils/element-utils'
import { ComponentType } from '../../attributes/types'
import { getComponentType } from '../design/utils'
import { useHarmonyStore } from '../../../hooks/state'
import { useComponentMenu } from '../../harmonycn/component-provider'
import { useUpdateComponent } from '../../harmonycn/update-component'
import { generateComponentIdFromParent } from '@harmony/util/src/utils/component'
import { useOpenEditor } from '../../../hooks/open-editor'

export interface TransformNode extends Record<string, NonNullable<unknown>> {
  id: string
  type: string
  subChild: TransformNode[]
  expanded: boolean
  childIndex: number
  error: string
  component: string
}

interface TreeViewProps {
  items: TreeData<HTMLElement>[]
}
export const TreeView = ({ items }: TreeViewProps) => {
  const { onAttributesChange } = useHarmonyContext()
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const onComponentSelect = useHarmonyStore((store) => store.selectElement)
  const onComponentHover = useHarmonyStore((store) => store.hoverComponent)
  const harmonyComponents = useHarmonyStore((store) => store.harmonyComponents)
  const { setIsOpen: setComponentMenuOpen } = useComponentMenu()
  const { deleteComponent } = useUpdateComponent()
  const getNewChildIndex = useHarmonyStore((store) => store.getNewChildIndex)

  const [selectedElements, setSelectedElements] = useState<HTMLElement[]>([])

  const selectedId = useMemo(() => {
    const findSelected = (
      _items: TreeData<HTMLElement>[],
    ): string | undefined => {
      for (const item of _items) {
        if (item.selected) {
          return item.id
        }
        if (item.children) {
          const found = findSelected(item.children)
          if (found) {
            return found
          }
        }
      }

      return undefined
    }

    return findSelected(items)
  }, [items])

  const onDrag: TreeProps<HTMLElement>['onDrag'] = ({
    index,
    dragData,
    parentData,
  }) => {
    const { componentId, childIndex } = getComponentIdAndChildIndex(
      dragData[0].data,
    )
    const oldParent = dragData[0].data.parentElement
    if (!oldParent) {
      throw new Error('Old parent not found')
    }
    if (!parentData?.data) {
      throw new Error('Parent not found')
    }
    const { componentId: oldParentId, childIndex: oldParentChildIndex } =
      getComponentIdAndChildIndex(oldParent)
    const oldIndex = Array.from(oldParent.children).indexOf(dragData[0].data)

    const { componentId: newParentId, childIndex: newParentChildIndex } =
      getComponentIdAndChildIndex(parentData.data)
    const newIndex = index

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'reorder',
      componentId,
      childIndex,
      oldValue: createUpdate<ReorderComponent>({
        parentId: oldParentId,
        parentChildIndex: oldParentChildIndex,
        index: oldIndex,
      }),
      value: createUpdate<ReorderComponent>({
        parentId: newParentId,
        parentChildIndex: newParentChildIndex,
        index: newIndex,
      }),
    }
    onAttributesChange([update])
  }

  const onSelect: TreeProps<HTMLElement>['onSelect'] = (nodes) => {
    onComponentSelect(nodes[0]?.data)
    setSelectedElements(nodes.map((node) => node.data))
  }

  const onHover: TreeProps<HTMLElement>['onHover'] = ({ data }) => {
    onComponentHover(data)
  }

  const handleWrapElement = useEffectEvent(() => {
    if (selectedElements.length === 0) return
    const { componentId } = getComponentIdAndChildIndex(selectedElements[0])
    const newComponentId = generateComponentIdFromParent(componentId)
    const newChildIndex = getNewChildIndex(newComponentId)

    const parentElement = selectedElements[0].parentElement!
    const topElements: HTMLElement[] = []
    selectedElements.forEach((el) => {
      if (el.parentElement === parentElement) {
        topElements.push(el)
      }
    })

    const unwrap: WrapUnwrapComponent = {
      action: 'unwrap',
    }

    const wrap: WrapUnwrapComponent = {
      action: 'wrap',
      elements: topElements.map(getComponentIdAndChildIndex),
    }

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'wrap-unwrap',
      componentId: newComponentId,
      childIndex: newChildIndex,
      oldValue: createUpdate(unwrap),
      value: createUpdate(wrap),
    }
    onAttributesChange([update])
  })

  const handleUnwrapElement = useEffectEvent(() => {
    if (!selectedComponent) return
    const { componentId, childIndex } = getComponentIdAndChildIndex(
      selectedComponent.element,
    )

    const unwrap: WrapUnwrapComponent = {
      action: 'unwrap',
    }

    const inBetweenElements = Array.from(
      selectedComponent.element.children,
    ) as HTMLElement[]

    const wrap: WrapUnwrapComponent = {
      action: 'wrap',
      elements: inBetweenElements.map(getComponentIdAndChildIndex),
    }

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'wrap-unwrap',
      componentId,
      childIndex,
      oldValue: createUpdate(wrap),
      value: createUpdate(unwrap),
    }
    onAttributesChange([update])
  })

  const onDelete = useEffectEvent(() => {
    if (selectedComponent) {
      deleteComponent(selectedComponent.element)
    }
  })

  return (
    <Tree
      selectedId={selectedId}
      data={items}
      onDrag={onDrag}
      onHover={onHover}
      onSelect={onSelect}
      contextMenu={() => (
        <TreeViewItem
          onAddAbove={() => setComponentMenuOpen(true, { position: 'above' })}
          onAddBelow={() => setComponentMenuOpen(true, { position: 'below' })}
          onDelete={onDelete}
          onWrap={() => handleWrapElement()}
          onUnWrap={() => handleUnwrapElement()}
        />
      )}
    >
      {({ data }) => (
        <div className='flex gap-2 items-center'>
          <ComponentIcon
            type={getComponentType(data.data, harmonyComponents)}
          />
          {data.name}
        </div>
      )}
    </Tree>
  )
}

const ComponentIcon: React.FunctionComponent<{ type: ComponentType }> = ({
  type,
}) => {
  if (type === ComponentType.Frame) {
    return <FrameIcon className='text-[#737373] w-3 h-3' />
  } else if (type === ComponentType.Text) {
    return <TIcon className='text-[#737373] w-3 h-3' />
  } else if (type === ComponentType.Component) {
    return <ComponentIconRaw className='text-[#737373] w-3 h-3' />
  }

  return <ImageIcon className='text-[#737373] w-3 h-3' />
}

interface TreeViewItemProps {
  onAddAbove: () => void
  onAddBelow: () => void
  onDelete: () => void
  onWrap: () => void
  onUnWrap: () => void
}
const TreeViewItem = ({
  onAddAbove,
  onAddBelow,
  onDelete,
  onWrap,
  onUnWrap,
}: TreeViewItemProps) => {
  const { openEditor, isActive } = useOpenEditor()

  const hoveredComponent = useHarmonyStore((store) => store.hoveredComponent)

  const isGroup = useMemo(() => {
    if (hoveredComponent) {
      if (hoveredComponent.children.length > 0) {
        return true
      }
    }
    return false
  }, [hoveredComponent])

  const items: DropdownItem<string>[] = [
    {
      id: 'add-above',
      name: (
        <TreeViewPopupLineItem onClick={onAddAbove}>
          Add Above
        </TreeViewPopupLineItem>
      ),
    },
    {
      id: 'add-below',
      name: (
        <TreeViewPopupLineItem onClick={onAddBelow}>
          Add Below
        </TreeViewPopupLineItem>
      ),
    },
    {
      id: 'delete',
      name: (
        <TreeViewPopupLineItem onClick={onDelete}>Delete</TreeViewPopupLineItem>
      ),
    },
    {
      id: 'wrap',
      name: (
        <TreeViewPopupLineItem onClick={onWrap}>Wrap</TreeViewPopupLineItem>
      ),
    },
  ]

  if (isGroup) {
    items.push({
      id: 'unwrap',
      name: (
        <TreeViewPopupLineItem onClick={onUnWrap}>UnWrap</TreeViewPopupLineItem>
      ),
    })
  }

  if (isActive) {
    items.push({
      id: 'open-in-editor',
      name: (
        <TreeViewPopupLineItem onClick={openEditor}>
          Open in Editor
        </TreeViewPopupLineItem>
      ),
    })
  }

  return <>{items.map((item) => item.name)}</>
}

const TreeViewPopupLineItem: React.FunctionComponent<{
  onClick: () => void
  children: string
}> = ({ onClick, children }) => {
  return (
    <ContextMenuItem inset onClick={onClick}>
      {children}
    </ContextMenuItem>
  )
}
