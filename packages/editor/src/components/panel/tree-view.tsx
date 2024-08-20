import { enableRipple } from '@syncfusion/ej2-base'
import type {
  DragAndDropEventArgs,
  NodeSelectEventArgs,
  DrawNodeEventArgs,
  TreeViewComponent,
} from '@syncfusion/ej2-react-navigations'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import {
  DropdownLineItem,
  ListBoxPopover,
} from '@harmony/ui/src/components/core/dropdown'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { Tree } from '@harmony/ui/src/components/core/tree'
import type { ComponentUpdateWithoutGlobal } from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import type { ComponentElement } from '../inspector/component-identifier'
import { getComponentIdAndChildIndex } from '../../utils/element-utils'
import type { ImageType } from './add-image-panel'
import { AddImagePanel } from './add-image-panel'

enableRipple(true)

export interface TreeViewItem<T = string> {
  id: T
  content: React.ReactNode
  items: TreeViewItem<T>[]
  selected: boolean
}

export interface TransformNode extends Record<string, NonNullable<unknown>> {
  id: string
  type: string
  subChild: TransformNode[]
  expanded: boolean
  childIndex: number
  error: string
  component: string
}

let treeObj: TreeViewComponent | null

export const TreeView = () => {
  return <Tree />
}

// export const TreeView = ({
//   items,
// }: {
//   items: TreeViewItem<ComponentElement>[]
//   expand?: boolean
//   onClick: (item: HTMLElement) => void
//   onHover: (item: HTMLElement) => void
// }) => {
//   const {
//     onAttributesChange,
//     onComponentHover,
//     onComponentSelect,
//     setError,
//     selectedComponent,
//   } = useHarmonyContext()
//   const [multiSelect, setMultiSelect] = useState<{
//     start: HTMLElement
//     end: HTMLElement
//   }>()
//   const [isImageOpen, setIsImageOpen] = useState(false)

//   const [transformedItems, setTransformedItems] = useState<TransformNode[]>([])
//   const fields = {
//     dataSource: transformedItems,
//     id: 'id',
//     text: 'type',
//     child: 'subChild',
//     childIndex: 'childIndex',
//     selected: 'isSelected',
//   }

//   function transform(
//     node: TreeViewItem<ComponentElement>,
//     error = '',
//   ): TransformNode {
//     const {
//       id,
//       name,
//       element,
//     }: { id: string; name: string; element: HTMLElement } = node.id
//     const uuid = uuidv4()
//     element.dataset.link = uuid
//     let componentError = error
//     const transformedNode: TransformNode = {
//       id: uuid,
//       type: String(name),
//       expanded: true,
//       subChild: [] as TransformNode[],
//       childIndex: 0,
//       error:
//         componentError.length > 0
//           ? componentError
//           : node.id.element.dataset.harmonyError || '',
//       component: id,
//     }

//     if (node.items.length > 0) {
//       if (node.id.element.dataset.harmonyError === 'component') {
//         componentError = 'component'
//       }
//       const children = node.items.map((_node) =>
//         transform(_node, componentError),
//       )
//       transformedNode.subChild = children.map((child, index) => {
//         child.childIndex = index
//         return child
//       })
//     }

//     return transformedNode
//   }

//   useEffect(() => {
//     const i = items.map((item) => {
//       return transform(item)
//     })
//     i[0].expanded = true
//     setTransformedItems(i)
//   }, [items])

//   function handleNodeDropped(event: DragAndDropEventArgs) {
//     const {
//       draggedParentNode: oldParentElement,
//       dropTarget: newParentElement,
//       dropIndex: newIndex,
//       droppedNode,
//       draggedNode,
//     } = event
//     const componentId = draggedNode.children[1].innerHTML
//       .split('data-component=')[1]
//       .split('"')[1]
//     const link = draggedNode.children[1].innerHTML
//       .split('data-node=')[1]
//       .split('"')[1]
//     const domNode = document.querySelector(`[data-link="${link}"]`)
//     if (!domNode?.parentElement) return

//     const oldParent = oldParentElement as HTMLElement
//     const oldParentId = oldParent.children[1].innerHTML
//       .split('data-component=')[1]
//       .split('"')[1]
//     const newParent = newParentElement as HTMLElement
//     const newParentId = newParent.children[1].innerHTML
//       .split('data-component=')[1]
//       .split('"')[1]

//     const oldChildIndex = Array.from(domNode.parentElement.childNodes).indexOf(
//       domNode,
//     )

//     if (
//       newParent.dataset.harmonyError === 'component' ||
//       droppedNode.dataset.harmonyError === 'component'
//     ) {
//       event.cancel = true
//       setError('Cannot move the current component')
//       return
//     }

