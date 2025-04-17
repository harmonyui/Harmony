import { ChatBubble } from './chat-bubble'
import { useHarmonyStore } from '../../../hooks/state'

export const ChatBubbles: React.FC = () => {
  const chatBubbles = useHarmonyStore((store) => store.chatBubbles)
  const deleteChatBubble = useHarmonyStore((store) => store.deleteChatBubble)

  return (
    <>
      {chatBubbles.map((bubble) => (
        <ChatBubble
          key={bubble.id}
          chatBubble={bubble}
          onDelete={() => deleteChatBubble(bubble)}
        />
      ))}
    </>
  )
}
