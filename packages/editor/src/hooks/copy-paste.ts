import { useCallback, useEffect } from 'react'
import hotkeys from 'hotkeys-js'
import { useUpdateComponent } from '../components/harmonycn/update-component'
import { useHarmonyStore } from './state'

export const useCopyPaste = () => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const setCopiedComponent = useHarmonyStore(
    (state) => state.setCopiedComponent,
  )
  const copiedComponent = useHarmonyStore((state) => state.copiedComponent)
  const { addComponent } = useUpdateComponent()

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

  useEffect(() => {
    const copyEvent = (event: KeyboardEvent) => {
      event.preventDefault()
      copyComponent()
    }
    const pasteEvent = (event: KeyboardEvent) => {
      event.preventDefault()
      pasteComponent()
    }
    hotkeys('ctrl+c, command+c', copyEvent)

    hotkeys('ctrl+v, command+v', pasteEvent)

    return () => {
      hotkeys.unbind('ctrl+c, command+c', copyEvent)
      hotkeys.unbind('ctrl+v, command+v', pasteEvent)
    }
  })
}
