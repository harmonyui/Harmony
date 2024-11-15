import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { PaintBrushIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHarmonyStore } from '../../../hooks/state'

interface DesignButtonState {
  onDesign?: () => void
  icon: IconComponent
  active: boolean
}
export const useDesignButton = (): DesignButtonState => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { setShow, show } = useHarmonyPanel(Panels.Design)

  const onDesignClick = useEffectEvent(() => {
    setShow(!show)
  })

  return {
    onDesign: isDemo ? undefined : onDesignClick,
    icon: PaintBrushIcon,
    active: show,
  }
}
