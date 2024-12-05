/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import { useCallback, useEffect } from 'react'
import hotkeys from 'hotkeys-js'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { updateSchema } from '@harmony/util/src/types/component'
import { z } from 'zod'
import type { AddComponent } from '@harmony/util/src/updates/component'
import { jsonSchema } from '@harmony/util/src/updates/component'
import { useUpdateComponent } from '../components/harmonycn/update-component'
import { createNewElementUpdates, createUpdate } from '../utils/update'
import { useHarmonyContext } from '../components/harmony-context'
import {
  getComponentIdAndChildIndex,
  recurseElements,
} from '../utils/element-utils'
import { getTextToolsFromAttributes } from '../components/attributes/utils'
import { useHarmonyStore } from './state'

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

      recurseElements(rootElement, [
        (element, parent) => {
          const updates = createNewElementUpdates(
            getNewChildIndex,
            element,
            getTextToolsFromAttributes(element, []),
            fonts,
            parent,
          )
          allUpdates.push(...updates)
        },
      ])

      return allUpdates
    },
    [fonts, getNewChildIndex],
  )

  const copyComponent = useCallback(() => {
    if (!selectedComponent) return

    const updates = convertElementToUpdates(selectedComponent.element)
    const stringForm = JSON.stringify(updates)
    void navigator.clipboard.writeText(stringForm)

    const { element, id, childIndex } = selectedComponent
    setCopiedComponent({ element, componentId: id, childIndex })
  }, [selectedComponent, setCopiedComponent, convertElementToUpdates])

  const pasteComponent = useCallback(async () => {
    if (!selectedComponent) return

    const copiedText = await navigator.clipboard.readText()
    const updateResult = jsonSchema
      .pipe(z.array(updateSchema))
      .safeParse(copiedText)
    if (updateResult.success) {
      const updates = updateResult.data
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
      })
      onAttributesChange(updates, true)
      return
    }

    if (!copiedComponent) return

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

  useEffect(() => {
    const copyEvent = (event: KeyboardEvent) => {
      event.preventDefault()
      copyComponent()
    }
    const pasteEvent = (event: KeyboardEvent) => {
      event.preventDefault()
      void pasteComponent()
    }
    const deleteEvent = (event: KeyboardEvent) => {
      event.preventDefault()
      deleteComp()
    }
    hotkeys('ctrl+c, command+c', copyEvent)

    hotkeys('ctrl+v, command+v', pasteEvent)
    hotkeys('delete', deleteEvent)

    return () => {
      hotkeys.unbind('ctrl+c, command+c', copyEvent)
      hotkeys.unbind('ctrl+v, command+v', pasteEvent)
      hotkeys.unbind('delete', deleteEvent)
    }
  })
}
