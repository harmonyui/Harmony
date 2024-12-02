import { z } from 'zod'

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
})
export type RegistryItem = z.infer<typeof registryItemSchema>
