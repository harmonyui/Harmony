import { useCallback } from 'react'
import { useHarmonyStore } from './state'
import { getVscodeLink } from '../utils/element-utils'
import { useHotKeys } from './hotkeys'

export const useOpenEditor = () => {
  const hoveredComponent = useHarmonyStore((store) => store.hoveredComponent)
  const localRootPath = useHarmonyStore((store) => store.localRootPath)

  const openEditor = useCallback(() => {
    if (!hoveredComponent || !localRootPath) return

    window
      .open(getVscodeLink(hoveredComponent, localRootPath), '_blank')
      ?.focus()
  }, [hoveredComponent, localRootPath])

  return {
    openEditor,
    isActive: Boolean(localRootPath) && Boolean(hoveredComponent),
  }
}

export const useHotKeyOpenEditor = () => {
  const { openEditor } = useOpenEditor()

  useHotKeys('ctrl+shift+.,cmd+shift+.', () => {
    openEditor()
  })
}
