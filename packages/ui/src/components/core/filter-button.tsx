import { useState } from 'react'
import { useChangeArray } from '../../hooks/change-property'
import { Button } from './button'
import type { DropdownItem } from './dropdown'
import { ListBox, DropdownListItem } from './dropdown'
import { Header } from './header'
import { FilterIcon } from './icons'

type Deconstruct<T> = {
  [K in keyof T]: { id: K; value: T[K] | undefined; defaultValue: T[K] }
}[keyof T]

export type FilterItem<T> = Deconstruct<T> & {
  label: string
}
export type FilterChildren<T> = (
  item: FilterItem<T>,
  changeItem: <R extends keyof T>(value: T[R]) => void,
) => React.ReactNode
export interface FilterButtonProps<T> {
  items: FilterItem<T>[]
  onChange: (items: FilterItem<T>[]) => void
  children: FilterChildren<T>
}
export const FilterButton = <T,>({
  items: initialItems,
  onChange,
  children,
}: FilterButtonProps<T>): JSX.Element => {
  const [items, setItems] = useState(initialItems)
  const changeItems = useChangeArray(setItems)
  const [isOpen, setIsOpen] = useState(false)

  const onSelect = (item: FilterItem<T>, value: boolean): void => {
    const index = items.findIndex((toFind) => toFind.id === item.id)
    changeItems(items, index, 'value', value ? item.defaultValue : undefined)
  }

  const onClear = (): void => {
    const copy = items.map((item) => ({ ...item, value: undefined }))
    setItems(copy)
  }

  const onDone = (): void => {
    onChange(items)
    setIsOpen(false)
  }

  const onOpen = (value: boolean): void => {
    //This is to 'cancel' their selection if they close the popup
    if (!value) {
      setItems(initialItems)
    }
    setIsOpen(value)
  }

  const dropdownItems: DropdownItem<number>[] = items.map((item, i) => ({
    id: i,
    name: (
      <FilterButtonItem
        item={item}
        onChange={(value) => {
          onSelect(item, value)
        }}
      >
        {children(item, (value) => changeItems(items, i, 'value', value))}
      </FilterButtonItem>
    ),
  }))
  const header = (
    <div className='hw-flex hw-justify-between hw-items-center'>
      <Button className='hw-h-fit' mode='secondary' onClick={onClear}>
        Clear
      </Button>
      <Header level={4}>Filters</Header>
      <Button className='hw-h-fit' mode='primary' onClick={onDone}>
        Done
      </Button>
    </div>
  )
  const hasFilter = initialItems.some((item) => item.value !== undefined)
  return (
    <ListBox
      header={header}
      isOpen={isOpen}
      items={dropdownItems}
      mode={hasFilter ? 'primary' : 'secondary'}
      setIsOpen={onOpen}
    >
      <FilterIcon className='hw-w-3 hw-h-3 hw-mr-1' /> Filters
    </ListBox>
  )
}

interface FilterButtonItemProps<T> {
  item: FilterItem<T>
  onChange: (value: boolean) => void
  children: React.ReactNode
}
const FilterButtonItem = <T,>({
  item,
  onChange,
  children,
}: FilterButtonItemProps<T>): JSX.Element => {
  const isSelected = item.value !== undefined
  const dropdownItem = { ...item, value: isSelected }
  return (
    <>
      <button
        className='hw-p-2 hw-w-full hw-border-b'
        onClick={() => {
          onChange(!isSelected)
        }}
        type='button'
      >
        <DropdownListItem item={dropdownItem} />
      </button>
      <div
        className={`${
          isSelected ? 'hw-max-h-96' : 'hw-max-h-0'
        } hw-overflow-hidden hw-transition-[max-height] hw-bg-gray-50`}
      >
        <div className='hw-p-2'>{children}</div>
      </div>
    </>
  )
}
