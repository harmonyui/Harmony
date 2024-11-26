'use client'

import { getClass } from '@harmony/util/src/utils/common'

type TColorProp = string | string[]

interface ShineBorderProps {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: TColorProp
  className?: string
  children: React.ReactNode
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = '#000000',
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          '--border-radius': `${borderRadius}px`,
        } as React.CSSProperties
      }
      className={getClass(
        'hw-relative hw-grid hw-min-h-[60px] hw-w-fit hw-min-w-[300px] hw-place-items-center hw-rounded-[--border-radius] hw-bg-white hw-p-3 hw-text-black dark:hw-bg-black dark:hw-text-white',
        className,
      )}
    >
      <div
        style={
          {
            '--border-width': `${borderWidth}px`,
            '--border-radius': `${borderRadius}px`,
            '--shine-pulse-duration': `${duration}s`,
            '--mask-linear-gradient': `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            '--background-radial-gradient': `radial-gradient(transparent,transparent, ${color instanceof Array ? color.join(',') : color},transparent,transparent)`,
          } as React.CSSProperties
        }
        className={`before:hw-bg-shine-size before:hw-absolute before:hw-inset-0 before:hw-aspect-square before:hw-size-full before:hw-rounded-[--border-radius] before:hw-p-[--border-width] before:hw-will-change-[background-position] before:hw-content-[""] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] before:[background-image:--background-radial-gradient] before:[background-size:300%_300%] before:[mask:--mask-linear-gradient] motion-safe:before:hw-animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]`}
      ></div>
      {children}
    </div>
  )
}
