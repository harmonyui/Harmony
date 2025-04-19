import { useState, useCallback } from 'react'
import { useHarmonyContext } from '../../../components/harmony-context'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyStore } from '../../../hooks/state'
import { useBranchId } from '../../../hooks/branch-id'
import { getComponentIdAndChildIndex } from '../../../utils/element-utils'

interface CommentPosition {
  x: number
  y: number
  componentId: string
  childIndex: number
  offsetX: number
  offsetY: number
}

export const useCommentCreation = () => {
  const { isComment } = useHarmonyContext()
  const addChatBubble = useHarmonyStore((state) => state.addChatBubble)
  const { branchId } = useBranchId()
  const hoveredComponent = useHarmonyStore((state) => state.hoveredComponent)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [position, setPosition] = useState<CommentPosition | null>(null)

  const handleClick = useEffectEvent((e: MouseEvent) => {
    if (
      !isComment ||
      !hoveredComponent ||
      document.getElementById('harmony-container')?.contains(e.target as Node)
    )
      return

    const element = hoveredComponent

    const rect = element.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const { componentId, childIndex } = getComponentIdAndChildIndex(element)

    setPosition({
      x: e.clientX,
      y: e.clientY,
      componentId,
      childIndex,
      offsetX,
      offsetY,
    })
    setIsDialogOpen(true)
  })

  const handleSubmit = useCallback(
    (content: string) => {
      if (!position) return

      addChatBubble({
        id: '',
        content,
        branchId: branchId ?? '',
        ...position,
      })

      setIsDialogOpen(false)
      setPosition(null)
    },
    [position, addChatBubble, branchId],
  )

  const handleClose = useCallback(() => {
    setIsDialogOpen(false)
    setPosition(null)
  }, [])

  return {
    isDialogOpen,
    position: position ? { x: position.x, y: position.y } : null,
    handleClick,
    handleSubmit,
    handleClose,
  }
}
