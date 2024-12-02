import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'
import { createFrameElement } from './creation-functions/create-frame'
import { createImageElement } from './creation-functions/create-image'
import { createTextElement } from './creation-functions/create-text'
import type { CreateComponent } from './types'

export const componentCreations: Record<HarmonyCn, CreateComponent> = {
  text: createTextElement,
  frame: createFrameElement,
  image: createImageElement,
}
