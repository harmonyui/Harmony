import type { ComponentState } from './component-state'
import { createHarmonySlice } from './factory'

export interface CopiedComponent {
  element: HTMLElement
  componentId: string
  childIndex: number
}
export interface CopyPasteComponentState {
  copiedComponent: CopiedComponent | null
  setCopiedComponent: (copiedComponent: CopiedComponent) => void
}
export const createCopyPasteComponentSlice = createHarmonySlice<
  CopyPasteComponentState,
  ComponentState
>((set) => {
  return {
    copiedComponent: null,
    setCopiedComponent(copiedComponent) {
      set({ copiedComponent })
    },
  }
})
