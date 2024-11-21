import { z } from 'zod'

export const jsonSchema = z
  .string()
  .refine((value) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  })
  .transform((value) => JSON.parse(value) as unknown)

export const updateAttributeValue = z.object({
  action: z.union([
    z.literal('create'),
    z.literal('delete'),
    z.literal('update'),
  ]),
  name: z.string(),
  value: z.string(),
})
export type UpdateAttributeValue = z.infer<typeof updateAttributeValue>
