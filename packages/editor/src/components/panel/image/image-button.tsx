import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { PhotoIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHarmonyStore } from '../../../hooks/state'

interface ImageButtonState {
  onImage?: (show?: boolean) => void
  icon: IconComponent
  active: boolean
}
export const useImageButton = (): ImageButtonState => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { setShow, show } = useHarmonyPanel(Panels.Image)

  const onImageClick = useEffectEvent((_show?: boolean) => {
    setShow(_show ?? !show)
  })

  return {
    onImage: isDemo ? undefined : onImageClick,
    icon: PhotoIcon,
    active: show,
  }
}
