import { useCallback, useEffect } from 'react'
import hotkeys from 'hotkeys-js'
import { useUpdateComponent } from '../components/harmonycn/update-component'
import { useHarmonyStore } from './state'

export const useCopyPasteDelete = () => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const setCopiedComponent = useHarmonyStore(
    (state) => state.setCopiedComponent,
  )
  const copiedComponent = useHarmonyStore((state) => state.copiedComponent)
  const { addComponent, deleteComponent } = useUpdateComponent()

  const copyComponent = useCallback(() => {
    if (!selectedComponent) return

    const { element, id, childIndex } = selectedComponent
    setCopiedComponent({ element, componentId: id, childIndex })
  }, [selectedComponent, setCopiedComponent])

  const pasteComponent = useCallback(() => {
    if (!copiedComponent) return
    if (!selectedComponent) return

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
      pasteComponent()
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
