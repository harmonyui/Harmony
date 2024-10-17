import { useState, type Dispatch } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface SortableContainerItem {
  id: UniqueIdentifier
  columnId: UniqueIdentifier
}
export interface SortableContextProps<T extends SortableContainerItem> {
  items: T[]
  setItems: Dispatch<(prevState: T[]) => T[]>
  children: ({
    activeItem,
    items,
  }: {
    activeItem: T | undefined
    items: T[]
  }) => React.ReactNode
}
export const SortableContainerContext = <T extends SortableContainerItem>({
  items,
  setItems,
  children,
}: SortableContextProps<T>): JSX.Element => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | undefined>(
    undefined,
  )
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDragStart = (event: DragStartEvent): void => {
    setActiveId(event.active.id)
  }
  const onDragEnd = (): void => {
    setActiveId(undefined)
  }

  const onDragOver = (event: DragOverEvent): void => {
    const { active, over } = event

    if (!over) return

    const _activeId = active.id
    const overId = over.id

    if (_activeId === overId) return

    const isActiveATask = active.data.current?.type === 'Item'
    const isOverATask = over.data.current?.type === 'Item'

    if (!isActiveATask) return

    if (isOverATask) {
      setItems((_items) => {
        const activeIndex = _items.findIndex((item) => item.id === _activeId)
        const overIndex = _items.findIndex((item) => item.id === overId)

        if (_items[activeIndex]?.columnId !== _items[overIndex]?.columnId) {
          const activeItem = _items[activeIndex] as T | undefined
          const overItem = _items[overIndex] as T | undefined
          if (!activeItem || !overItem) {
            throw new Error(
              `Could not find active item with item ${_activeId} or over item with id ${overId}`,
            )
          }
          activeItem.columnId = overItem.columnId
          return arrayMove(_items, activeIndex, overIndex - 1)
        }

        return arrayMove(_items, activeIndex, overIndex)
      })
    } else {
      setItems((_items) => {
        const activeIndex = _items.findIndex((t) => t.id === _activeId)

        const item = _items[activeIndex] as T | undefined
        if (!item) {
          throw new Error(`Could not find item with id ${_activeId}`)
        }
        item.columnId = overId

        return arrayMove(_items, activeIndex, activeIndex)
      })
    }
  }

  const activeItem = items.find((item) => item.id === activeId)

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      {children({ activeItem, items })}
    </DndContext>
  )
}

export interface SortableContainerProps<T extends SortableContainerItem> {
  id: UniqueIdentifier
  items: T[]
  children: (item: T) => (isDragging: boolean) => React.ReactNode
}
export const SortableContainer = <T extends SortableContainerItem>({
  id,
  items,
  children,
}: SortableContainerProps<T>): JSX.Element => {
  const { setNodeRef } = useDroppable({ id, data: { type: 'Column' } })
  return (
    <SortableContext
      items={items.map((item) => item.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className='flex flex-col gap-2 w-96' ref={setNodeRef}>
        {items.map((item) => (
          <SortableItem id={item.id} key={item.id}>
            {children(item)}
          </SortableItem>
        ))}
      </div>
    </SortableContext>
  )
}

export interface SortableItemType {
  id: UniqueIdentifier
  children: (isDragging: boolean) => React.ReactNode
}
export const SortableItem = ({
  id,
  children,
}: SortableItemType): JSX.Element => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'Item' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children(isDragging)}
    </div>
  )
}
