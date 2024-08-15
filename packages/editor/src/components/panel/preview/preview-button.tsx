import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { MonitorPlayIcon } from '@harmony/ui/src/components/core/icons'
import { useCallback } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { useHarmonyContext } from '../../harmony-context'

interface PreviewButtonState {
  onPreview: () => void
  icon: IconComponent
}
export const usePreviewButton = (): PreviewButtonState => {
  const { changeMode } = useHarmonyContext()

  const onPreview = useCallback(() => {
    changeMode('preview')
  }, [])

  return { onPreview, icon: MonitorPlayIcon }
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
