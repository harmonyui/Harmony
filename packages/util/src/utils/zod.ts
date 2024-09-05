import { z } from 'zod'

export const stringUnionSchema = <T extends readonly string[]>(array: T) =>
  z.custom<T[number]>(
    (data) => typeof data === 'string' && array.includes(data),
  )
