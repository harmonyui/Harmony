import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { StackIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'

interface LayersButtonState {
  onLayers: () => void
  icon: IconComponent
}
export const useLayersButton = (): LayersButtonState => {
  const { setShow, show } = useHarmonyPanel(Panels.Layers)

  const onLayoutClick = useEffectEvent(() => {
    setShow(!show)
  })

  return { onLayers: onLayoutClick, icon: StackIcon }
}
