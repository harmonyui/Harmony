import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import type { TreeData, TreeProps } from '@harmony/ui/src/components/core/tree'
import { Tree } from '@harmony/ui/src/components/core/tree'
import {
  FrameIcon,
  ImageIcon,
  TIcon,
} from '@harmony/ui/src/components/core/icons'
import { ContextMenuItem } from '@harmony/ui/src/components/core/context-menu'
import type { ComponentUpdateWithoutGlobal } from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import {
  getComponentId,
  getComponentIdAndChildIndex,
} from '../../utils/element-utils'
import type { ImageType } from './add-image-panel'
import { AddImagePanel } from './add-image-panel'
import { ComponentType } from './design/types'
import { getComponentType } from './design/utils'

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
  const {
    onAttributesChange,
    onComponentHover,
    onComponentSelect,
    selectedComponent,
  } = useHarmonyContext()
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [multiSelect, setMultiSelect] = useState<{
    start: HTMLElement
    end: HTMLElement
  }>()

  const onDrag: TreeProps<HTMLElement>['onDrag'] = ({
    index,
    dragData,
    parentData,
  }) => {
    const { componentId, childIndex } = getComponentIdAndChildIndex(
      dragData[0].data,
    )
    const oldParentId = dragData[0].data.parentElement?.dataset.harmonyId

    const { componentId: newParentId } = parentData?.data
      ? getComponentIdAndChildIndex(parentData.data)
      : { componentId: undefined }
    const newIndex = index

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'reorder',
      componentId,
      childIndex,
      oldValue: JSON.stringify({
        parentId: oldParentId,
        childIndex,
      }),
      value: JSON.stringify({ parentId: newParentId, childIndex: newIndex }),
    }
    onAttributesChange([update])
  }

  const onSelect: TreeProps<HTMLElement>['onSelect'] = (nodes) => {
    nodes.length && onComponentSelect(nodes[0].data)
    if (nodes.length > 1) {
      const start = nodes[0].data
      const end = nodes[nodes.length - 1].data
      setMultiSelect({ start, end })
    }
  }

  const onHover: TreeProps<HTMLElement>['onHover'] = ({ data }) => {
    onComponentHover(data)
  }

  const handleAddDeleteElement = useEffectEvent(
    (
      element: HTMLElement,
      action: 'delete' | 'create',
      position: 'above' | 'below' | '' = '',
    ) => {
      const { componentId, childIndex } = getComponentIdAndChildIndex(element)

      const cacheId = uuidv4()

      const index = position === 'above' ? childIndex : childIndex + 1

      const update: ComponentUpdateWithoutGlobal = {
        type: 'component',
        name: 'delete-create',
        componentId,
        childIndex,
        oldValue: JSON.stringify({
          id: cacheId,
          action: action === 'delete' ? 'create' : 'delete',
          index: action === 'delete' ? childIndex : index,
          position: '',
        }),
        value: JSON.stringify({
          id: cacheId,
          action,
          index: childIndex,
          position,
        }),
      }
      onAttributesChange([update])
    },
  )

  const handleWrapElement = useEffectEvent((action: 'wrap' | 'unwrap') => {
    const startComponent = multiSelect?.start
    if (!startComponent) return

    const { childIndex: startChildIndex } =
      getComponentIdAndChildIndex(startComponent)
    const endComponent = multiSelect.end

    const { childIndex: endChildIndex } =
      getComponentIdAndChildIndex(endComponent)

    const componentId = () => {
      if (action === 'wrap') {
        return uuidv4()
      }
      return multiSelect.start.dataset.harmonyId || ''
    }

    const cacheId = uuidv4()

    const unwrap = {
      action: 'unwrap',
      start: {
        id: multiSelect.start.dataset.harmonyId,
        childIndex: startChildIndex,
      },
      end: {
        id: multiSelect.end.dataset.harmonyId,
        childIndex: endChildIndex,
      },
      id: cacheId,
    }

    const wrap = {
      action: 'wrap',
      start: {
        id: multiSelect.start.dataset.harmonyId,
        childIndex: startChildIndex,
      },
      end: {
        id: multiSelect.end.dataset.harmonyId,
        childIndex: endChildIndex,
      },
      id: cacheId,
    }

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'wrap-unwrap',
      componentId: componentId(),
      childIndex: startChildIndex,
      oldValue: JSON.stringify(action === 'wrap' ? unwrap : wrap),
      value: JSON.stringify(action === 'wrap' ? wrap : unwrap),
    }
    onAttributesChange([update])
  })

  const handleAddText = useEffectEvent((element: HTMLElement) => {
    const { childIndex, componentId } = getComponentIdAndChildIndex(element)
    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'replace-element',
      componentId,
      childIndex,
      oldValue: JSON.stringify({ type: 'text', value: '' }),
      value: JSON.stringify({ type: 'text', value: '[Insert Text]' }),
    }
    onAttributesChange([update])
  })

  const handleAddImage = useEffectEvent((value: string, type: ImageType) => {
    if (!selectedComponent) return
    setIsImageOpen(false)
    const { childIndex, componentId } =
      getComponentIdAndChildIndex(selectedComponent)
    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'replace-element',
      componentId,
      childIndex,
      oldValue: JSON.stringify({ type, value: '' }),
      value: JSON.stringify({ type, value }),
    }
    onAttributesChange([update])
  })

  return (
    <>
      <Tree
        selectedId={getComponentId(selectedComponent)}
        data={items}
        onDrag={onDrag}
        onHover={onHover}
        onSelect={onSelect}
        contextMenu={({ data }) => (
          <TreeViewItem
            onAddImage={() => setIsImageOpen(true)}
            onAddAbove={() =>
              handleAddDeleteElement(data.data, 'create', 'above')
            }
            onAddBelow={() =>
              handleAddDeleteElement(data.data, 'create', 'below')
            }
            onDelete={() => handleAddDeleteElement(data.data, 'delete')}
            onAddText={() => handleAddText(data.data)}
            onWrap={() => handleWrapElement('wrap')}
            onUnWrap={() => handleWrapElement('unwrap')}
          />
        )}
      >
        {({ data }) => (
          <>
            <ComponentIcon type={getComponentType(data.data)} />
            {data.name}
          </>
        )}
      </Tree>
      <AddImagePanel
        isOpen={isImageOpen}
        onClose={() => setIsImageOpen(false)}
        onSave={handleAddImage}
      />
    </>
  )
}

