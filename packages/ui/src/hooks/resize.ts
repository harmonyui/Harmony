import { useState } from 'react'
import { useEffectEvent } from './effect-event'

export type ResizeCoords = 'n' | 'e' | 's' | 'w'
export type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw'
export type ResizeValue = Partial<Record<ResizeCoords, number>>
export type ResizeRect = {
  x: number
  y: number
  direction: ResizeDirection
} & Record<ResizeCoords, number>
interface ResizeProps {
  onIsDragging?: (value: ResizeValue, oldValue: ResizeValue) => boolean
  onDragFinish?: (value: ResizeValue, oldValue: ResizeValue) => void
}
export const useResize = ({ onIsDragging, onDragFinish }: ResizeProps) => {
  const [rect, setRect] = useState<ResizeRect>()
  const [updates, setUpdates] = //useState<ResizeValue>();
    useState<ResizeValue>({})
  const [isDragging, setIsDragging] = useState(false)
  const [currRect, setCurrRect] = useState<ResizeValue>()

  const doDrag = useEffectEvent((e: MouseEvent) => {
    if (!rect || !currRect) return

    const shift = e.shiftKey && rect.direction.length === 2

    setIsDragging(true)
    const copy = { ...updates }

    const calculateProportions = () => {
      const proportions: Record<string, number> = {}

      ;['n', 'e', 's', 'w'].forEach((direction) => {
        proportions[direction] = rect[direction as ResizeCoords] || 1
      })

      const totalProportions = Object.values(proportions).reduce(
        (sum, value) => sum + value,
        0,
      )

      return Object.fromEntries(
        Object.entries(proportions).map(([dir, value]) => [
          dir,
          (value / totalProportions) * 100,
        ]),
      )
    }

    const originalProportions = calculateProportions()
    let valueX = 0
    let valueY = 0
    if (rect.direction.includes('n')) {
      valueY = rect.y - e.clientY

      if (!shift) copy.n = rect.n + valueY
    }
    if (rect.direction.includes('e')) {
      valueX = e.clientX - rect.x

      if (!shift) copy.e = rect.e + valueX
    }
    if (rect.direction.includes('s')) {
      valueY = e.clientY - rect.y

      if (!shift) copy.s = rect.s + valueY
    }
    if (rect.direction.includes('w')) {
      valueX = rect.x - e.clientX

      if (!shift) copy.w = rect.w + valueX
    }

    if (shift) {
      const value = Math.abs(valueX) > Math.abs(valueY) ? valueX : valueY
      copy.s = rect.s + value
      copy.w = (originalProportions.w / originalProportions.s) * copy.s
      copy.e = (originalProportions.e / originalProportions.s) * copy.s
      copy.n = (originalProportions.n / originalProportions.s) * copy.s
    }

    const newRect = { n: copy.n, s: copy.s, e: copy.e, w: copy.w }
    if (
      onIsDragging &&
      onIsDragging(
        { ...copy },
        { n: currRect.n, e: currRect.e, s: currRect.s, w: currRect.w },
      )
    ) {
      setCurrRect(newRect)
      setUpdates(copy)
    }
  })

  const stopDrag = useEffectEvent((_: MouseEvent) => {
    if (!rect) {
      throw new Error('There is no rect')
    }

    setIsDragging(false)
    document.documentElement.removeEventListener('mousemove', doDrag, false)
    document.documentElement.removeEventListener('mouseup', stopDrag, false)
    onDragFinish &&
      onDragFinish(updates, { n: rect.n, s: rect.s, e: rect.e, w: rect.w })
  })

  const onDrag = useEffectEvent((_rect: ResizeRect): void => {
    setRect(_rect)
    setCurrRect(_rect)
    setUpdates({})
    document.documentElement.addEventListener('mousemove', doDrag, false)
    document.documentElement.addEventListener('mouseup', stopDrag, false)
  })

  return { onDrag, isDragging }
}
