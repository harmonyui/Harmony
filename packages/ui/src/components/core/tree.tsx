import * as ReactTreePrimitive from 'react-arborist'
import { getClass } from '@harmony/util/src/utils/common'
import React from 'react'
import { ChevronDownIcon, ChevronRightIcon } from './icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from './context-menu'

export interface TreeData<T> {
  id: string
  data: T
  name: React.ReactNode
  children?: TreeData<T>[]
  selected: boolean
}

export interface TreeProps<T> {
  selectedId?: string
  data: TreeData<T>[]
  children: React.FunctionComponent<{ data: TreeData<T> }>
  onSelect: (nodes: TreeData<T>[]) => void
  onHover: (data: TreeData<T>) => void
  onDrag: (props: {
    dragData: TreeData<T>[]
    index: number
    parentData: TreeData<T> | undefined
  }) => void
  contextMenu?: React.FunctionComponent<{ data: TreeData<T> }>
}
export const Tree = <T,>({
  selectedId,
  data,
  children,
  onSelect: onSelectProps,
  onHover,
  onDrag,
  contextMenu,
}: TreeProps<T>) => {
  const onSelect = (nodes: ReactTreePrimitive.NodeApi<TreeData<T>>[]) => {
    onSelectProps(nodes.map((node) => node.data))
  }

  const onMove: ReactTreePrimitive.MoveHandler<TreeData<T>> = ({
    index,
    dragNodes,
    parentNode,
  }) => {
    onDrag({
      index,
      dragData: dragNodes.map((node) => node.data),
      parentData: parentNode?.data,
    })
  }

  return (
    <ReactTreePrimitive.Tree
      data={data}
      indent={12}
      selection={selectedId}
      onSelect={onSelect}
      onMove={onMove}
      //childrenAccessor='items'
      rowHeight={26}
    >
      {(props) => {
        const parentSelected = isParentSelected(props.node.parent)
        const nodeProps = {
          ...props,
          onHover: () => onHover(props.node.data),
          onClick: () => undefined,
          children: children({ data: props.node.data }) as React.ReactNode,
          isParentSelected: parentSelected,
        }

        if (contextMenu) {
          return (
            <NodeWithContextMenu {...nodeProps} contextMenu={contextMenu} />
          )
        }

        return <Node {...nodeProps} />
      }}
    </ReactTreePrimitive.Tree>
  )
}

const isParentSelected = (node: ReactTreePrimitive.NodeApi | null): boolean => {
  if (node === null) return false
  if (node.isSelected) return true

  return isParentSelected(node.parent)
}

type NodeProps<T = string> = ReactTreePrimitive.NodeRendererProps<T> & {
  children: React.ReactNode
  onHover: () => void
  onClick: () => void
  isParentSelected: boolean
}
const Node = <T,>({
  style,
  dragHandle,
  node,
  children,
  onHover,
  onClick,
  isParentSelected: parentSelected,
}: NodeProps<T>) => {
  const onExpand: React.MouseEventHandler = (e) => {
    e.stopPropagation()
    node.isInternal && node.toggle()
  }
  return (
    <div
      className={getClass(
        'flex gap-2 text-xs items-center hover:border-[#9F6CFF] border border-transparent px-2 py-1 overflow-hidden whitespace-nowrap',
        node.isSelected ? 'bg-[#e0e7ff] rounded-t-md' : '',
        parentSelected ? 'bg-[#eef2ff]' : '',
        !parentSelected && (!node.isSelected || !node.isOpen)
          ? 'rounded-md'
          : '',
      )}
      style={style}
      ref={dragHandle}
      onClick={onClick}
      onMouseOver={onHover}
    >
      <NodeArrow node={node} onClick={onExpand} />
      {children}
    </div>
  )
}

const NodeWithContextMenu = <T,>({
  contextMenu: ContextMenuContentChildren,
  ...props
}: NodeProps<T> & { contextMenu: React.FunctionComponent<{ data: T }> }) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Node {...props} />
      </ContextMenuTrigger>
      <ContextMenuContent
        className='w-64'
        container={document.getElementById('harmony-container') || undefined}
      >
        <ContextMenuContentChildren data={props.node.data} />
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface NodeArrowProps<T> {
  node: ReactTreePrimitive.NodeApi<T>
  onClick: React.MouseEventHandler
}
const NodeArrow = <T,>({ node, onClick }: NodeArrowProps<T>) => {
  if (node.isLeaf) return <span></span>

  return (
    <span
      className='cursor-pointer hover:text-gray-600 text-gray-400'
      onClick={onClick}
    >
      {node.isOpen ? (
        <ChevronDownIcon className='h-3 w-3' />
      ) : (
        <ChevronRightIcon className='h-3 w-3' />
      )}
    </span>
  )
}
