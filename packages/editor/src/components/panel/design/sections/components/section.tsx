import { Card, CardProps } from '../../../_common/panel/card'

export type DesignPanelSectionComponent = React.FunctionComponent

type SectionProps<T> = Omit<CardProps<T>, 'lable'> & {
  label: string
}
export const Section = <T,>(props: SectionProps<T>): React.JSX.Element => {
  return (
    <Card
      {...props}
      container={document.getElementById('harmony-container') ?? undefined}
    />
  )
}
