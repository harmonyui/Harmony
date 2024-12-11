import { z } from 'zod'

export const classNameValueSchema = z.object({
  type: z.union([z.literal('style'), z.literal('class')]),
  value: z.string(),
})
export type ClassNameValue = z.infer<typeof classNameValueSchema>
