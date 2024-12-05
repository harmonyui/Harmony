import { z } from 'zod'

export const tokenSchema = z.object({
  name: z.string(),
  values: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
})
export type Token = z.infer<typeof tokenSchema>
