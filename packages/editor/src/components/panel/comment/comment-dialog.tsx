import { Dialog } from '@harmony/ui/src/components/core/dialog'
import { Button } from '@harmony/ui/src/components/core/button'
import { Input } from '@harmony/ui/src/components/core/input'
import { useState } from 'react'

interface CommentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
  position: { x: number; y: number }
}

export const CommentDialog: React.FC<CommentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  position,
}) => {
  const [content, setContent] = useState('')

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content)
      setContent('')
      onClose()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setContent('')
        }
      }}
    >
      <div
        className='fixed z-[1000000]'
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className='bg-white rounded-lg shadow-lg p-4 w-[300px]'>
          <Input
            type='textarea'
            placeholder='Add a comment...'
            value={content}
            onChange={setContent}
            className='min-h-[100px] mb-4'
          />
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Add Comment
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
