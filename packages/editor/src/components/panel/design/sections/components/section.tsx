import { Accordion } from '@harmony/ui/src/components/core/accordion'

export type DesignPanelSectionComponent = React.FunctionComponent

interface SectionProps {
  children: React.ReactNode
  label: string
}
export const Section: React.FunctionComponent<SectionProps> = ({
  children,
  label,
}) => {
  return (
    <Accordion
      className='hw-w-full'
      items={[{ id: label, label, content: children }]}
    />
  )
}
