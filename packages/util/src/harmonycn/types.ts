import { z } from 'zod'

export const harmonyCnSchema = z.union([
  z.literal('text'),
  z.literal('frame'),
  z.literal('image'),
  z.literal('button'),
])
export type HarmonyCn = z.infer<typeof harmonyCnSchema>
