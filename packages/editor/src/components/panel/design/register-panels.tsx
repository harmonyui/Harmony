import { useMemo } from 'react'
import type { DesignPanelSectionComponent } from './sections/components/section'
import { SizeSection } from './sections/size-section'
import { ComponentType } from '../../attributes/types'
import { LayoutSection } from './sections/layout-section'
import { BorderSection } from './sections/border-section'
import { StyleSection } from './sections/style-section'
import { SpacingSection } from './sections/spacing-section'
import { TypographySection } from './sections/typography-section'
import { PropertySection } from './sections/property-section'

export const useDesignPanels = () => {
  const panels: Record<ComponentType, DesignPanelSectionComponent[]> = useMemo(
    () => ({
      [ComponentType.Frame]: [
        PropertySection,
        LayoutSection,
        SizeSection,
        BorderSection,
        SpacingSection,
        StyleSection,
      ],
      [ComponentType.Component]: [
        PropertySection,
        LayoutSection,
        SizeSection,
        BorderSection,
        SpacingSection,
        StyleSection,
      ],
      [ComponentType.Text]: [
        PropertySection,
        SizeSection,
        SpacingSection,
        StyleSection,
        TypographySection,
      ],
      [ComponentType.Shape]: [
        PropertySection,
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
