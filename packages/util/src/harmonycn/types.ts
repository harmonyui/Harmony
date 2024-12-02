import { z } from 'zod'
import { componentPropSchema } from '../types/component'

export const harmonyCnSchema = z.union([
  z.literal('text'),
  z.literal('frame'),
  z.literal('image'),
])
export type HarmonyCn = z.infer<typeof harmonyCnSchema>

export const registryItemSchema = z.object({
  name: z.string(),
  implementation: z.string(),
  classes: z.optional(z.string()),
  dependencies: z.array(
    z.object({
      path: z.string(),
      name: z.string(),
      isDefault: z.boolean(),
    }),
  ),
  props: z.array(componentPropSchema),
})
export type RegistryItem = z.infer<typeof registryItemSchema>
