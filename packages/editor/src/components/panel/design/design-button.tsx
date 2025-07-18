import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { PaintBrushIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHotKeys } from '../../../hooks/hotkeys'

interface DesignButtonState {
  onDesign?: () => void
  icon: IconComponent
  active: boolean
}
export const useDesignButton = (): DesignButtonState => {
  const { setShow, show } = useHarmonyPanel(Panels.Design)

  const onDesignClick = useEffectEvent(() => {
    setShow(!show)
  })

  useHotKeys('D', onDesignClick)

  return {
    onDesign: onDesignClick,
    icon: PaintBrushIcon,
    active: show,
  }
}
