'use client'

import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { Command as CommandPrimitive } from 'cmdk'
import { getClass } from '@harmony/util/src/utils/common'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogContent } from './dialog'

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={getClass(
      'hw-flex hw-h-full hw-w-full hw-flex-col hw-overflow-hidden hw-rounded-md hw-bg-popover hw-text-popover-foreground',
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({
  children,
  container,
  ...props
}: DialogProps & { container?: HTMLElement }) => {
  return (
    <Dialog {...props}>
      <DialogContent
        className='hw-overflow-hidden hw-p-0'
        container={container}
      >
        <Command className='[&_[cmdk-group-heading]]:hw-px-2 [&_[cmdk-group-heading]]:hw-font-medium [&_[cmdk-group-heading]]:hw-text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:hw-pt-0 [&_[cmdk-group]]:hw-px-2 [&_[cmdk-input-wrapper]_svg]:hw-h-5 [&_[cmdk-input-wrapper]_svg]:hw-w-5 [&_[cmdk-input]]:hw-h-12 [&_[cmdk-item]]:hw-px-2 [&_[cmdk-item]]:hw-py-3 [&_[cmdk-item]_svg]:hw-h-5 [&_[cmdk-item]_svg]:hw-w-5'>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className='hw-flex hw-items-center hw-border-b hw-px-3'
    cmdk-input-wrapper=''
  >
    <MagnifyingGlassIcon className='hw-mr-2 hw-h-4 hw-w-4 hw-shrink-0 hw-opacity-50' />
    <CommandPrimitive.Input
      ref={ref}
      className={getClass(
        'hw-flex hw-h-10 hw-w-full hw-border-0 hw-rounded-md hw-bg-transparent hw-py-3 hw-text-sm hw-outline-none placeholder:hw-text-muted-foreground disabled:hw-cursor-not-allowed disabled:hw-opacity-50 focus:hw-ring-0',
        className,
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={getClass(
      'hw-max-h-[300px] hw-overflow-y-auto hw-overflow-x-hidden',
      className,
    )}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className='hw-py-6 hw-text-center hw-text-sm'
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={getClass(
      'hw-overflow-hidden hw-p-1 hw-text-foreground [&_[cmdk-group-heading]]:hw-px-2 [&_[cmdk-group-heading]]:hw-py-1.5 [&_[cmdk-group-heading]]:hw-text-xs [&_[cmdk-group-heading]]:hw-font-medium [&_[cmdk-group-heading]]:hw-text-muted-foreground',
      className,
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={getClass('-hw-mx-1 hw-h-px hw-bg-border', className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={getClass(
      'hw-relative hw-flex hw-cursor-default hw-gap-2 hw-select-none hw-items-center hw-rounded-sm hw-px-2 hw-py-1.5 hw-text-sm hw-outline-none data-[disabled=true]:hw-pointer-events-none data-[selected=true]:hw-bg-accent data-[selected=true]:hw-text-accent-foreground data-[disabled=true]:hw-opacity-50 [&_svg]:hw-pointer-events-none [&_svg]:hw-size-4 [&_svg]:hw-shrink-0',
      className,
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
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
CommandShortcut.displayName = 'CommandShortcut'

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
