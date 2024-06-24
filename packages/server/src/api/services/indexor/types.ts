import type { ComponentLocation } from '@harmony/util/src/types/component'
import { locationSchema } from '@harmony/util/src/types/component'
import { z } from 'zod'
import type { HarmonyComponentWithNode } from './indexor'

export const attributeSchema = z.object({
  id: z.string(),
  type: z.union([
    z.literal('text'),
    z.literal('className'),
    z.literal('property'),
  ]),
  name: z.string(),
  value: z.string(),
  index: z.number(),
  location: locationSchema,
  locationType: z.string(),
  reference: z.object({ id: z.string() }),
})
export interface Attribute {
  id: string
  type: 'text' | 'className' | 'property'
  name: string
  value: string
  index: number
  location: ComponentLocation
  locationType: string
  reference: HarmonyComponentWithNode
}

export interface HarmonyComponent {
  id: string
  name: string
  props: Attribute[]
  isComponent: boolean
  getParent: () => HarmonyComponent | undefined
  containingComponent?: HarmonyComponent
  location: ComponentLocation
  children: HarmonyComponent[]
}
