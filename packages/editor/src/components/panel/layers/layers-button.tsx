import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { StackIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyStore } from '../../hooks/state'
import { useSidePanel } from '../side-panel'
import { ComponentLayoutPanel } from './layout-panel'

interface LayersButtonState {
  onLayers: () => void
  icon: IconComponent
}
export const useLayersButton = (): LayersButtonState => {
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const { setPanel } = useSidePanel()

  const onLayoutClick = useEffectEvent(() => {
    setPanel({
      id: 'layout',
      content: <ComponentLayoutPanel selectedComponent={selectedComponent} />,
    })
  })

  return { onLayers: onLayoutClick, icon: StackIcon }
}
