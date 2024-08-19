import { useMemo } from 'react'
import type { DesignPanelSectionComponent } from './sections/section'
import { SizeSection } from './sections/size-section'
import { ComponentType } from './types'

/** Register */

export const useDesignPanels = () => {
  const panels: Record<ComponentType, DesignPanelSectionComponent[]> = useMemo(
    () => ({
      [ComponentType.Frame]: [SizeSection],
      [ComponentType.Text]: [SizeSection],
      [ComponentType.Shape]: [SizeSection],
    }),
    [],
  )

  return panels
}

/** Types */