const ComponentIcon: React.FunctionComponent<{ type: ComponentType }> = ({
  type,
}) => {
  if (type === ComponentType.Frame) {
    return <FrameIcon className='hw-w-3 hw-h-3' />
  } else if (type === ComponentType.Text) {
    return <TIcon className='hw-w-3 hw-h-3' />
  }

  return <ImageIcon className='hw-w-3 hw-h-3' />
}

interface TreeViewItemProps {
  onAddAbove: () => void
  onAddBelow: () => void
  onDelete: () => void
  onWrap: () => void
  onUnWrap: () => void
  onAddText: () => void
  onAddImage: () => void
}
const TreeViewItem = ({
  onAddAbove,
  onAddBelow,
  onDelete,
  onWrap,
  onUnWrap,
  onAddImage,
  onAddText,
}: TreeViewItemProps) => {
  const { selectedComponent } = useHarmonyContext()
  const isGroup = useMemo(() => {
    if (selectedComponent) {
      if (selectedComponent.children.length > 0) {
        return true
      }
    }
    return false
  }, [selectedComponent])

  const isEmptyDiv = useMemo(() => {
    if (selectedComponent) {
      if (
        selectedComponent.children.length === 0 &&
        selectedComponent.tagName === 'DIV'
      ) {
        return true
      }
    }
  }, [selectedComponent])

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

  if (isEmptyDiv) {
    items.push({
      id: 'add-text',
      name: (
        <TreeViewPopupLineItem onClick={onAddText}>
          Add Text
        </TreeViewPopupLineItem>
      ),
    })
    items.push({
      id: 'add-image',
      name: (
        <TreeViewPopupLineItem onClick={onAddImage}>
          Add Image/SVG
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
