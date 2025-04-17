import type { Db, Prisma } from '@harmony/db/lib/prisma'
import type { ChatBubble } from '@harmony/util/src/types/branch'

const chatBubblePayload = {
  include: {
    account: true,
  },
} satisfies Prisma.ChatBubbleDefaultArgs
type PrismaChatBubble = Prisma.ChatBubbleGetPayload<typeof chatBubblePayload>

const prismaToChatBubble = (chat: PrismaChatBubble): ChatBubble => {
  return {
    id: chat.id,
    branchId: chat.branch_id,
    componentId: chat.component_id,
    content: chat.content,
    offsetX: chat.offset_x,
    offsetY: chat.offset_y,
  }
}

export const getChatBubbles = async ({
  prisma,
  branchId,
}: {
  prisma: Db
  branchId: string
}): Promise<ChatBubble[]> => {
  const chatBubbles = await prisma.chatBubble.findMany({
    where: {
      branch_id: branchId,
    },
    ...chatBubblePayload,
  })

  return chatBubbles.map(prismaToChatBubble)
}

export const createChatBubble = async ({
  prisma,
  branchId,
  componentId,
  content,
  offsetX,
  offsetY,
  accountId,
}: {
  prisma: Db
  branchId: string
  componentId: string
  content: string
  offsetX: number
  offsetY: number
  accountId?: string
}): Promise<ChatBubble> => {
  const chatBubble = await prisma.chatBubble.create({
    data: {
      branch_id: branchId,
      component_id: componentId,
      content,
      offset_x: offsetX,
      offset_y: offsetY,
      account_id: accountId,
    },
    ...chatBubblePayload,
  })

  return prismaToChatBubble(chatBubble)
}

export const updateChatBubble = async ({
  prisma,
  id,
  content,
  offsetX,
  offsetY,
}: {
  prisma: Db
  id: string
  content: string
  offsetX: number
  offsetY: number
}): Promise<ChatBubble> => {
  const chatBubble = await prisma.chatBubble.update({
    where: { id },
    data: {
      content,
      offset_x: offsetX,
      offset_y: offsetY,
    },
    ...chatBubblePayload,
  })

  return prismaToChatBubble(chatBubble)
}

export const deleteChatBubble = async ({
  prisma,
  id,
}: {
  prisma: Db
  id: string
}): Promise<void> => {
  await prisma.chatBubble.delete({
    where: { id },
  })
}
