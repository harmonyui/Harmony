import type { HarmonyCn } from '@harmony/util/src/harmonycn/types'

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
