import type { Font } from '@harmony/util/src/fonts'
import type {
  BehaviorType,
  ComponentUpdate,
} from '@harmony/util/src/types/component'
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import type { Environment } from '@harmony/util/src/utils/component'
import { createContext, useContext } from 'react'

export const viewModes = [
  'designer',
  'preview',
  'preview-full',
  'designer-slim',
] as const
export type DisplayMode = (typeof viewModes)[number]
export type SelectMode = 'scope' | 'tweezer'
export type ComponentUpdateWithoutGlobal = Omit<ComponentUpdate, 'isGlobal'>

const noop = () => undefined

//const asyncnoop = async () => undefined;

interface HarmonyContextProps {
  isSaving: boolean
  setIsSaving: (isSaving: boolean) => void
  displayMode: DisplayMode
  changeMode: (mode: DisplayMode) => void
  fonts?: Font[]
  scale: number
  //onScaleChange: (scale: number, cursorPos: { x: number; y: number }) => void
  onClose: () => void
  error: string | undefined
  setError: (value: string | undefined) => void
  environment: Environment
  showGiveFeedback: boolean
  setShowGiveFeedback: (value: boolean) => void
  behaviors: BehaviorType[]
  setBehaviors: (value: BehaviorType[]) => void
  isGlobal: boolean
  setIsGlobal: (value: boolean) => void
  onAttributesChange: (
    updates: ComponentUpdateWithoutGlobal[],
    execute?: boolean,
  ) => void
  onTextChange: (
    value: string,
    oldValue: string,
    element: HTMLElement | undefined,
  ) => void
  onElementPropertyChange: (
    name: string,
    value: string,
    element: HTMLElement | undefined,
  ) => void
  onComponentPropertyChange: (
    value: UpdateProperty,
    oldValue: UpdateProperty,
    element: HTMLElement | undefined,
  ) => void
  onToggleInspector: () => void
  isToggled: boolean
}
export const HarmonyContext = createContext<HarmonyContextProps>({
  isSaving: false,
  setIsSaving: noop,
  displayMode: 'designer',
  changeMode: noop,
  scale: 1,
  //onScaleChange: noop,
  onClose: noop,
  error: undefined,
  setError: noop,
  environment: 'production',
  showGiveFeedback: false,
  setShowGiveFeedback: noop,
  behaviors: [],
  setBehaviors: noop,
  isGlobal: false,
  setIsGlobal: noop,
  onAttributesChange: noop,
  onTextChange: noop,
  onElementPropertyChange: noop,
  onComponentPropertyChange: noop,
  onToggleInspector: noop,
  isToggled: false,
})

export const useHarmonyContext = () => {
  const context = useContext(HarmonyContext)

  return context
}
