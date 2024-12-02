import type {
  ComponentProp,
  ComponentPropsType,
} from '@harmony/util/src/types/component'

export type PropertyInputType = ComponentPropsType
export type PropertyInputValues = ComponentProp['values']
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
export type PropertyInputComponent<T = any> = React.FunctionComponent<
  Omit<PropertyInputProps<T>, 'type'>
>
export interface PropertyInputProps<T> {
  value: T
  onChange: (value: T) => void
  values: PropertyInputValues
  type: PropertyInputType
}
