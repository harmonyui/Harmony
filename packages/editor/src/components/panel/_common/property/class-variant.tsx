import { useMemo } from 'react'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import type { PropertyInputComponent } from './types'

export const ClassVariantInput: PropertyInputComponent<string> = ({
  value,
  onChange,
  values,
}) => {
  const items: DropdownItem<string>[] = useMemo(
    () =>
      Object.entries(values).map<DropdownItem<string>>(([name]) => ({
        id: name,
        name,
      })),
    [values],
  )

  return (
    <Dropdown
      className='col-span-2 w-full'
      items={items}
      initialValue={value}
      onChange={(item) => onChange(item.id)}
      container={document.getElementById('harmony-container') ?? undefined}
    />
  )
}
