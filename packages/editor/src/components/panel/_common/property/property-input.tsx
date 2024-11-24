import type {
  PropertyInputComponent,
  PropertyInputProps,
  PropertyInputType,
} from './types'
import { ImageInput } from './image-input'
import { StringInput } from './string-input'

export const PropertyInput = <T,>({
  value,
  onChange,
  type,
}: PropertyInputProps<T>): JSX.Element => {
  const InputComponent = propertyInputs[type]
  return <InputComponent value={value} onChange={onChange} />
}

const propertyInputs: Record<PropertyInputType, PropertyInputComponent> = {
  image: ImageInput,
  string: StringInput,
}
