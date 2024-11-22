import { Card } from '../../../_common/panel/card'

export type DesignPanelSectionComponent = React.FunctionComponent

interface SectionProps {
  children: React.ReactNode
  label: string
}
export const Section: React.FunctionComponent<SectionProps> = ({
  children,
  label,
}) => {
  return <Card label={label}>{children}</Card>
}
