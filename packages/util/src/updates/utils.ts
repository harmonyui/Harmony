/* eslint-disable @typescript-eslint/no-unsafe-return -- ok */
import type { z } from 'zod'
import type { ComponentUpdate } from '../types/component'
import {
  addComponentSchema,
  jsonSchema,
  reorderComponentSchema,
} from './component'

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

export const getComponentIdsFromUpdates = (
  updates: ComponentUpdate[],
): string[] => {
  const componentIds: string[] = []
  updates.forEach((update) => {
    componentIds.push(update.componentId)
    const addComponentUpdate = jsonSchema
      .pipe(addComponentSchema)
      .safeParse(update.value)
    if (addComponentUpdate.success) {
      componentIds.push(addComponentUpdate.data.parentId)
      addComponentUpdate.data.copiedFrom?.componentId &&
        componentIds.push(addComponentUpdate.data.copiedFrom.componentId)
    }

    const reorderComponentUpdate = jsonSchema
      .pipe(reorderComponentSchema)
      .safeParse(update.value)
    if (reorderComponentUpdate.success) {
      componentIds.push(reorderComponentUpdate.data.parentId)
    }
  })

  return componentIds
}
