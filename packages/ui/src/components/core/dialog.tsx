'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { getClass } from '@harmony/util/src/utils/common'
import { XMarkIcon } from './icons'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={getClass(
      'hw-fixed hw-inset-0 hw-z-50 hw-bg-black/80  data-[state=open]:hw-animate-in data-[state=closed]:hw-animate-out data-[state=closed]:hw-fade-out-0 data-[state=open]:hw-fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    container?: HTMLElement
  }
>(({ className, children, container, ...props }, ref) => (
  <DialogPortal container={container}>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={getClass(
        'hw-fixed hw-left-[50%] hw-top-[50%] hw-z-[10000] hw-grid hw-w-full hw-max-w-lg hw-translate-x-[-50%] hw-translate-y-[-50%] hw-gap-4 hw-border hw-bg-background hw-p-6 hw-shadow-lg hw-duration-200 data-[state=open]:hw-animate-in data-[state=closed]:hw-animate-out data-[state=closed]:hw-fade-out-0 data-[state=open]:hw-fade-in-0 data-[state=closed]:hw-zoom-out-95 data-[state=open]:hw-zoom-in-95 data-[state=closed]:hw-slide-out-to-left-1/2 data-[state=closed]:hw-slide-out-to-top-[48%] data-[state=open]:hw-slide-in-from-left-1/2 data-[state=open]:hw-slide-in-from-top-[48%] sm:hw-rounded-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className='hw-absolute hw-right-4 hw-top-4 hw-rounded-sm hw-opacity-70 hw-ring-offset-background hw-transition-opacity hover:hw-opacity-100 focus:hw-outline-none focus:hw-ring-2 focus:hw-ring-ring focus:hw-ring-offset-2 disabled:hw-pointer-events-none data-[state=open]:hw-bg-accent data-[state=open]:hw-text-muted-foreground'>
        <XMarkIcon className='hw-h-4 hw-w-4' />
        <span className='hw-sr-only'>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={getClass(
      'hw-flex hw-flex-col hw-space-y-1.5 hw-text-center sm:hw-text-left',
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={getClass(
      'hw-flex hw-flex-col-reverse sm:hw-flex-row sm:hw-justify-end sm:hw-space-x-2',
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={getClass(
      'hw-text-lg hw-font-semibold hw-leading-none hw-tracking-tight',
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={getClass('hw-text-sm hw-text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
