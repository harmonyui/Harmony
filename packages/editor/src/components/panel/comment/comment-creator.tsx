import { useEffect } from 'react'
import { useHarmonyContext } from '../../../components/harmony-context'
import { CommentDialog } from './comment-dialog'
import { useCommentCreation } from './use-comment-creation'

export const CommentCreator: React.FC = () => {
  const { isComment } = useHarmonyContext()
  const { isDialogOpen, position, handleClick, handleSubmit, handleClose } =
    useCommentCreation()

  useEffect(() => {
    if (isComment) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [isComment, handleClick])

  if (!position) return null

  return (
    <CommentDialog
      isOpen={isDialogOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      position={position}
    />
  )
}
