import * as ReactTreePrimitive from 'react-arborist'
import { getClass } from '@harmony/util/src/utils/common'
import { useMemo } from 'react'
import { PolygonDownIcon, PolygonRightIcon } from './icons'

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
}
export const Tree = <T,>({
  selectedId,
  data,
  children,
  onSelect: onSelectProps,
  onHover,
  onDrag,
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
      selection={selectedId}
      onSelect={onSelect}
      onMove={onMove}
      //childrenAccessor='items'
    >
      {(props) => (
        <Node {...props} onHover={() => onHover(props.node.data)}>
          {children({ data: props.node.data })}
        </Node>
      )}
    </ReactTreePrimitive.Tree>
  )
}

type NodeProps<T = string> = ReactTreePrimitive.NodeRendererProps<T> & {
  children: React.ReactNode
  onHover: () => void
}
const Node = <T,>({
  style,
  dragHandle,
  node,
  children,
  onHover,
}: NodeProps<T>): JSX.Element => {
  return (
    <div
      className={getClass(
        'hw-flex hw-gap-2 hw-items-center hover:hw-bg-slate-100 hw-rounded-lg hw-px-2',
        node.isSelected ? 'hw-text-[#9F6CFF]' : '',
      )}
      style={style}
      ref={dragHandle}
      onClick={() => node.isInternal && node.toggle()}
      onMouseOver={onHover}
    >
      <NodeArrow node={node} />
      {children}
    </div>
  )
}

const NodeArrow = <T,>({ node }: { node: ReactTreePrimitive.NodeApi<T> }) => {
  if (node.isLeaf) return <span></span>

  return (
    <span>
      {node.isOpen ? (
        <PolygonDownIcon className='hw-h-2 hw-w-2' />
      ) : (
        <PolygonRightIcon className='hw-h-2 hw-w-2' />
      )}
    </span>
  )
}
