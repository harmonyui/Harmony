import type {
  PropertyInputComponent,
  PropertyInputProps,
  PropertyInputType,
} from './types'
import { ImageInput } from './image-input'
import { StringInput } from './string-input'
import { ClassVariantInput } from './class-variant'

export const PropertyInput = <T,>({
  value,
  onChange,
  type,
  values,
}: PropertyInputProps<T>): JSX.Element => {
  const InputComponent = propertyInputs[type]
  return <InputComponent value={value} onChange={onChange} values={values} />
}

const propertyInputs: Record<PropertyInputType, PropertyInputComponent> = {
  image: ImageInput,
  string: StringInput,
  classVariant: ClassVariantInput,
  number: StringInput,
}
