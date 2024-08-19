import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { ColorAttribute } from './components/color-attribute'

export const BackgroundSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Background'>
      <ColorAttribute attribute='backgroundColor' />
    </Section>
  )
}
