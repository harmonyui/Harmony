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
}: ButtonProps<T>): JSX.Element {
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
      'hw-bg-primary disabled:hw-bg-primary-light hw-border-none hw-text-white enabled:hover:hw-bg-primary/80 hw-fill-white',
    secondary: 'enabled:hover:hw-bg-gray-50 hw-bg-white',
    other: `hw-text-secondary enabled:hover:hw-opacity-80`,
    dark: `hw-bg-[#11283B] hw-text-white hw-border-none enabled:hover:hw-bg-[#11283B]/80 hw-fill-white`,
    none: `hw-text-sm hw-font-semibold hw-leading-6 hw-text-gray-900`,
  }
  const style = mode === 'other' ? { backgroundColor } : undefined
  const _class = getClass(
    buttonClasses[mode],
    mode !== 'none'
      ? 'hw-inline-flex hw-items-center hw-justify-center hw-rounded-md hw-px-2.5 hw-py-1.5 hw-text-sm hw-border hw-border-gray-400 focus:hw-outline-none focus-visible:hw-ring-2 focus-visible:hw-ring-white focus-visible:hw-ring-opacity-75'
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
      {loading ? (
        <Spinner className='hw-rounded' sizeClass='hw-w-5 hw-h-5' />
      ) : (
        children
      )}
      {/* {loading ? <div className="hw-invisible">{children}</div> : children} */}
    </Component>
  )
}
