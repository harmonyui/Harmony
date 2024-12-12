/* eslint-disable @typescript-eslint/no-unsafe-return -- ok */
import type {
  DeleteComponent,
  AddComponent,
  UpdateAttributeValue,
  StyleUpdate,
} from '@harmony/util/src/updates/component'
import { jsonSchema } from '@harmony/util/src/updates/component'
import type { z } from 'zod'
import { type ComponentUpdate } from '@harmony/util/src/types/component'
import type { Font } from '@harmony/util/src/fonts'
import type {
  CommonTools,
  ToolAttributeValue,
} from '../components/attributes/types'
import type { StyleInfo } from './element-utils'
import {
  getComponentIdAndChildIndex,
  getComputedValue,
  recurseElements,
} from './element-utils'
import { isTextElement } from './element-predicate'

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
  styleInfo: StyleInfo,
  fonts: Font[] | undefined,
  parent: HTMLElement | undefined,
): ComponentUpdate[] => {
  if (parent?.closest('svg')) return []

  const updates: ComponentUpdate[] = []

  const { componentId: parentId } = parent
    ? getComponentIdAndChildIndex(parent)
    : { componentId: undefined }

  const { componentId } = getComponentIdAndChildIndex(element)
  const childIndex = getNewChildIndex(componentId)
  const parentChildIndex = parentId ? getNewChildIndex(parentId) : undefined

  const getChildren = (el: HTMLElement) =>
    Array.from(el.childNodes).filter(
      (node) =>
        node.nodeType !== Node.TEXT_NODE ||
        (node.textContent || '').trim().length > 0,
    )

  const index = parent ? getChildren(parent).indexOf(element) : undefined

  if (element.tagName.toLowerCase() === 'svg') {
    const clone = element.cloneNode(true) as HTMLElement
    recurseElements(clone, [
      (el) => {
        el.removeAttribute('class')
        el.removeAttribute('style')
        el.removeAttribute('data-harmony-id')
        el.removeAttribute('data-harmony-child-index')
        el.removeAttribute('data-harmony-component-id')
      },
    ])
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
        element: clone.outerHTML,
        index,
        parentChildIndex,
        parentId,
      }),
      isGlobal: false,
    })
  } else if (element.dataset.harmonyText !== 'true') {
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
  }
  const animationStyles = styleInfo.selectors.filter((selector) =>
    selector.styles.find(
      (style) =>
        style.name.includes('animation') && !style.name.startsWith('--'),
    ),
  )

  if (animationStyles.length > 0) {
    const classes = animationStyles.reduce<string[]>(
      (prev, curr) => Array.from(new Set([...prev, ...curr.class.split(' ')])),
      [],
    )
    const selectorsWithSameClasses = styleInfo.selectors.filter((selector) =>
      selector.class
        .split(' ')
        .some((className) => classes.includes(className)),
    )
    const styleText = `${selectorsWithSameClasses
      .map(
        (selector) => `${selector.selector} {
      ${selector.styles.map((style) => `${style.name}: ${style.value};`).join('\n')}
    }`,
      )
      .join('\n')}

    ${styleInfo.keyframes.map((keyframe) => keyframe.text).join('\n')}`

    updates.push({
      type: 'component',
      name: 'style',
      componentId,
      childIndex,
      value: createUpdate<StyleUpdate>({
        css: styleText,
        classes,
      }),
      oldValue: '',
      isGlobal: false,
    })
  }
  for (const { name, value, element: dataElement } of data) {
    //If the element tied to this value is not our current element, that means it is
    //a default value
    if (element !== dataElement) continue
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

  const textElement = isTextElement(element) ? element : undefined
  if (textElement) {
    updates.push({
      type: 'text',
      name: (index ?? 0).toString(),
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
