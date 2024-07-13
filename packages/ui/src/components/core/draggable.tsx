import type { DragEndEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import React from "react";

export type UniqueIdentifier = string | number;
export interface DraggableContextProps {
  onDragEnd: (
    active: UniqueIdentifier,
    over: UniqueIdentifier | undefined,
  ) => void;
  children: React.ReactNode;
}
export const DraggableContext: React.FunctionComponent<
  DraggableContextProps
> = ({ children, onDragEnd }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDrag = (e: DragEndEvent): void => {
    onDragEnd(e.active.id, e.over?.id);
  };
  return (
    <DndContext onDragEnd={handleDrag} sensors={sensors}>
      {children}
    </DndContext>
  );
};

export interface DroppableProps {
  id: UniqueIdentifier;
  children: React.ReactNode | ((isOver: boolean) => React.ReactNode);
}
export const Droppable: React.FunctionComponent<DroppableProps> = ({
  id,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  return (
    <div ref={setNodeRef}>
      {typeof children === "function" ? children(isOver) : children}
    </div>
  );
};

export interface DraggableProps {
  id: UniqueIdentifier;
  children: React.ReactNode | ((isDragging: boolean) => React.ReactNode);
}
export const Draggable: React.FunctionComponent<DraggableProps> = ({
  id,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      className={isDragging ? "z-40" : ""}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
    >
      {typeof children === "function" ? children(isDragging) : children}
    </div>
  );
};
