import { useEffect, useMemo, useState } from 'react'
import { Dots6Icon } from '@harmony/ui/src/components/core/icons'
import { useDraggable } from '../../../snapping/snapping'
import { useRegisterHarmonyPanel } from './panel'

interface DraggablePanelProps {
  id: string
  title: string
  children: React.ReactNode
}
export const DraggablePanel: React.FunctionComponent<DraggablePanelProps> = ({
  id,
  title,
  children,
}) => {
  const { show, pos, setPos } = useRegisterHarmonyPanel({
    id,
    defaultActive: true,
  })
  const { setParentRef, dragHandleProps } = useDraggablePanel({ pos, setPos })

  return show ? (
    <div
      className='hw-absolute hw-top-0 hw-left-0 hw-bg-white hw-rounded-lg hw-p-2 hw-shadow-md hw-z-[1000] hw-max-h-[600px] hw-overflow-auto'
      ref={(ref) => setParentRef(ref)}
    >
      <div className='hw-flex hw-justify-between hw-items-center'>
        <div className='hw-text-base hw-font-bold'>{title}</div>
        <div {...dragHandleProps}>
          <Dots6Icon className='hw-h-5 hw-w-5' />
        </div>
      </div>
      {children}
    </div>
  ) : null
}

const useDraggablePanel = ({
  pos,
  setPos,
}: {
  pos: { x: number; y: number }
  setPos: (pos: { x: number; y: number }) => void
}) => {
  const [ref, setRef] = useState<HTMLElement | null>(null)

  const dragElement: HTMLElement | undefined = useMemo(
    () => ref?.querySelector('[data-drag-handle]') ?? undefined,
    [ref],
  )

  useDraggable({
    element: dragElement,
    onCalculateRestrictions(element) {
      const parent = ref
      if (!parent) throw new Error('Parent not found')

      return {
        top: element.offsetTop - parent.offsetTop,
        bottom: window.innerHeight - element.offsetHeight,
        left: element.offsetLeft - parent.offsetLeft,
        right: window.innerWidth - element.offsetWidth,
      }
    },
    scale: 1,
    canDrag: () => true,
    onIsDragging(event) {
      if (!ref) return
      setPos({ x: pos.x + event.dx, y: pos.y + event.dy })
    },
  })

  useEffect(() => {
    ref?.style.setProperty('transform', `translate(${pos.x}px, ${pos.y}px)`)
  }, [pos, ref])

  return { setParentRef: setRef, dragHandleProps: { 'data-drag-handle': true } }
}
