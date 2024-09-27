import { clsx } from 'clsx'

export function Gradient({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'hw-bg-[linear-gradient(115deg,var(--tw-gradient-stops))] hw-from-[#fff1be] dark:hw-from-[#b45309] hw-from-[28%] hw-via-[#ee87cb] dark:hw-via-[#9d174d] hw-via-[70%] hw-to-[#b060ff] dark:hw-to-[#86198f] sm:hw-bg-[linear-gradient(145deg,var(--tw-gradient-stops))]',
      )}
    />
  )
}

export function GradientBackground() {
  return (
    <div className='hw-relative hw-mx-auto hw-max-w-7xl'>
      <div
        className={clsx(
          'hw-absolute -hw-right-60 -hw-top-44 hw-h-60 hw-w-[36rem] hw-transform-gpu md:hw-right-0',
          'hw-bg-[linear-gradient(115deg,var(--tw-gradient-stops))] hw-from-[#fff1be] dark:hw-from-[#b45309] hw-from-[28%] hw-via-[#ee87cb] dark:hw-via-[#9d174d] hw-via-[70%] hw-to-[#b060ff] dark:hw-to-[#86198f]',
          'hw-rotate-[-10deg] hw-rounded-full hw-blur-3xl',
        )}
      />
    </div>
  )
}
