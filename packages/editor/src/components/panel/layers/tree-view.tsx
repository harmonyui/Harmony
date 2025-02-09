import React, { useMemo, useState } from 'react'
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
import { ElementContextMenu } from '../../component-context-menu'

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
  const onComponentSelect = useHarmonyStore((store) => store.selectElement)
  const onComponentHover = useHarmonyStore((store) => store.hoverComponent)
  const harmonyComponents = useHarmonyStore((store) => store.harmonyComponents)

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

  return (
    <Tree
      selectedId={selectedId}
      data={items}
      onDrag={onDrag}
      onHover={onHover}
      onSelect={onSelect}
      contextMenu={() => (
        <ElementContextMenu
          selectedElements={selectedElements}
          LineItem={TreeViewPopupLineItem}
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
