import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface PanelState {
  active: boolean
  pos: { x: number; y: number }
}

interface HarmonyPanelState {
  panels: Record<string, PanelState>
  registerPanel: (id: string, defaultActive?: boolean) => void
  setPanel: (id: string, state: Partial<PanelState>) => void
  toggleAllActive: () => void
}
const HarmonyPanelContext = createContext<HarmonyPanelState | undefined>(
  undefined,
)

export const HarmonyPanelProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = memo(({ children }) => {
  const [panels, setPanels] = useState<Record<string, PanelState>>({})
  const [previousPanels, setPreviousPanels] = useState<typeof panels | null>(
    null,
  )

  const setPanel = useCallback(
    (id: string, state: Partial<PanelState>) => {
      setPanels((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...state },
      }))
    },
    [setPanels],
  )

  const registerPanel = useCallback(
    (id: string, defaultActive = false) => {
      setPanel(id, { active: defaultActive, pos: { x: 0, y: 0 } })
    },
    [setPanel],
  )

  // Turn off all panels or turn on all the panels that were on before
  const toggleAllActive = useEffectEvent(() => {
    setPanels((prev) => {
      const active = !Object.values(prev).some((panel) => panel.active)

      if (active) {
        return previousPanels ?? prev
      }

      setPreviousPanels(prev)
      return Object.keys(prev).reduce<Record<string, PanelState>>((acc, id) => {
        acc[id] = { active: false, pos: prev[id].pos }
        return acc
      }, {})
    })
  })

  return (
    <HarmonyPanelContext.Provider
      value={{ panels, registerPanel, setPanel, toggleAllActive }}
    >
      {children}
    </HarmonyPanelContext.Provider>
  )
})

interface HarmonyPanelOptions {
  id: string
  defaultActive?: boolean
}
export const useHarmonyPanel = (id: string) => {
  const context = useContext(HarmonyPanelContext)

  const active = useMemo(() => {
    if (!context) {
      return false
    }

    return (
      (context.panels[id] as HarmonyPanelState['panels'][string] | undefined)
        ?.active ?? false
    )
  }, [context?.panels, id])

  const setShow = useCallback(
    (_active: boolean) => {
      if (!context) return

      context.setPanel(id, { active: _active })
    },
    [context?.setPanel, id],
  )

  const pos = useMemo(
    () => context?.panels[id]?.pos ?? { x: 0, y: 0 },
    [context?.panels, id],
  )

  const setPos = useCallback(
    (_pos: { x: number; y: number }) => {
      if (!context) return

      context.setPanel(id, { pos: _pos })
    },
    [context?.setPanel, id],
  )

  if (!context) {
    throw new Error('useHarmonyPanel must be used within a PanelProvider')
  }

  return { show: active, setShow, pos, setPos }
}

export const useRegisterHarmonyPanel = ({
  id,
  defaultActive,
}: HarmonyPanelOptions) => {
  const context = useContext(HarmonyPanelContext)

  useEffect(() => {
    if (!context) {
      return
    }

    if (
      (context.panels[id] as
        | HarmonyPanelState['panels'][string]
        | undefined) === undefined
    ) {
      context.registerPanel(id, defaultActive)
    }
  }, [id, defaultActive])

  return useHarmonyPanel(id)
}

export const useSetHarmonyPanels = () => {
  const context = useContext(HarmonyPanelContext)

  if (!context) {
    throw new Error('useSetHarmonyPanels must be used within a PanelProvider')
  }

  return context.toggleAllActive
}
