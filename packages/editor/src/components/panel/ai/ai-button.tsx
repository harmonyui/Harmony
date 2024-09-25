import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { SparklesIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHarmonyStore } from '../../hooks/state'

interface AIButtonState {
  onAI?: () => void
  icon: IconComponent
  active: boolean
}
export const useAIButton = (): AIButtonState => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { setShow, show } = useHarmonyPanel(Panels.AI)

  const onAIClick = useEffectEvent(() => {
    setShow(!show)
  })

  return {
    onAI: isDemo ? undefined : onAIClick,
    icon: SparklesIcon,
    active: show,
  }
}
