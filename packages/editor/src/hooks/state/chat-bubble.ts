import { createHarmonySlice } from './factory'
import { ChatBubble } from '@harmony/util/src/types/branch'
import { DataLayerState } from './data-layer'

export interface ChatBubbleState {
  chatBubbles: ChatBubble[]
  addChatBubble: (chatBubble: ChatBubble) => Promise<void>
  deleteChatBubble: (chatBubble: ChatBubble) => Promise<void>
}
export const createChatBubblesSlice = createHarmonySlice<
  ChatBubbleState,
  DataLayerState
>((set, get) => ({
  chatBubbles: [],
  addChatBubble: async (chatBubble) => {
    const newBubble = await get().createComment(chatBubble)
    set((state) => ({
      chatBubbles: [...state.chatBubbles, newBubble],
    }))
  },
  deleteChatBubble: async (chatBubble) => {
    await get().deleteComment(chatBubble)
    set((state) => ({
      chatBubbles: state.chatBubbles.filter(
        (bubble) => bubble.id !== chatBubble.id,
      ),
    }))
  },
}))
