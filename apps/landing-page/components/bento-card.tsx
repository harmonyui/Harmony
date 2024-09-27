'use client'

import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Subheading } from './text'

export function BentoCard({
  dark = false,
  className = '',
  eyebrow,
  title,
  description,
  graphic,
  fade = [],
}: {
  dark?: boolean
  className?: string
  eyebrow: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  graphic: React.ReactNode
  fade?: ('top' | 'bottom')[]
}) {
  return (
    <motion.div
      initial='idle'
      whileHover='active'
      variants={{ idle: {}, active: {} }}
      data-dark={dark ? 'true' : undefined}
      className={clsx(
        className,
        'hw-group hw-elative hw-flex hw-flex-col hw-overflow-hidden hw-rounded-lg',
        'hw-bg-white hw-shadow-sm hw-ring-1 hw-ring-black/5',
        'data-[dark]:hw-bg-gray-800 data-[dark]:hw-ring-white/15',
      )}
    >
      <div className='hw-relative hw-h-80 hw-shrink-0'>
        {graphic}
        {fade.includes('top') && (
          <div className='hw-absolute hw-inset-0 hw-bg-gradient-to-b hw-from-white hw-to-50% group-data-[dark]:hw-from-gray-800 group-data-[dark]:hw-from-[-25%]' />
        )}
        {fade.includes('bottom') && (
          <div className='hw-absolute hw-inset-0 hw-bg-gradient-to-t hw-from-white hw-to-50% group-data-[dark]:hw-from-gray-800 group-data-[dark]:hw-from-[-25%]' />
        )}
      </div>
      <div className='hw-relative hw-p-10'>
        <Subheading as='h3' dark={dark}>
          {eyebrow}
        </Subheading>
        <p className='hw-mt-1 hw-text-2xl/8 hw-font-medium hw-tracking-tight hw-text-gray-950 group-data-[dark]:hw-text-white'>
          {title}
        </p>
        <p className='hw-mt-2 hw-max-w-[600px] hw-text-sm/6 hw-text-gray-600 group-data-[dark]:hw-text-gray-400'>
          {description}
        </p>
      </div>
    </motion.div>
  )
}
