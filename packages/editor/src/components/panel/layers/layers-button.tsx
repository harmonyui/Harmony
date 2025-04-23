import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { StackIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHarmonyStore } from '../../../hooks/state'
import { useHotKeys } from '../../../hooks/hotkeys'

interface LayersButtonState {
  onLayers?: () => void
  icon: IconComponent
  active: boolean
}
export const useLayersButton = (): LayersButtonState => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { setShow, show } = useHarmonyPanel(Panels.Layers)

  const onLayoutClick = useEffectEvent(() => {
    setShow(!show)
  })

  useHotKeys('L', onLayoutClick)

  return {
    onLayers: isDemo ? undefined : onLayoutClick,
    icon: StackIcon,
    active: show,
  }
}
