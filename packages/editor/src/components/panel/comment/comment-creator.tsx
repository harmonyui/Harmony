import { useEffect } from 'react'
import { useHarmonyContext } from '../../../components/harmony-context'
import { CommentDialog } from './comment-dialog'
import { useCommentCreation } from './use-comment-creation'

export const CommentCreator: React.FC = () => {
  const { isComment } = useHarmonyContext()
  const {
    isDialogOpen,
    position,
    handleClick,
    handleSubmit,
    handleClose,
    setDialogOpen,
  } = useCommentCreation()

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [handleClick])

  useEffect(() => {
    if (!isComment) {
      setDialogOpen(false)
    }
  }, [isComment])

  return (
    <CommentDialog
      isOpen={isDialogOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      position={position}
    />
  )
}
