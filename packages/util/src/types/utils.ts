import { z } from 'zod'

export type AllOrNothing<T> =
  | T
  | {
      [P in keyof T]?: undefined
    }

export type ReplaceWithName<T, K extends keyof T, Q> = Omit<T, K> & Q
export type Replace<T, K extends keyof T, Q> = ReplaceWithName<
  T,
  K,
  Record<K, Q>
>

export type RecordType<T> = { [P in keyof T]: T[P] }

export const emailSchema = z.custom<`${string}@${string}.${string}`>(
  (data) =>
    typeof data === 'string' &&
    /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      data,
    ),
)
