import { useEffect, useMemo, useState } from 'react'
import { Dots6Icon } from '@harmony/ui/src/components/core/icons'
import { useDraggable } from '../../../snapping/snapping'
import { useRegisterHarmonyPanel } from './panel'

interface DraggablePanelProps {
  id: string
  title: string
  children: React.ReactNode
  defaultActive?: boolean
}
export const DraggablePanel: React.FunctionComponent<DraggablePanelProps> = ({
  id,
  title,
  children,
  defaultActive = true,
}) => {
  const { show, pos, setPos } = useRegisterHarmonyPanel({
    id,
    defaultActive,
  })
  const { setParentRef, dragHandleProps } = useDraggablePanel({ pos, setPos })

  return show ? (
    <div
      className='hw-absolute hw-top-0 hw-left-0 hw-bg-gray-100 hw-rounded-lg hw-p-4 hw-shadow-md hw-z-[1000]'
      ref={(ref) => setParentRef(ref)}
    >
      <div className='hw-flex hw-justify-between hw-items-center hw-mb-2'>
        <div className='hw-text-base hw-font-bold'>{title}</div>
        <div {...dragHandleProps}>
          <Dots6Icon className='hw-h-5 hw-w-5' />
        </div>
      </div>
      <div className='hw-overflow-auto hw-max-h-[600px]'>{children}</div>
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
        top: element.offsetTop - parent.offsetTop + window.scrollX,
        bottom: window.innerHeight - element.offsetHeight + window.scrollY,
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
