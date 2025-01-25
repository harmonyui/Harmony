'use client'

import * as React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { getClass } from '@harmony/util/src/utils/common'
import { CheckCircleSolidIcon, CheckIcon, ChevronRightIcon } from './icons'

const ContextMenu = ContextMenuPrimitive.Root

const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuPortal = ContextMenuPrimitive.Portal

const ContextMenuSub = ContextMenuPrimitive.Sub

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={getClass(
      'hw-flex hw-cursor-default hw-select-none hw-items-center hw-rounded-sm hw-px-2 hw-py-1.5 hw-text-sm hw-outline-none focus:hw-bg-accent focus:hw-text-accent-foreground data-[state=open]:hw-bg-accent data-[state=open]:hw-text-accent-foreground',
      inset ? 'hw-pl-8' : '',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className='hw-ml-auto hw-h-4 hw-w-4' />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={getClass(
      'hw-z-[10000] hw-min-w-[8rem] hw-overflow-hidden hw-rounded-md hw-border hw-bg-white hw-p-1 hw-text-popover-foreground hw-shadow-md data-[state=open]:hw-animate-in data-[state=closed]:hw-animate-out data-[state=closed]:hw-fade-out-0 data-[state=open]:hw-fade-in-0 data-[state=closed]:hw-zoom-out-95 data-[state=open]:hw-zoom-in-95 data-[side=bottom]:hw-slide-in-from-top-2 data-[side=left]:hw-slide-in-from-right-2 data-[side=right]:hw-slide-in-from-left-2 data-[side=top]:hw-slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> & {
    container?: HTMLElement
  }
>(({ className, container, ...props }, ref) => (
  <ContextMenuPrimitive.Portal container={container}>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={getClass(
        'hw-z-[10000] hw-min-w-[8rem] hw-overflow-hidden hw-rounded-md hw-border hw-bg-white dark:hw-bg-black hw-p-1 hw-text-popover-foreground hw-shadow-md hw-animate-in hw-fade-in-80 data-[state=open]:hw-animate-in data-[state=closed]:hw-animate-out data-[state=closed]:hw-fade-out-0 data-[state=open]:hw-fade-in-0 data-[state=closed]:hw-zoom-out-95 data-[state=open]:hw-zoom-in-95 data-[side=bottom]:hw-slide-in-from-top-2 data-[side=left]:hw-slide-in-from-right-2 data-[side=right]:hw-slide-in-from-left-2 data-[side=top]:hw-slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={getClass(
      'hw-relative hw-flex hw-cursor-default hw-select-none hw-items-center hw-rounded-sm hw-px-2 hw-py-1.5 hw-text-sm hw-outline-none focus:hw-bg-accent focus:hw-text-accent-foreground data-[disabled]:hw-pointer-events-none data-[disabled]:hw-opacity-50',
      inset ? 'hw-pl-8' : '',
      className,
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={getClass(
      'hw-relative hw-flex hw-cursor-default hw-select-none hw-items-center hw-rounded-sm hw-py-1.5 hw-pl-8 hw-pr-2 hw-text-sm hw-outline-none focus:hw-bg-accent focus:hw-text-accent-foreground data-[disabled]:hw-pointer-events-none data-[disabled]:hw-opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className='hw-absolute hw-left-2 hw-flex hw-h-3.5 hw-w-3.5 hw-items-center hw-justify-center'>
      <ContextMenuPrimitive.ItemIndicator>
        <CheckIcon className='hw-h-4 hw-w-4' />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={getClass(
      'hw-relative hw-flex hw-cursor-default hw-select-none hw-items-center hw-rounded-sm hw-py-1.5 hw-pl-8 hw-pr-2 hw-text-sm hw-outline-none focus:hw-bg-accent focus:hw-text-accent-foreground data-[disabled]:hw-pointer-events-none data-[disabled]:hw-opacity-50',
      className,
    )}
    {...props}
  >
    <span className='hw-absolute hw-left-2 hw-flex hw-h-3.5 hw-w-3.5 hw-items-center hw-justify-center'>
      <ContextMenuPrimitive.ItemIndicator>
        <CheckCircleSolidIcon className='hw-h-2 hw-w-2 hw-fill-current' />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={getClass(
      'hw-px-2 hw-py-1.5 hw-text-sm hw-font-semibold hw-text-foreground',
      inset ? 'hw-pl-8' : '',
      className,
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={getClass('-hw-mx-1 hw-my-1 hw-h-px hw-bg-border', className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={getClass(
        'hw-ml-auto hw-text-xs hw-tracking-widest hw-text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = 'ContextMenuShortcut'

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
