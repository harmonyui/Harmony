import { useCallback } from 'react'
import { useHarmonyStore } from './state'
import { getVscodeLink } from '../utils/element-utils'
import { useHotKeys } from './hotkeys'

export const useOpenEditor = () => {
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const localRootPath = useHarmonyStore((store) => store.localRootPath)

  const openEditor = useCallback(() => {
    if (!selectedComponent || !localRootPath) return

    window
      .open(getVscodeLink(selectedComponent.element, localRootPath), '_blank')
      ?.focus()
  }, [selectedComponent, localRootPath])

  return {
    openEditor,
    isActive: Boolean(localRootPath) && Boolean(selectedComponent),
  }
}

export const useHotKeyOpenEditor = () => {
  const { openEditor } = useOpenEditor()

  useHotKeys('ctrl+shift+.,cmd+shift+.', () => {
    openEditor()
  })
}
