'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { getClass } from '@harmony/util/src/utils/common'
import type { AllOrNothing } from '@harmony/util/src/types/utils'

const PopoverBase = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    container?: HTMLElement
  }
>(
  (
    { className, align = 'center', sideOffset = 4, container, ...props },
    ref,
  ) => (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={getClass(
          'hw-overflow-auto hw-border hw-border-gray-300 hw-rounded-md hw-shadow-lg hw-mt-2 hw-z-10 hw-bg-white hw-text-popover-foreground hw-outline-none data-[state=open]:hw-animate-in data-[state=closed]:hw-animate-out data-[state=closed]:hw-fade-out-0 data-[state=open]:hw-fade-in-0 data-[state=closed]:hw-zoom-out-95 data-[state=open]:hw-zoom-in-95 data-[side=bottom]:hw-slide-in-from-top-2 data-[side=left]:hw-slide-in-from-right-2 data-[side=right]:hw-slide-in-from-left-2 data-[side=top]:hw-slide-in-from-bottom-2',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

type PopoverProps = React.PropsWithChildren<
  {
    button: React.ReactNode
    buttonClass?: string
    className?: string
    container?: HTMLElement
  } & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
>
export const Popover: React.FunctionComponent<PopoverProps> = ({
  button,
  buttonClass,
  className,
  children,
  container,
  ...isOpenStuff
}) => {
  return (
    <PopoverBase open={isOpenStuff.isOpen} onOpenChange={isOpenStuff.setIsOpen}>
      <PopoverTrigger asChild>
        <div className={buttonClass}>{button}</div>
      </PopoverTrigger>
      <PopoverContent
        className={getClass(className, 'hw-z-[10000]')}
        container={container}
      >
        {children}
      </PopoverContent>
    </PopoverBase>
  )
}
