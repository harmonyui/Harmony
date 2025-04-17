import { useState, useCallback } from 'react'
import { useHarmonyContext } from '../../../components/harmony-context'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyStore } from '../../../hooks/state'
import { useBranchId } from '../../../hooks/branch-id'

interface CommentPosition {
  x: number
  y: number
  elementId: string
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

    setPosition({
      x: e.clientX,
      y: e.clientY,
      elementId: element.dataset.harmonyId!,
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
        componentId: position.elementId,
        offsetX: position.offsetX,
        offsetY: position.offsetY,
        branchId: branchId ?? '',
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
