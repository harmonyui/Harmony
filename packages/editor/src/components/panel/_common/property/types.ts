export type PropertyInputType = 'string' | 'image'
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
export type PropertyInputComponent<T = any> = React.FunctionComponent<
  Omit<PropertyInputProps<T>, 'type'>
>
export interface PropertyInputProps<T> {
  value: T
  onChange: (value: T) => void
  type: 'string' | 'image'
}