//     const update: ComponentUpdateWithoutGlobal = {
//       type: 'component',
//       name: 'reorder',
//       componentId,
//       childIndex: oldChildIndex,
//       oldValue: JSON.stringify({
//         parentId: oldParentId,
//         childIndex: oldChildIndex,
//       }),
//       value: JSON.stringify({ parentId: newParentId, childIndex: newIndex }),
//     }
//     onAttributesChange([update])
//   }

//   function onMouseOver(link: string) {
//     const node = document.querySelector(`[data-link="${link}"]`)
//     if (node) {
//       onComponentHover(node as HTMLElement)
//     }
//   }
//   function onMouseClick(link: string) {
//     const node = document.querySelector(`[data-link="${link}"]`)
//     if (node) {
//       onComponentSelect(node as HTMLElement)
//     }
//   }

//   function dragStop(event: DragAndDropEventArgs) {
//     const {
//       draggedParentNode: oldParentElement,
//       dropTarget: newParentElement,
//     } = event

//     const oldParent = oldParentElement as HTMLElement
//     const newParent = newParentElement as HTMLElement

//     if (
//       oldParent.dataset.harmonyError === 'component' ||
//       newParent.dataset.harmonyError === 'component'
//     ) {
//       event.cancel = true
//       event.dropIndicator = 'e-no-drop'
//       setError('This component cannot be moved into this location')
//     }
//   }

//   function nodeDragStart(event: DragAndDropEventArgs) {
//     const { draggedNode } = event

//     if (draggedNode.dataset.harmonyError === 'component') {
//       event.cancel = true
//       event.dropIndicator = 'e-no-drop'
//       setError('This component cannot be moved!')
//     }
//   }

//   function drawNode(event: DrawNodeEventArgs) {
//     event.node.addEventListener('mouseover', (e) => {
//       e.stopPropagation()
//       onMouseOver(event.nodeData.id as string)
//     })

//     event.node.addEventListener('click', (e) => {
//       e.stopPropagation()
//       onMouseClick(event.nodeData.id as string)
//     })
//   }

//   const handleAddDeleteElement = useEffectEvent(
//     (action: 'delete' | 'create', position: 'above' | 'below' | '' = '') => {
//       if (!selectedComponent) return
//       const link = selectedComponent.dataset.link
//       const component = document.querySelector(`[data-link="${link}"]`)
//       if (!component?.parentElement) return

//       const { componentId, childIndex } =
//         getComponentIdAndChildIndex(selectedComponent)

//       const cacheId = uuidv4()

//       const index = position === 'above' ? childIndex : childIndex + 1

//       const update: ComponentUpdateWithoutGlobal = {
//         type: 'component',
//         name: 'delete-create',
//         componentId,
//         childIndex,
//         oldValue: JSON.stringify({
//           id: cacheId,
//           action: action === 'delete' ? 'create' : 'delete',
//           index: action === 'delete' ? childIndex : index,
//           position: '',
//         }),
//         value: JSON.stringify({
//           id: cacheId,
//           action,
//           index: childIndex,
//           position,
//         }),
//       }
//       onAttributesChange([update])
//     },
//   )

//   const selectedNodes = ['2', '6']
//   function nodeSelected(e: NodeSelectEventArgs) {
//     if (!treeObj) return

//     const start = treeObj['startNode'] as HTMLElement
//     const startId = start.children[1].innerHTML
//       .split('data-node=')[1]
//       .split('"')[1]
//     const startNode: HTMLElement | null = document.querySelector(
//       `[data-link="${startId}"]`,
//     )
//     const end = e.node
//     const endId = end.children[1].innerHTML.split('data-node=')[1].split('"')[1]
//     const endNode: HTMLElement | null = document.querySelector(
//       `[data-link="${endId}"]`,
//     )
//     if (!startNode || !endNode) return

//     setMultiSelect({ start: startNode, end: endNode })
//   }

//   const handleWrapElement = useEffectEvent((action: 'wrap' | 'unwrap') => {
//     const startComponent: HTMLElement | null = document.querySelector(
//       `[data-link="${multiSelect?.start.dataset.link}"]`,
//     )
//     if (!startComponent) return

//     const { childIndex: startChildIndex } =
//       getComponentIdAndChildIndex(startComponent)
//     const endComponent: HTMLElement | null = document.querySelector(
//       `[data-link="${multiSelect?.end.dataset.link}"]`,
//     )
//     if (!endComponent) return

//     const { childIndex: endChildIndex } =
//       getComponentIdAndChildIndex(endComponent)

//     const componentId = () => {
//       if (action === 'wrap') {
//         return uuidv4()
//       }
//       return multiSelect?.start.dataset.harmonyId || ''
//     }

//     const cacheId = uuidv4()

//     const unwrap = {
//       action: 'unwrap',
//       start: {
//         id: multiSelect?.start.dataset.harmonyId,
//         childIndex: startChildIndex,
//       },
//       end: {
//         id: multiSelect?.end.dataset.harmonyId,
//         childIndex: endChildIndex,
//       },
//       id: cacheId,
//     }

