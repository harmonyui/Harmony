import { Dialog } from '@harmony/ui/src/components/core/dialog'
import { Button } from '@harmony/ui/src/components/core/button'
import { Input } from '@harmony/ui/src/components/core/input'
import { useState } from 'react'
import {
  ArrowUpIcon,
  ChatTeardropIcon,
} from '@harmony/ui/src/components/core/icons'
import { AnimateOpenClose } from '@harmony/ui/src/components/design/animate-open-close'
import { AnimatePresence, motion } from 'framer-motion'

interface CommentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
  position: { x: number; y: number } | null
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
    <div
      className='fixed z-[1000000]'
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
    >
      <AnimateOpenClose
        openElement={
          <div className='flex gap-2'>
            <ChatTeardropIcon className='w-6 h-6 fill-primary' />
            <div className='bg-white rounded-lg shadow-lg p-4 w-[300px]'>
              <Input
                type='textarea'
                placeholder='Add a comment...'
                value={content}
                onChange={setContent}
                className='min-h-[100px] mb-4 border-none !shadow-none w-full focus:!ring-0'
              />
              <div className='flex justify-end gap-2'>
                <button
                  className='rounded-full bg-primary text-white p-1.5'
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                >
                  <ArrowUpIcon className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        }
        isOpen={isOpen}
      />
    </div>
  )
}
