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
import { camelToKebab } from '@harmony/util/src/utils/common'
import type {
  CommonTools,
  ToolAttributeValue,
} from '../components/attributes/types'
import type { SelectorInfo, StyleInfo } from './element-utils'
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

export const createNewElementUpdates = ({
  getNewChildIndex,
  element,
  data,
  styleInfo,
  fonts,
  parent,
  addSelectorInfo,
}: {
  getNewChildIndex: (parentId: string) => number
  element: HTMLElement
  data: ToolAttributeValue<CommonTools>[]
  styleInfo: StyleInfo
  fonts: Font[] | undefined
  parent: HTMLElement | undefined
  addSelectorInfo: (
    update: SelectorInfo | StyleInfo['keyframes'][number],
    type: StyleUpdate['type'],
    property?: StyleUpdate['properties'][number],
  ) => void
}): ComponentUpdate[] => {
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
  const animationStyles = styleInfo.matches.filter((selector) =>
    selector.styles.find(
      (style) =>
        style.name.includes('animation') && !style.name.startsWith('--'),
    ),
  )

  if (animationStyles.length > 0) {
    const classes = animationStyles
      .reduce<
        string[]
      >((prev, curr) => Array.from(new Set([...prev, ...curr.class.split(' ')])), [])
      .filter(Boolean)
    const selectorsWithSameClasses = styleInfo.matches.filter((selector) =>
      selector.class
        .split(' ')
        .some((className) => classes.includes(className)),
    )

    selectorsWithSameClasses.forEach((selector) =>
      addSelectorInfo(selector, 'animation'),
    )

    styleInfo.keyframes.forEach((selector) =>
      addSelectorInfo(selector, 'animation'),
    )
  }

  const hoverStyles =
    styleInfo.selectors.find((s) => s.type === 'hover')?.values ?? []
  if (hoverStyles.length > 0) {
    hoverStyles.forEach((selector) => addSelectorInfo(selector, 'hover'))
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

    const cssStyleValue = styleInfo.matches.find((style) =>
      style.styles.find((s) => s.name === camelToKebab(name)),
    )

    //If a style is being affected by a hover state but has a default value from a class, then we do not want the `style` attribute to override this hover state,
    //so instead apply the class name that has the default style value
    if (
      hoverStyles.find((s) =>
        s.styles.find((style) => style.name === camelToKebab(name)),
      ) &&
      cssStyleValue
    ) {
      addSelectorInfo(cssStyleValue, 'hover', {
        componentId,
        childIndex,
        property: name,
        value,
      })
    } else {
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
