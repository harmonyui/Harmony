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

export const componentSchemaBase = z.object({
  parentId: z.string(),
  parentChildIndex: z.number(),
  index: z.number(),
})

export const addComponentSchema = componentSchemaBase.extend({
  action: z.literal('create'),
  component: z.optional(z.string()),
  element: z.optional(z.string()),
  cached: z.optional(z.boolean()),
  copiedFrom: z.optional(
    z.object({
      componentId: z.string(),
      childIndex: z.number(),
    }),
  ),
})
export type AddComponent = z.infer<typeof addComponentSchema>

export const deleteComponentSchema = z.object({
  action: z.literal('delete'),
})
export type DeleteComponent = z.infer<typeof deleteComponentSchema>

export const addDeleteComponentSchema = z.union([
  addComponentSchema,
  deleteComponentSchema,
])

export const reorderComponentSchema = componentSchemaBase
export type ReorderComponent = z.infer<typeof reorderComponentSchema>

export const wrapComponentSchema = z.object({
  action: z.literal('wrap'),
  elements: z.array(
    z.object({ componentId: z.string(), childIndex: z.number() }),
  ),
})
export const unwrapComponentSchema = z.object({
  action: z.literal('unwrap'),
})
export const wrapUnwrapComponentSchema = z.union([
  wrapComponentSchema,
  unwrapComponentSchema,
])
export type WrapUnwrapComponent = z.infer<typeof wrapUnwrapComponentSchema>

export const styleUpdateSchema = z.object({
  type: z.union([z.literal('animation'), z.literal('hover')]),
  styleCss: z.string(),
  css: z.string(),
  classes: z.array(
    z.object({
      componentId: z.string(),
      childIndex: z.number(),
      className: z.string(),
    }),
  ),
  properties: z.array(
    z.object({
      componentId: z.string(),
      childIndex: z.number(),
      property: z.string(),
      value: z.string(),
    }),
  ),
})
export type StyleUpdate = z.infer<typeof styleUpdateSchema>
