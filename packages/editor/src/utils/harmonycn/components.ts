import { createFrameElement } from './creation-functions/create-frame'
import { createImageElement } from './creation-functions/create-image'
import { createTextElement } from './creation-functions/create-text'
import type { CreateComponent, HarmonyCn } from './types'

export const componentCreations: Record<HarmonyCn, CreateComponent> = {
  Text: createTextElement,
  Frame: createFrameElement,
  Image: createImageElement,
}