//     const wrap = {
//       action: 'wrap',
//       start: {
//         id: multiSelect?.start.dataset.harmonyId,
//         childIndex: startChildIndex,
//       },
//       end: {
//         id: multiSelect?.end.dataset.harmonyId,
//         childIndex: endChildIndex,
//       },
//       id: cacheId,
//     }

//     const update: ComponentUpdateWithoutGlobal = {
//       type: 'component',
//       name: 'wrap-unwrap',
//       componentId: componentId(),
//       childIndex: startChildIndex,
//       oldValue: JSON.stringify(action === 'wrap' ? unwrap : wrap),
//       value: JSON.stringify(action === 'wrap' ? wrap : unwrap),
//     }
//     onAttributesChange([update])
//   })

//   const handleAddText = useEffectEvent(() => {
//     if (!selectedComponent) return
//     const { childIndex, componentId } =
//       getComponentIdAndChildIndex(selectedComponent)
//     const update: ComponentUpdateWithoutGlobal = {
//       type: 'component',
//       name: 'replace-element',
//       componentId,
//       childIndex,
//       oldValue: JSON.stringify({ type: 'text', value: '' }),
//       value: JSON.stringify({ type: 'text', value: '[Insert Text]' }),
//     }
//     onAttributesChange([update])
//   })

//   const handleAddImage = useEffectEvent((value: string, type: ImageType) => {
//     if (!selectedComponent) return
//     setIsImageOpen(false)
//     const { childIndex, componentId } =
//       getComponentIdAndChildIndex(selectedComponent)
//     const update: ComponentUpdateWithoutGlobal = {
//       type: 'component',
//       name: 'replace-element',
//       componentId,
//       childIndex,
//       oldValue: JSON.stringify({ type, value: '' }),
//       value: JSON.stringify({ type, value }),
//     }
//     onAttributesChange([update])
//   })

//   const treeViewItem = useMemo(
//     () =>
//       TreeViewItem({
//         onAddAbove: () => handleAddDeleteElement('create', 'above'),
//         onAddBelow: () => handleAddDeleteElement('create', 'below'),
//         onDelete: () => handleAddDeleteElement('delete'),
//         onWrap: () => handleWrapElement('wrap'),
//         onUnWrap: () => handleWrapElement('unwrap'),
//         onAddText: () => handleAddText(),
//         onAddImage: () => setIsImageOpen(true),
//         onClick: onMouseClick,
//       }),
//     [],
//   )

//   return (
//     transformedItems.length > 0 && (
//       <div>
//         <TreeViewComponent
//           fields={fields}
//           allowDragAndDrop={true}
//           nodeDragStart={nodeDragStart.bind(this)}
//           nodeDragStop={dragStop.bind(this)}
//           ref={(treeview) => {
//             treeObj = treeview
//           }}
//           nodeDropped={handleNodeDropped}
//           nodeTemplate={treeViewItem}
//           drawNode={drawNode}
//           allowMultiSelection={true}
//           selectedNodes={selectedNodes}
//           nodeSelected={nodeSelected}
//         />
//         <AddImagePanel
//           isOpen={isImageOpen}
//           onClose={() => setIsImageOpen(false)}
//           onSave={handleAddImage}
//         />
//       </div>
//     )
//   )
// }

interface TreeViewItemProps {
  onAddAbove: () => void
  onAddBelow: () => void
  onDelete: () => void
  onWrap: () => void
  onUnWrap: () => void
  onAddText: () => void
  onAddImage: () => void
  onClick: (id: string) => void
}
const TreeViewItem =
  ({
    onAddAbove,
    onAddBelow,
    onDelete,
    onWrap,
    onUnWrap,
    onAddImage,
    onAddText,
    onClick,
  }: TreeViewItemProps) =>
  (data: TransformNode) => {
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
          <TreeViewPopupLineItem onClick={onDelete}>
            Delete
          </TreeViewPopupLineItem>
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
          <TreeViewPopupLineItem onClick={onUnWrap}>
            UnWrap
          </TreeViewPopupLineItem>
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

    return (
      <ListBoxPopover items={items}>
        <div
          data-child={data.childIndex}
          data-node={data.id}
          harmony-error={data.error || 'none'}
          data-component={data.component}
          onClick={() => onClick(data.id)}
        >
          <p>
            {data.error === 'component' ? (
              <span style={{ color: 'red' }}>⚠️</span>
            ) : (
              ''
            )}
            {data.type}
          </p>
        </div>
      </ListBoxPopover>
    )
  }

const TreeViewPopupLineItem: React.FunctionComponent<{
  onClick: () => void
  children: string
}> = ({ onClick, children }) => {
  return (
    <DropdownLineItem
      onPointerDown={(e: React.MouseEvent) => {
        e.preventDefault()
        onClick()
      }}
    >
      <span>{children}</span>
    </DropdownLineItem>
  )
}
