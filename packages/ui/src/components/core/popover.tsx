'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { getClass } from '@harmony/util/src/utils/common'
import type { AllOrNothing } from '@harmony/util/src/types/utils'
import { useEffect, useRef, useState } from 'react'
import { Popover as ReactPopover } from './date-picker'

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
          'overflow-auto border border-gray-300 rounded-md shadow-lg mt-2 z-10 bg-white text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
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
}) => {
  return (
    <PopoverBase>
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

type PopoverPropsAria = React.PropsWithChildren<
  {
    button: React.ReactNode
    className?: string
    buttonClass?: string
    container?: HTMLElement
    closeTrigger?: number
  } & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
>
export const PopoverAria: React.FunctionComponent<PopoverPropsAria> = ({
  children,
  button,
  isOpen,
  setIsOpen,
  container,
  buttonClass,
  className = 'hw-p-2',
  closeTrigger,
}) => {
  const [isOpenState, setIsOpenState] = useState<boolean | undefined>(
    isOpen === undefined ? false : undefined,
  )
  const isOpenActual: boolean =
    isOpen !== undefined ? isOpen : Boolean(isOpenState)
  const setIsOpenActual =
    isOpen !== undefined
      ? setIsOpen
      : (setIsOpenState as (value: boolean) => void)
  const ref = useRef<HTMLDivElement>(null)
  const state = {
    isOpen: isOpenActual,
    setOpen: setIsOpenActual,
    open: () => {
      setIsOpenActual(true)
    },
    close: () => {
      setIsOpenActual(false)
    },
    toggle: () => {
      setIsOpenActual(!isOpenActual)
    },
  }

  useEffect(() => {
    if (closeTrigger) {
      setIsOpenActual(false)
    }
  }, [closeTrigger])
  return (
    <>
      <div
        onClick={() => {
          setIsOpenActual(!isOpenActual)
        }}
        onKeyDown={() => {
          setIsOpenActual(!isOpenActual)
        }}
        ref={ref}
        role='button'
        tabIndex={0}
        className={buttonClass}
        //className="hw-w-full"
        //style={{width: '100%'}}
      >
        {button}
      </div>
      {isOpenActual ? (
        <ReactPopover
          className={getClass(className, 'hw-overflow-hidden')}
          state={state}
          triggerRef={ref}
          container={container}
        >
          {children}
        </ReactPopover>
      ) : null}
    </>
  )
}
