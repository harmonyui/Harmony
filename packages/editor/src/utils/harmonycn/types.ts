export type CreateComponent = () => Omit<
  CreatedComponent,
  'componentId' | 'childIndex'
>
export type HarmonyCn = string
export interface CreatedComponent {
  componentId: string
  childIndex: number
  element: HTMLElement
  type: HarmonyCn
  options?: Record<string, unknown>
}
