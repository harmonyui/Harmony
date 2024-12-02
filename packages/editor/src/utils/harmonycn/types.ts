import type { HarmonyCn, RegistryItem } from '@harmony/util/src/harmonycn/types'

export type CreateComponent = () => Omit<
  CreatedComponent,
  'componentId' | 'childIndex'
>

export interface CreatedComponent {
  componentId: string
  childIndex: number
  element: HTMLElement
  type?: HarmonyCn
  options?: Record<string, unknown>
}

export type RegistryComponent = RegistryItem & {
  component: React.FunctionComponent
  defaultProps: Record<string, unknown>
}
