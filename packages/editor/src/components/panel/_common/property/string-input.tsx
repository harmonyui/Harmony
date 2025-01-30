import { DesignInput } from '../../design/sections/components/design-input'
import type { PropertyInputComponent } from './types'

export const StringInput: PropertyInputComponent<string> = ({
  value,
  onChange,
}) => {
  return (
    <DesignInput className='col-span-2' value={value} onChange={onChange} />
  )
}
