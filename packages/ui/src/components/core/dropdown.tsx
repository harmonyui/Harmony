import React, { useEffect, useState, type PropsWithChildren } from "react";
import { Button } from "./button";
import { ChevronDownIcon, type IconComponent } from "./icons";
import { CheckboxInput } from "./input";
import { Popover } from "./popover";
import { PolymorphicComponentProps } from "../../types/polymorphics";
import { AllOrNothing } from "../../types/utils";
import { getClass } from "@harmony/util/src";

export type ListBoxPopoverProps<T> = {
  items: DropdownItem<T>[];
  className?: string;
  header?: React.ReactNode;
  container?: HTMLElement;
  children: React.ReactNode;
} & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>;
export const ListBoxPopover = <T,>({
  items,
  className = "",
  header,
  children,
  container,
  ...isOpenStuff
}: ListBoxPopoverProps<T>): JSX.Element => {
  return (
    <Popover button={children} className={className} container={container} {...isOpenStuff}>
      {header ? <div className="hw-p-2">{header}</div> : null}
      <div className="hw-min-w-[11rem]">
        <ul
          aria-labelledby="dropdownDefaultButton"
          className="hw-text-sm hw-text-gray-700 dark:hw-text-gray-200"
        >
          {items.map((item, i) => (
            <li key={i}>{item.name}</li>
          ))}
        </ul>
      </div>
    </Popover>
  );
};

export type ListBoxProps<T> = ListBoxPopoverProps<T> & {
  mode?: "primary" | "secondary" | "none";
  container?: HTMLElement;
};
export const ListBox = <T,>({
  items,
  className,
  children,
  mode,
  header,
  container,
  ...isOpenStuff
}: ListBoxProps<T>): JSX.Element => {
  const button = (
    <Button className={className} mode={mode}>
      <div className="hw-flex hw-items-center hw-w-full">{children}</div>
    </Button>
  );
  return (
    <ListBoxPopover header={header} items={items} container={container} {...isOpenStuff}>
      {button}
    </ListBoxPopover>
  );
};

export interface DropdownItem<T> {
  name: React.ReactNode;
  id: T;
}
export type ItemAction<T> = (item: DropdownItem<T>, index: number) => void;
interface DropdownProps<T> extends PropsWithChildren {
  items: DropdownItem<T>[];
  initialValue?: T;
  className?: string;
  chevron?: boolean;
  onChange?: ItemAction<T>;
	beforeIcon?: IconComponent;
  showValue?: boolean
  mode?: "primary" | "secondary" | "none";
  container?: HTMLElement
}

export const Dropdown = <T,>({
  children,
  initialValue,
  onChange,
  items,
  chevron = true,
  className,
	beforeIcon,
  showValue=true,
  container,
  mode='secondary'
}: DropdownProps<T>): JSX.Element => {
  const [value, setValue] = useState<DropdownItem<T> | undefined>(
    items.find((x) => x.id === initialValue),
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setValue(items.find((x) => x.id === initialValue));
  }, [initialValue, items]);

  const onClick = (item: DropdownItem<T>, index: number): void => {
    setValue(item);
    onChange && onChange(item, index);
    setIsOpen(false);
  };

  const dropdownItems: DropdownItem<T>[] = items.map((item, i) => ({
    ...item,
    name: (
      <DropdownLineItem
        onClick={() => {
          onClick(item, i);
        }}
        selected={initialValue !== undefined && item === value}
      >
        {item.name}
      </DropdownLineItem>
    ),
  }));

	const BeforeIcon = beforeIcon;
  return (
    <ListBox
      className={className}
      isOpen={isOpen}
      items={dropdownItems}
      mode={mode}
      setIsOpen={setIsOpen}
      container={container}
    >
			{BeforeIcon ? <BeforeIcon className="hw-w-4 hw-h-4 hw-mr-1"/> : null}
      <div className="hw-flex hw-w-full hw-justify-between hw-items-center">{value === undefined || !showValue ? children : value.name}{" "}
      {chevron ? <ChevronDownIcon className="hw-w-4 hw-h-4 hw-ml-1" /> : null}</div>
    </ListBox>
  );
};

export interface DropdownLineItemProps {
  selected?: boolean;
  children: React.ReactNode;
}
export const DropdownLineItem = <C extends React.ElementType>({ selected, children, as, ...rest }:  PolymorphicComponentProps<C, DropdownLineItemProps>) => {
  const Component = as || 'button';
	const restProps = Component === 'button' ? {type: 'button', ...rest} : rest;
	return (
    <Component
			{...restProps}
			className={`${
        selected ? "hw-bg-primary-light" : "hw-text-gray-900"
      } group hw-flex hw-w-full hw-items-center hw-rounded-md hw-p-2 hw-text-sm hw-cursor-pointer hover:hw-bg-gray-100 [&>*]:hw-flex-1`}
    >
      {children}
    </Component>
  );
};

export interface ListItem {
  label: React.ReactNode;
  value: boolean;
}

type ListItemProps<T> = (
  | Omit<DropdownIconProps<T>, "items">
  | Omit<DropdownProps<T>, "items">
) & {
  items: ListItem[];
  setItems: (items: ListItem[]) => void;
};

export const DropdownList = <T,>({
  items,
  setItems,
  ...rest
}: ListItemProps<T>): JSX.Element => {
  const copy = items.slice();
  const onSelect = (item: ListItem): void => {
    item.value = !item.value;
    setItems(copy);
  };
  const dropdownItems = copy.map((item) => ({
    name: <DropdownListItem item={item} />,
    id: undefined,
  }));
  return "icon" in rest ? (
    <DropdownIcon
      items={dropdownItems}
      {...rest}
      onChange={(item, index) => {
        onSelect(items[index]);
      }}
    />
  ) : (
    <Dropdown
      items={dropdownItems}
      {...rest}
      onChange={(item, index) => {
        onSelect(items[index]);
      }}
    />
  );
};

export interface DropdownListItemProps {
  item: ListItem;
}
export const DropdownListItem: React.FunctionComponent<
  DropdownListItemProps
> = ({ item }) => {
  return (
    <span className="hw-flex hw-items-center hw-text-sm hw-font-medium">
      <CheckboxInput className="hw-mr-1" value={item.value} />
      {item.label}
    </span>
  );
};

type DropdownIconProps<T> = Omit<DropdownProps<T>, "chevron"> & {
  icon: IconComponent;
  simple?: boolean;
};
export const DropdownIcon = <T,>({
  icon,
  className,
  mode,
  ...rest
}: DropdownIconProps<T>): JSX.Element => {
  const Icon = icon;
  const _class = mode === 'none' ? className : getClass('hover:hw-bg-gray-100 dark:hover:hw-bg-gray-700 focus:hw-ring-4 focus:hw-outline-none focus:hw-ring-gray-200 dark:focus:hw-ring-gray-700 hw-rounded-lg hw-text-sm hw-p-1.5', className);
  return (
    <Dropdown
      className={_class}
      {...rest}
      mode={mode}
      chevron={false}
      showValue={false}
    >
      <Icon className="hw-h-5 hw-w-5" />
    </Dropdown>
  );
};
