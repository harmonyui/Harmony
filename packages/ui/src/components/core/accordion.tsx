'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { getClass } from '@harmony/util/src/utils/common'
import { ChevronDownIcon } from './icons'

const AccordionRoot = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={getClass('hw-border-b', className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className='flex'>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={getClass(
        'hw-flex hw-flex-1 hw-items-center hw-justify-between hw-py-4 hw-font-medium hw-transition-all hover:hw-underline [&[data-state=open]>svg]:hw-rotate-180 hw-w-full',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className='hw-h-4 hw-w-4 hw-shrink-0 hw-transition-transform hw-duration-200' />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className='hw-overflow-hidden hw-text-sm hw-transition-all data-[state=closed]:hw-animate-accordion-up data-[state=open]:hw-animate-accordion-down'
    {...props}
  >
    <div className={getClass('hw-pb-4 hw-pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export interface AccordionItem {
  id: string
  label: string
  content: React.ReactNode
}
interface AccordionProps {
  className?: string
  items: AccordionItem[]
}
export const Accordion: React.FunctionComponent<AccordionProps> = ({
  className,
  items,
}) => {
  return (
    <AccordionRoot className={className} type='multiple'>
      {items.map((item, index) => (
        <AccordionItem key={index} value={item.id}>
          <AccordionTrigger>{item.label}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  )
}
