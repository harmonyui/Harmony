import { useCallback } from 'react'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { updateSchema } from '@harmony/util/src/types/component'
import { z } from 'zod'
import type {
  AddComponent,
  StyleUpdate,
} from '@harmony/util/src/updates/component'
import { jsonSchema } from '@harmony/util/src/updates/component'
import { getLocationsFromComponentId } from '@harmony/util/src/utils/component'
import { replaceAll } from '@harmony/util/src/utils/common'
import { useUpdateComponent } from '../components/harmonycn/update-component'
import { createNewElementUpdates, createUpdate } from '../utils/update'
import { useHarmonyContext } from '../components/harmony-context'
import type { SelectorInfo, StyleInfo } from '../utils/element-utils'
import {
  getComponentIdAndChildIndex,
  getStyleInfo,
  getStyleInfoForElement,
  recurseElements,
} from '../utils/element-utils'
import { getTextToolsFromAttributes } from '../components/attributes/utils'
import { useHarmonyStore } from './state'
import { useHotKeys } from './hotkeys'

const jsonUpdatesSchema = jsonSchema.pipe(z.array(updateSchema))

export const useCopyPasteDelete = () => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const setCopiedComponent = useHarmonyStore(
    (state) => state.setCopiedComponent,
  )
  const copiedComponent = useHarmonyStore((state) => state.copiedComponent)
  const getNewChildIndex = useHarmonyStore((state) => state.getNewChildIndex)
  const { addComponent, deleteComponent } = useUpdateComponent()
  const { onAttributesChange, fonts } = useHarmonyContext()

  const convertElementToUpdates = useCallback(
    (rootElement: HTMLElement) => {
      const allUpdates: ComponentUpdate[] = []
      const styleUpdates: StyleUpdate[] = []

      const styleInfo = getStyleInfo()
      const addSelectorInfo = (
        update: SelectorInfo | StyleInfo['keyframes'][number],
        type: StyleUpdate['type'],
        element: HTMLElement,
        property?: StyleUpdate['properties'][number],
      ) => {
        let styleUpdate = styleUpdates.find((style) => style.type === type)
        if (!styleUpdate) {
          styleUpdate = {
            type,
            css: '',
            styleCss: '',
            classes: [],
            properties: [],
          }
          styleUpdates.push(styleUpdate)
        }
        if ('selector' in update) {
          const styleText = `${update.selector} {
            ${update.styles.map((style) => `${style.name}: ${style.value};`).join('\n')}
          }
          `
          if (!styleUpdate.styleCss.includes(styleText)) {
            styleUpdate.styleCss += styleText
            if (!property) {
              styleUpdate.css += styleText
            }

            const mainStyleInfo = styleInfo.matches.find(
              (s) => s.selector === update.selector,
            )
            if (!mainStyleInfo)
              throw new Error(`Cannot find main style info ${update.selector}`)

            mainStyleInfo.class.split(' ').forEach((c) => {
              if (!c) return
              try {
                const classElements = Array.from(
                  document.querySelectorAll(`.${c}`),
                ).filter((e) => e.contains(element))
                classElements.forEach((el) => {
                  const { componentId, childIndex } =
                    getComponentIdAndChildIndex(el as HTMLElement)
                  const info = styleUpdate.classes.find(
                    (classInfo) =>
                      componentId === classInfo.componentId &&
                      childIndex === classInfo.childIndex,
                  )
                  if (info) {
                    if (!info.className.split(' ').includes(c)) {
                      info.className += ` ${c}`
                    }
                  } else {
                    styleUpdate.classes.push({
                      componentId,
                      childIndex,
                      className: c,
                    })
                  }
                })
              } catch {
                return
              }
            })

            //If the element has not been added yet, add it with an empty class (this is needed in the backend)
            //When the styles are translated to tailwilnd
            const { componentId, childIndex } =
              getComponentIdAndChildIndex(element)
            const info = styleUpdate.classes.find(
              (classInfo) =>
                componentId === classInfo.componentId &&
                childIndex === classInfo.childIndex,
            )
            if (!info) {
              styleUpdate.classes.push({
                componentId,
                childIndex,
                className: '',
              })
            }
          }
        } else if (!styleUpdate.styleCss.includes(update.text)) {
          styleUpdate.styleCss += update.text
          if (!property) {
            styleUpdate.css += update.text
          }
        }

        if (property) {
          styleUpdate.properties.push(property)
        }
      }
      const getNewChildIndexLocal = (parentId: string) => {
        return getNewChildIndex(parentId) - 1
      }

      recurseElements(
        rootElement,
        [
          (element, parent) => {
            if (
              ['link', 'style', 'noscript'].includes(
                element.tagName.toLowerCase(),
              )
            )
              return

            const updates = createNewElementUpdates({
              getNewChildIndex: getNewChildIndexLocal,
              element,
              data: getTextToolsFromAttributes(element, [], styleInfo),
              styleInfo: getStyleInfoForElement(element, styleInfo),
              fonts,
              parent,
              addSelectorInfo(info, type, property) {
                addSelectorInfo(info, type, element, property)
              },
            })
            allUpdates.push(...updates)
          },
        ],
        undefined,
        true,
      )

      const { componentId, childIndex } =
        getComponentIdAndChildIndex(rootElement)

      styleUpdates.forEach((styleUpdate) => {
        allUpdates.push({
          type: 'component',
          name: 'style',
          value: createUpdate<StyleUpdate>(styleUpdate),
          oldValue: '',
          componentId,
          childIndex,
          isGlobal: false,
          dateModified: new Date(),
        })
      })
      return allUpdates
    },
    [fonts, getNewChildIndex],
  )

  const pasteExternal = useCallback(async () => {
    if (!selectedComponent) return

    const copiedText = await navigator.clipboard.readText()
    const updateResult = jsonUpdatesSchema.safeParse(copiedText)
    if (updateResult.success) {
      const updates = updateResult.data
      const idMapping: Record<string, string> = {}
      updates.forEach((update) => {
        if (update.name === 'delete-create-minimal') {
          const { componentId: parentId, childIndex: parentChildIndex } =
            getComponentIdAndChildIndex(
              selectedComponent.element.parentElement!,
            )
          const index =
            Array.from(
              selectedComponent.element.parentElement!.children,
            ).indexOf(selectedComponent.element) + 1
          update.name = 'delete-create'
          update.value = createUpdate<AddComponent>({
            ...(JSON.parse(update.value) as {
              action: 'create'
              element: string
            }),
            parentId,
            parentChildIndex,
            index,
          })
        }
        idMapping[update.componentId] = getLocationsFromComponentId(
          selectedComponent.id,
        )
          .map((location) =>
            btoa(`${location.file}:${atob(update.componentId)}`),
          )
          .join('#')
      })
      let mappedUpdates = JSON.stringify(updates)
      Object.entries(idMapping).forEach(([oldId, newId]) => {
        mappedUpdates = replaceAll(mappedUpdates, `"${oldId}"`, `"${newId}"`)
        mappedUpdates = replaceAll(
          mappedUpdates,
          `\\"${oldId}\\"`,
          `\\"${newId}\\"`,
        )
      })
      onAttributesChange(jsonUpdatesSchema.parse(mappedUpdates), true)
      return
    }
  }, [selectedComponent])

  const copyComponent = useCallback(() => {
    if (!selectedComponent) return

    const updates = convertElementToUpdates(selectedComponent.element)
    const stringForm = JSON.stringify(updates)
    void navigator.clipboard.writeText(stringForm)

    const { element, id, childIndex } = selectedComponent
    setCopiedComponent({ element, componentId: id, childIndex })
  }, [selectedComponent, setCopiedComponent, convertElementToUpdates])

  const pasteComponent = useCallback(async () => {
    if (!selectedComponent || !copiedComponent) return

    const { componentId, childIndex } = copiedComponent
    addComponent(selectedComponent.element, '', {
      position: 'below',
      copiedFrom: { componentId, childIndex },
    })
  }, [selectedComponent, copiedComponent, addComponent])

  const deleteComp = useCallback(() => {
    if (!selectedComponent) return

    deleteComponent(selectedComponent.element)
  }, [deleteComponent, selectedComponent])

  useHotKeys('ctrl+c, command+c', (event: KeyboardEvent) => {
    event.preventDefault()
    copyComponent()
  })
  useHotKeys('ctrl+v, command+v', (event: KeyboardEvent) => {
    event.preventDefault()
    void pasteComponent()
  })
  useHotKeys('ctrl+shift+v, command+shift+v', (event: KeyboardEvent) => {
    event.preventDefault()
    void pasteExternal()
  })
  useHotKeys('delete', (event: KeyboardEvent) => {
    event.preventDefault()
    deleteComp()
  })
}
