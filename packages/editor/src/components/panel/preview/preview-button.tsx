import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { MonitorPlayIcon } from '@harmony/ui/src/components/core/icons'
import { Button } from '@harmony/ui/src/components/core/button'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useSetHarmonyPanels } from '../_common/panel/panel'
import { useHarmonyContext } from '../../harmony-context'
import { useOnChange } from '@harmony/ui/src/hooks/on-change'

interface PreviewButtonState {
  onPreview: () => void
  icon: IconComponent
  active: boolean
}
export const usePreviewButton = (): PreviewButtonState => {
  const { isAllActive, setIsAllActive } = useSetHarmonyPanels()
  const { onToggleInspector, isToggled } = useHarmonyContext()
  useOnChange(isToggled, (_, current) => {
    setIsAllActive(current)
  })

  const onPreview = useEffectEvent(() => {
    onToggleInspector()
  })

  return { onPreview, icon: MonitorPlayIcon, active: !isAllActive }
}

export const PreviewButton: React.FunctionComponent = () => {
  const { onPreview, icon: Icon } = usePreviewButton()

  return (
    <Button
      className='hover:hw-bg-[#E5E7EB] hw-h-7 hw-px-2.5 hw-rounded-md'
      onClick={onPreview}
      mode='none'
    >
      <Icon className='hw-h-5 hw-w-5' />
    </Button>
  )
}
