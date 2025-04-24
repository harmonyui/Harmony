import {
  LogsIcon,
  type IconComponent,
} from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyPanel } from '../_common/panel/panel'
import { Panels } from '../_common/panel/types'
import { useHotKeys } from '../../../hooks/hotkeys'

interface VersionsButtonState {
  onVersions?: () => void
  icon: IconComponent
  active: boolean
}
export const useVersionsButton = (): VersionsButtonState => {
  const { setShow, show } = useHarmonyPanel(Panels.Versions)

  const onVersionsClick = useEffectEvent(() => {
    setShow(!show)
  })

  useHotKeys('V', onVersionsClick)

  return {
    onVersions: onVersionsClick,
    icon: LogsIcon,
    active: show,
  }
}
