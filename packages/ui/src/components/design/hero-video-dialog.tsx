'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getClass } from '@harmony/util/src/utils/common'
import { PlayIcon, XMarkIcon } from '../core/icons'

type AnimationStyle =
  | 'from-bottom'
  | 'from-center'
  | 'from-top'
  | 'from-left'
  | 'from-right'
  | 'fade'
  | 'top-in-bottom-out'
  | 'left-in-right-out'

interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  className?: string
}

const animationVariants = {
  'from-bottom': {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  'from-center': {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  'from-top': {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  'from-left': {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  'from-right': {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  'top-in-bottom-out': {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  'left-in-right-out': {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
}

export function HeroVideoDialog({
  animationStyle = 'from-center',
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = 'Video thumbnail',
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const selectedAnimation = animationVariants[animationStyle]

  return (
    <div className={getClass('hw-relative', className)}>
      <div
        className='hw-relative hw-cursor-pointer hw-group'
        onClick={() => setIsVideoOpen(true)}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className='hw-w-full hw-transition-all hw-duration-200 group-hover:hw-brightness-[0.8] hw-ease-out hw-rounded-md hw-shadow-lg hw-border'
        />
        <div className='hw-absolute hw-inset-0 hw-flex hw-items-center hw-justify-center group-hover:hw-scale-100 hw-scale-[0.9] hw-transition-all hw-duration-200 hw-ease-out hw-rounded-2xl'>
          <div className='hw-bg-primary/10 hw-flex hw-items-center hw-justify-center hw-rounded-full hw-backdrop-blur-md hw-size-28'>
            <div
              className={`hw-flex hw-items-center hw-justify-center hw-bg-gradient-to-b hw-from-primary/30 hw-to-primary hw-shadow-md hw-rounded-full hw-size-20 hw-transition-all hw-ease-out hw-duration-200 hw-relative group-hover:hw-scale-[1.2] hw-scale-100`}
            >
              <PlayIcon
                className='hw-size-8 hw-text-white hw-fill-white group-hover:hw-scale-105 hw-scale-100 hw-transition-transform hw-duration-200 hw-ease-out'
                style={{
                  filter:
                    'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))',
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className='hw-fixed hw-inset-0 hw-z-50 hw-flex hw-items-center hw-justify-center hw-bg-black/50 hw-backdrop-blur-md'
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className='hw-relative hw-w-full hw-max-w-4xl hw-aspect-video hw-mx-4 md:hw-mx-0'
            >
              <motion.button className='hw-absolute -hw-top-16 hw-right-0 hw-text-white hw-text-xl hw-bg-neutral-900/50 hw-ring-1 hw-backdrop-blur-md hw-rounded-full hw-p-2 dark:hw-bg-neutral-100/50 dark:hw-text-black'>
                <XMarkIcon className='hw-size-5' />
              </motion.button>
              <div className='hw-size-full hw-border-2 hw-border-white hw-rounded-2xl hw-overflow-hidden hw-isolate hw-z-[1] hw-relative'>
                <iframe
                  src={videoSrc}
                  className='hw-size-full hw-rounded-2xl'
                  allowFullScreen
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
