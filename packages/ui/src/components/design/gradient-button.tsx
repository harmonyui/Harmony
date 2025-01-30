import type { ReactNode } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { ChevronRightIcon } from '../core/icons'

function AnimatedGradientText({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={getClass(
        'group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl bg-white/40 px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#8fdfff1f] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#8fdfff3f] dark:bg-black/40',
        className,
      )}
    >
      <div
        className={`absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:var(--bg-size)_100%] p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]`}
      />

      {children}
    </div>
  )
}

export const GradientButton: React.FunctionComponent<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <AnimatedGradientText className={className}>
      🎉 <hr className='mx-2 h-4 w-[1px] shrink-0 bg-gray-300' />{' '}
      <span
        className={getClass(
          `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
        )}
      >
        {children}
      </span>
      <ChevronRightIcon className='ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5 dark:fill-white' />
    </AnimatedGradientText>
  )
}
