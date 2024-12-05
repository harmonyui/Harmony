/* eslint-disable no-nested-ternary -- ok*/
/* eslint-disable @typescript-eslint/no-unsafe-return -- ok */
import type {
  DeleteComponent,
  AddComponent,
  UpdateAttributeValue,
} from '@harmony/util/src/updates/component'
import { jsonSchema } from '@harmony/util/src/updates/component'
import type { z } from 'zod'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import type { Font } from '@harmony/util/src/fonts'
import type {
  CommonTools,
  ToolAttributeValue,
} from '../components/attributes/types'
import { isTextElement } from '../components/inspector/inspector'
import { defaultToolValues } from '../components/attributes/utils'
import { getComputedValue } from '../components/snapping/position-updator'
import { getComponentIdAndChildIndex } from './element-utils'

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

export const createNewElementUpdates = (
  getNewChildIndex: (parentId: string) => number,
  element: HTMLElement,
  data: ToolAttributeValue<CommonTools>[],
  fonts: Font[] | undefined,
  parent: HTMLElement | undefined,
): ComponentUpdate[] => {
  const updates: ComponentUpdate[] = []

  const { componentId: parentId } = parent
    ? getComponentIdAndChildIndex(parent)
    : { componentId: undefined }

  const { componentId } = getComponentIdAndChildIndex(element)
  const childIndex = getNewChildIndex(componentId)
  const parentChildIndex = parentId ? getNewChildIndex(parentId) : undefined

  const index = parent
    ? Array.from(parent.children).indexOf(element) + 1
    : undefined

  updates.push({
    type: 'component',
    name: parent ? 'delete-create' : 'delete-create-minimal',
    componentId,
    childIndex,
    oldValue: createUpdate<DeleteComponent>({
      action: 'delete',
    }),
    value: createUpdate<
      | AddComponent
      | {
          action: 'create'
          element: string
        }
    >({
      action: 'create',
      element: element.tagName.toLowerCase(),
      index,
      parentChildIndex,
      parentId,
    }),
    isGlobal: false,
  })
  for (const { name, value } of data) {
    if (defaultToolValues[name] === value) continue
    if (name === 'font') {
      if (!fonts) continue
      const defaultFont = getComputedValue(document.body, 'font-family')
      if (value.includes(defaultFont)) continue

      const font = fonts.find((f) =>
        value.toLowerCase().includes(f.name.toLowerCase()),
      )
      if (!font) continue
      updates.push({
        type: 'className',
        name,
        componentId,
        childIndex,
        value: font.id,
        oldValue: '',
        isGlobal: false,
      })
      continue
    }
    updates.push({
      type: 'className',
      name,
      componentId,
      childIndex,
      value,
      oldValue: '',
      isGlobal: false,
    })
  }

  const textElement = isTextElement(element)
    ? element
    : element.childNodes.length === 1 &&
        isTextElement(element.childNodes[0] as HTMLElement)
      ? (element.childNodes[0] as HTMLElement)
      : undefined
  if (textElement) {
    updates.push({
      type: 'text',
      name: '0',
      componentId,
      childIndex,
      value: textElement.textContent || '',
      oldValue: '',
      isGlobal: false,
    })
  }

  if (element.tagName.toLowerCase() === 'img') {
    updates.push({
      type: 'component',
      name: 'update-attribute',
      componentId,
      childIndex,
      value: createUpdate<UpdateAttributeValue>({
        name: 'src',
        value: element.getAttribute('src') || '',
        action: 'update',
      }),
      oldValue: createUpdate<UpdateAttributeValue>({
        name: 'src',
        value: '',
        action: 'update',
      }),
      isGlobal: false,
    })
  }

  if (element.tagName.toLowerCase() === 'a') {
    updates.push({
      type: 'component',
      name: 'update-attribute',
      componentId,
      childIndex,
      value: createUpdate<UpdateAttributeValue>({
        name: 'href',
        value: element.getAttribute('href') || '',
        action: 'update',
      }),
      oldValue: createUpdate<UpdateAttributeValue>({
        name: 'href',
        value: '',
        action: 'update',
      }),
      isGlobal: false,
    })
  }

  return updates
}
