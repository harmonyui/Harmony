import { getClass } from '@harmony/util/src/utils/common'
import React from 'react'

type RainbowButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function RainbowButton({ children, ...props }: RainbowButtonProps) {
  return (
    <button
      className={getClass(
        'hw-h-11 hw-px-8 hw-py-2 hw-inline-flex hw-items-center hw-justify-center hw-rounded-xl hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-relative hw-group hw-animate-rainbow hw-cursor-pointer hw-border-0 hw-bg-[length:200%] hw-text-primary-foreground [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]',

        // before styles
        'before:hw-absolute before:hw-bottom-[-20%] before:hw-left-1/2 before:hw-z-0 before:hw-h-1/5 before:hw-w-3/5 before:-hw-translate-x-1/2 before:hw-animate-rainbow before:hw-bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:hw-bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]',

        // light mode colors
        'hw-bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]',

        // dark mode colors
        'dark:hw-bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]',
      )}
      {...props}
    >
      {children}
    </button>
  )
}
