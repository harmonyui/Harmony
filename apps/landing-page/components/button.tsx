import * as Headless from '@headlessui/react'
import { clsx } from 'clsx'
import { Link } from './link'

const variants = {
  primary: clsx(
    'hw-inline-flex hw-items-center hw-justify-center hw-px-4 hw-py-[calc(theme(spacing.2)-1px)]',
    'hw-rounded-full hw-border hw-border-transparent hw-bg-gray-950 hw-shadow-md',
    'hw-whitespace-nowrap hw-text-base hw-font-medium hw-text-white',
    'data-[disabled]:hw-bg-gray-950 data-[hover]:hw-bg-gray-800 data-[disabled]:hw-opacity-40',
  ),
  secondary: clsx(
    'hw-relative hw-inline-flex hw-items-center hw-justify-center hw-px-4 hw-py-[calc(theme(spacing.2)-1px)]',
    'hw-rounded-full hw-border hw-border-transparent hw-bg-white/15 hw-shadow-md hw-ring-1 hw-ring-[#D15052]/15',
    'after:hw-absolute after:hw-inset-0 after:hw-rounded-full after:hw-shadow-[inset_0_0_2px_1px_#ffffff4d]',
    'hw-whitespace-nowrap hw-text-base hw-font-medium hw-text-gray-950',
    'data-[disabled]:hw-bg-white/15 data-[hover]:hw-bg-white/20 data-[disabled]:hw-opacity-40',
  ),
  outline: clsx(
    'hw-inline-flex hw-items-center hw-justify-center hw-px-2 hw-py-[calc(theme(spacing.[1.5])-1px)]',
    'hw-rounded-lg hw-border hw-border-transparent hw-shadow hw-ring-1 hw-ring-black/10',
    'hw-whitespace-nowrap hw-text-sm hw-font-medium hw-text-gray-950',
    'data-[disabled]:hw-bg-transparent data-[hover]:hw-bg-gray-50 data-[disabled]:hw-opacity-40',
  ),
}

type ButtonProps = {
  variant?: keyof typeof variants
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (Headless.ButtonProps & { href?: undefined })
)

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const _className = clsx(className, variants[variant])

  if (typeof props.href === 'undefined') {
    return <Headless.Button {...props} className={_className} />
  }

  return <Link {...props} className={_className} />
}
