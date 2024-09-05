import { useMemo } from 'react'
import type { DesignPanelSectionComponent } from './sections/components/section'
import { SizeSection } from './sections/size-section'
import { ComponentType } from './types'
import { LayoutSection } from './sections/layout-section'
import { BorderSection } from './sections/border-section'
import { StyleSection } from './sections/style-section'
import { SpacingSection } from './sections/spacing-section'
import { TypographySection } from './sections/typography-section'

export const useDesignPanels = () => {
  const panels: Record<ComponentType, DesignPanelSectionComponent[]> = useMemo(
    () => ({
      [ComponentType.Frame]: [
        LayoutSection,
        SizeSection,
        BorderSection,
        SpacingSection,
        StyleSection,
      ],
      [ComponentType.Text]: [
        SizeSection,
        SpacingSection,
        StyleSection,
        TypographySection,
      ],
      [ComponentType.Shape]: [
        LayoutSection,
        SizeSection,
        BorderSection,
        SpacingSection,
        StyleSection,
      ],
    }),
    [],
  )

  return panels
}
