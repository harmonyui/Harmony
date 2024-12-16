import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { styleUpdateSchema } from '@harmony/util/src/updates/component'
import { parseUpdate } from '@harmony/util/src/updates/utils'
import type { StateCreator } from 'zustand'
import type { HarmonyCnState } from '../harmonycn'
import type { ComponentState } from '../component-state'
import {
  findElementFromId,
  getComponentIdAndChildIndex,
} from '../../../utils/element-utils'
import { generateUniqueId } from '../../../utils/common'
import { createComponentUpdate } from './create'
import type { ComponentUpdateState } from './slice'
import { classNameComponentUpdate } from './classname'
import { textComponentUpdate } from './text'

export const styleComponentUpdate =
  (
    props: Parameters<
      StateCreator<ComponentUpdateState & HarmonyCnState & ComponentState>
    >,
  ) =>
  async (
    update: ComponentUpdate,
    element: HTMLElement,
    rootElement: HTMLElement | undefined,
  ): Promise<void> => {
    const { styleCss: css, classes } = parseUpdate(
      styleUpdateSchema,
      update.value,
    )
    if (!element.parentElement) return

    const { componentId: parentId, childIndex: parentChildIndex } =
      getComponentIdAndChildIndex(element.parentElement)

    const newStyleId = btoa(generateUniqueId())
    const newStyleUpdate = { ...update, componentId: newStyleId, childIndex: 0 }
    await createComponentUpdate(props)(
      newStyleUpdate,
      {
        parentId,
        component: undefined,
        parentChildIndex,
        index: 0,
        element: 'style',
        action: 'create',
      },
      rootElement,
    )
    const styleElement = findElementFromId(newStyleId, 0, rootElement)
    if (!styleElement) {
      throw new Error('Cannot find style element')
    }
    classes.forEach((classInfo) => {
      const classElement = findElementFromId(
        classInfo.componentId,
        classInfo.childIndex,
        rootElement,
      )
      if (!classElement) {
        throw new Error('Cannot find class element')
      }
      classNameComponentUpdate(
        {
          ...update,
          componentId: classInfo.componentId,
          childIndex: classInfo.childIndex,
          value: classInfo.className,
          oldValue: '',
          name: 'class',
        },
        classElement,
        [],
      )
    })
    textComponentUpdate(
      { ...newStyleUpdate, value: css, name: '0' },
      styleElement,
    )
  }
