import { z } from 'zod'

export const updatePropertySchema = z.object({
  name: z.string(), // 'variant'
  type: z.literal('classNameVariant'),
  value: z.string(), // 'secondary'
  valueMapping: z.string(), // 'bg-secondary text-white ...'
})
export type UpdateProperty = z.infer<typeof updatePropertySchema>
