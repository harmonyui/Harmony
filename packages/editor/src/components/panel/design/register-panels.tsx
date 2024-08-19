import { useMemo } from 'react'
import type { DesignPanelSectionComponent } from './sections/components/section'
import { SizeSection } from './sections/size-section'
import { ComponentType } from './types'
import { LayoutSection } from './sections/layout-section'
import { BorderSection } from './sections/border-section'
import { BackgroundSection } from './sections/background-section'
import { SpacingSection } from './sections/spacing-section'
import { TypographySection } from './sections/typography-section'

export const useDesignPanels = () => {
  const panels: Record<ComponentType, DesignPanelSectionComponent[]> = useMemo(
    () => ({
      [ComponentType.Frame]: [
        SizeSection,
        LayoutSection,
        SpacingSection,
        BorderSection,
        BackgroundSection,
      ],
      [ComponentType.Text]: [
        SizeSection,
        SpacingSection,
        TypographySection,
        BackgroundSection,
      ],
      [ComponentType.Shape]: [
        SizeSection,
        LayoutSection,
        SpacingSection,
        BorderSection,
        BackgroundSection,
      ],
    }),
    [],
  )

  return panels
}
