import {
  ChatTeardropIcon,
  TrashIcon,
} from '@harmony/ui/src/components/core/icons'
import { Button } from '@harmony/ui/src/components/core/button'
import { useMemo } from 'react'
import { ChatBubble as ChatBubbleType } from '@harmony/util/src/types/branch'
import { findElementFromId } from '../../../utils/element-utils'
import { useHarmonyStore } from '../../../hooks/state'
import { AnimateOpenClose } from '@harmony/ui/src/components/design/animate-open-close'
import { AnimateButton } from '@harmony/ui/src/components/design/animate-button'

interface ChatBubbleProps {
  chatBubble: ChatBubbleType
  onDelete?: () => void
  accountName?: string
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  chatBubble,
  onDelete,
  accountName,
}) => {
  const selectedChatBubble = useHarmonyStore(
    (store) => store.selectedChatBubble,
  )
  const setSelectedChatBubble = useHarmonyStore(
    (store) => store.setSelectedChatBubble,
  )
  const rootComponent = useHarmonyStore((store) => store.rootComponent)

  const position = useMemo(() => {
    const element = findElementFromId(
      chatBubble.componentId,
      chatBubble.childIndex,
      rootComponent?.element,
    )
    if (!element) return
    const rect = element.getBoundingClientRect()
    return {
      x: rect.left + chatBubble.offsetX,
      y: rect.top + chatBubble.offsetY,
    }
  }, [chatBubble, rootComponent])

  return position ? (
    <div
      className='absolute z-[1000000]'
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <AnimateOpenClose
        openElement={
          <div className='relative flex items-center gap-2 bg-white rounded-lg shadow-lg p-3 w-[250px]'>
            <ChatTeardropIcon className='w-4 h-4 mt-1 shrink-0 fill-primary' />
            <div className='flex-1 min-w-0'>
              {accountName && (
                <div className='text-xs font-medium text-gray-900 mb-1'>
                  {accountName}
                </div>
              )}
              <div className='text-sm text-gray-700 break-words'>
                {chatBubble.content}
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              {onDelete && (
                <Button
                  mode='none'
                  size='icon'
                  className='h-6 w-6 p-1 hover:bg-gray-100 rounded-md'
                  onClick={onDelete}
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          </div>
        }
        closedElement={
          <AnimateButton
            className='h-6 w-6'
            onClick={() => setSelectedChatBubble(chatBubble)}
          >
            <ChatTeardropIcon className='fill-primary' />
          </AnimateButton>
        }
        isOpen={selectedChatBubble?.id === chatBubble.id}
      />
    </div>
  ) : null
}
