import React, { useEffect, useState, type PropsWithChildren } from 'react'
import type { PolymorphicComponentProps } from '@harmony/util/src/types/polymorphics'
import type { AllOrNothing } from '@harmony/util/src/types/utils'
import { getClass } from '@harmony/util/src/utils/common'
import { Button } from './button'
import { ChevronDownIcon, type IconComponent } from './icons'
import { CheckboxInput } from './input'
import { Popover } from './popover'

export type ListBoxPopoverProps<T> = {
  items: DropdownItem<T>[]
  className?: string
  header?: React.ReactNode
  children: React.ReactNode
  container?: HTMLElement
} & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
export const ListBoxPopover = React.forwardRef(
  <T,>(
    {
      items,
      className = '',
      header,
      children,
      container,
      ...isOpenStuff
    }: ListBoxPopoverProps<T>,
    ref: React.Ref<HTMLDivElement>,
  ): React.JSX.Element => {
    return (
      <Popover
        className='bg-white dark:bg-black border rounded-lg max-h-52'
        button={children}
        buttonClass={className}
        container={container}
        ref={ref}
        {...isOpenStuff}
      >
        {header ? <div className='p-2'>{header}</div> : null}
        <div className='min-w-[11rem]'>
          <ul
            aria-labelledby='dropdownDefaultButton'
            className='text-sm text-gray-700 dark:text-gray-200'
          >
            {items.map((item, i) => (
              <li key={i}>{item.name}</li>
            ))}
          </ul>
        </div>
      </Popover>
    )
  },
) as <T>(
  props: ListBoxPopoverProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.JSX.Element

export type ListBoxProps<T> = ListBoxPopoverProps<T> & {
  mode?: 'primary' | 'secondary' | 'none'
  buttonClass?: string
}
export const ListBox = <T,>({
  items,
  className,
  buttonClass,
  children,
  mode,
  header,
  container,
  ...isOpenStuff
}: ListBoxProps<T>): React.JSX.Element => {
  const button = (
    <Button className={buttonClass} mode={mode}>
      <div className='flex items-center w-full'>{children}</div>
    </Button>
  )
  return (
    <ListBoxPopover
      className={className}
      header={header}
      items={items}
      container={container}
      {...isOpenStuff}
    >
      {button}
    </ListBoxPopover>
  )
}

export interface DropdownItem<T> {
  name: React.ReactNode
  id: T
  className?: string
}
export type ItemAction<T> = (item: DropdownItem<T>, index: number) => void
interface DropdownProps<T> extends PropsWithChildren {
  items: DropdownItem<T>[]
  initialValue?: T
  className?: string
  buttonClass?: string
  chevron?: boolean
  onChange?: ItemAction<T>
  beforeIcon?: IconComponent
  showValue?: boolean
  mode?: 'primary' | 'secondary' | 'none'
  container?: HTMLElement
}

export const Dropdown = <T,>({
  children,
  initialValue,
  onChange,
  items,
  chevron = true,
  className,
  buttonClass,
  beforeIcon,
  showValue = true,
  mode = 'secondary',
  container,
}: DropdownProps<T>): React.JSX.Element => {
  const [value, setValue] = useState<DropdownItem<T> | undefined>(
    items.find((x) => x.id === initialValue),
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setValue(items.find((x) => x.id === initialValue))
  }, [initialValue, items])

  const onClick = (item: DropdownItem<T>, index: number): void => {
    setValue(item)
    onChange && onChange(item, index)
    setIsOpen(false)
  }

  const dropdownItems: DropdownItem<T>[] = items.map((item, i) => ({
    ...item,
    name: (
      <DropdownLineItem
        onClick={() => {
          onClick(item, i)
        }}
        selected={initialValue !== undefined && item === value}
        className={item.className}
      >
        {item.name}
      </DropdownLineItem>
    ),
  }))

  const BeforeIcon = beforeIcon
  return (
    <ListBox
      className={className}
      buttonClass={buttonClass}
      isOpen={isOpen}
      items={dropdownItems}
      mode={mode}
      setIsOpen={setIsOpen}
      container={container}
    >
      {BeforeIcon ? <BeforeIcon className='w-4 h-4 mr-1' /> : null}
      <div className='flex w-full justify-between items-center'>
        {value === undefined || !showValue ? children : value.name}{' '}
        {chevron ? <ChevronDownIcon className='w-4 h-4 ml-1' /> : null}
      </div>
    </ListBox>
  )
}

export interface DropdownLineItemProps {
  selected?: boolean
  children: React.ReactNode
  className?: string
}
export const DropdownLineItem = <C extends React.ElementType>({
  selected,
  children,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<C, DropdownLineItemProps>) => {
  const Component = as || 'button'
  const restProps = Component === 'button' ? { type: 'button', ...rest } : rest
  return (
    <Component
      {...restProps}
      className={getClass(
        selected
          ? 'bg-gray-200 dark:bg-accent text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-accent'
          : 'text-popover-foreground hover:bg-gray-100 dark:hover:bg-accent',
        className,
        'group text-left flex w-full items-center rounded-md text-sm cursor-pointer [&>*]:flex-1 relative select-none px-8 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      )}
    >
      {children}
    </Component>
  )
}

export interface ListItem {
  label: React.ReactNode
  value: boolean
}

type ListItemProps<T> = (
  | Omit<DropdownIconProps<T>, 'items'>
  | Omit<DropdownProps<T>, 'items'>
) & {
  items: ListItem[]
  setItems: (items: ListItem[]) => void
}

export const DropdownList = <T,>({
  items,
  setItems,
  ...rest
}: ListItemProps<T>): React.JSX.Element => {
  const copy = items.slice()
  const onSelect = (item: ListItem): void => {
    item.value = !item.value
    setItems(copy)
  }
  const dropdownItems = copy.map((item) => ({
    name: <DropdownListItem item={item} />,
    id: undefined,
  }))
  return 'icon' in rest ? (
    <DropdownIcon
      items={dropdownItems}
      {...rest}
      onChange={(item, index) => {
        onSelect(items[index])
      }}
    />
  ) : (
    <Dropdown
      items={dropdownItems}
      {...rest}
      onChange={(item, index) => {
        onSelect(items[index])
      }}
    />
  )
}

export interface DropdownListItemProps {
  item: ListItem
}
export const DropdownListItem: React.FunctionComponent<
  DropdownListItemProps
> = ({ item }) => {
  return (
    <span className='flex items-center text-sm font-medium'>
      <CheckboxInput className='mr-1' value={item.value} />
      {item.label}
    </span>
  )
}

type DropdownIconProps<T> = Omit<DropdownProps<T>, 'chevron'> & {
  icon: IconComponent
  simple?: boolean
}
export const DropdownIcon = <T,>({
  icon,
  className,
  mode,
  ...rest
}: DropdownIconProps<T>): React.JSX.Element => {
  const Icon = icon
  const _class =
    mode === 'none'
      ? className
      : getClass(
          'hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5',
          className,
        )
  return (
    <Dropdown
      className={_class}
      {...rest}
      mode={mode}
      chevron={false}
      showValue={false}
    >
      <Icon className='h-5 w-5' />
    </Dropdown>
  )
}
