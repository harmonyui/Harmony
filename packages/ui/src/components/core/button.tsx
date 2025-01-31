import React, { useEffect, useRef, useState } from 'react'
import type { PolymorphicComponentProps } from '@harmony/util/src/types/polymorphics'
import { getClass } from '@harmony/util/src/utils/common'
import { Spinner } from './spinner'

export type ButtonType = 'primary' | 'secondary' | 'other' | 'none' | 'dark'
type ButtonPropsNative = {
  loading?: boolean
  disabled?: boolean
} & (
  | {
      mode?: Exclude<ButtonType, 'other'>
      className?: string
      backgroundColor?: string
    }
  | {
      mode: 'other'
      backgroundColor: string
      className?: string
    }
)
export type ButtonProps<C extends React.ElementType> =
  PolymorphicComponentProps<C, ButtonPropsNative>
export function Button<T extends React.ElementType>({
  children,
  as,
  mode = 'primary',
  backgroundColor,
  className,
  loading,
  disabled,
  ...rest
}: ButtonProps<T>): React.JSX.Element {
  const ref = useRef<HTMLButtonElement>(null)
  const [size, setSize] = useState<{ width: number; height: number }>()

  useEffect(() => {
    if (ref.current) {
      setSize({
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      })
    }
  }, [ref])
  const Component = as || 'button'
  const buttonClasses: { [key in ButtonType]: string } = {
    primary:
      'bg-primary disabled:bg-primary-light border-none text-white enabled:hover:bg-primary/80 fill-white',
    secondary: 'enabled:hover:bg-gray-50 bg-white',
    other: `text-secondary enabled:hover:opacity-80`,
    dark: `bg-[#11283B] text-white border-none enabled:hover:bg-[#11283B]/80 fill-white`,
    none: `text-sm font-semibold leading-6 text-gray-900`,
  }
  const style = mode === 'other' ? { backgroundColor } : undefined
  const _class = getClass(
    buttonClasses[mode],
    mode !== 'none'
      ? 'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm border border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75'
      : '',
    className,
  )
  return (
    <Component
      className={_class}
      type='button'
      data-primary='true'
      {...rest}
      ref={ref}
      disabled={disabled}
      style={loading && size ? { ...size, ...style } : style}
    >
      {loading ? <Spinner className='rounded' sizeClass='w-5 h-5' /> : children}
      {/* {loading ? <div className="invisible">{children}</div> : children} */}
    </Component>
  )
}
