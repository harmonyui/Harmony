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
        'hw-group hw-relative hw-mx-auto hw-flex hw-max-w-fit hw-flex-row hw-items-center hw-justify-center hw-rounded-2xl hw-bg-white/40 hw-px-4 hw-py-1.5 hw-text-sm hw-font-medium hw-shadow-[inset_0_-8px_10px_#8fdfff1f] hw-backdrop-blur-sm hw-transition-shadow hw-duration-500 hw-ease-out [--bg-size:300%] hover:hw-shadow-[inset_0_-5px_10px_#8fdfff3f] dark:hw-bg-black/40',
        className,
      )}
    >
      <div
        className={`hw-absolute hw-inset-0 hw-block hw-h-full hw-w-full hw-animate-gradient hw-bg-gradient-to-r hw-from-[#ffaa40]/50 hw-via-[#9c40ff]/50 hw-to-[#ffaa40]/50 hw-bg-[length:var(--bg-size)_100%] hw-p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]`}
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
      🎉 <hr className='hw-mx-2 hw-h-4 hw-w-[1px] hw-shrink-0 hw-bg-gray-300' />{' '}
      <span
        className={getClass(
          `hw-inline hw-animate-gradient hw-bg-gradient-to-r hw-from-[#ffaa40] hw-via-[#9c40ff] hw-to-[#ffaa40] hw-bg-[length:var(--bg-size)_100%] hw-bg-clip-text hw-text-transparent`,
        )}
      >
        {children}
      </span>
      <ChevronRightIcon className='hw-ml-1 hw-size-3 hw-transition-transform hw-duration-300 hw-ease-in-out group-hover:hw-translate-x-0.5 dark:hw-fill-white' />
    </AnimatedGradientText>
  )
}
