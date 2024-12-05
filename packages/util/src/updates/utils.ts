/* eslint-disable @typescript-eslint/no-unsafe-return -- ok */
import type { z } from 'zod'
import { jsonSchema } from './component'

export const createUpdate = <T>(value: T): string => {
  const jsonValue = JSON.stringify(value)

  return jsonValue
}

export const parseUpdate = <T extends z.ZodType>(
  schema: T,
  value: string,
): z.infer<T> => {
  const ret = jsonSchema.pipe(schema).parse(value)

  return ret
}
