import { useMemo } from 'react'
import type { DesignPanelSectionComponent } from './sections/components/section'
import { SizeSection } from './sections/size-section'
import { ComponentType } from './types'
import { LayoutSection } from './sections/layout-section'
import { BorderSection } from './sections/border-section'
import { BackgroundSection } from './sections/background-section'

export const useDesignPanels = () => {
  const panels: Record<ComponentType, DesignPanelSectionComponent[]> = useMemo(
    () => ({
      [ComponentType.Frame]: [
        SizeSection,
        LayoutSection,
        BorderSection,
        BackgroundSection,
      ],
      [ComponentType.Text]: [SizeSection],
      [ComponentType.Shape]: [SizeSection],
    }),
    [],
  )

  return panels
}
