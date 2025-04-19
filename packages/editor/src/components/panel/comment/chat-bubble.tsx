import {
  ChatTeardropIcon,
  XMarkIcon,
} from '@harmony/ui/src/components/core/icons'
import { Button } from '@harmony/ui/src/components/core/button'
import { useMemo, useState } from 'react'
import { ChatBubble as ChatBubbleType } from '@harmony/util/src/types/branch'
import { findElementFromId } from '../../../utils/element-utils'
import { useHarmonyStore } from '../../../hooks/state'

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
  const [isExpanded, setIsExpanded] = useState(false)
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
      {isExpanded ? (
        <div className='relative flex items-start gap-2 bg-white rounded-lg shadow-lg p-3 w-[250px]'>
          <ChatTeardropIcon className='w-4 h-4 mt-1 shrink-0 fill-[#11283B]' />
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
                className='h-5 w-5 -mt-1 -mr-1 hover:bg-gray-100'
                onClick={onDelete}
              >
                <XMarkIcon className='h-3 w-3' />
              </Button>
            )}
            <Button
              mode='none'
              size='icon'
              className='h-5 w-5 -mr-1 hover:bg-gray-100'
              onClick={() => setIsExpanded(false)}
            >
              <XMarkIcon className='h-3 w-3' />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          mode='none'
          size='icon'
          className='h-6 w-6 rounded-full bg-white shadow-md hover:bg-gray-50'
          onClick={() => setIsExpanded(true)}
        >
          <ChatTeardropIcon className='w-4 h-4 fill-[#11283B]' />
        </Button>
      )}
    </div>
  ) : null
}
