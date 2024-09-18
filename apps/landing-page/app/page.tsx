import { GradientButton } from '@harmony/ui/src/components/design/gradient-button'
import { Particles } from '@harmony/ui/src/components/design/particles'
import { HeroVideoDialog } from '@harmony/ui/src/components/design/hero-video-dialog'

export default function Home() {
  return (
    <>
      <main className='hw-mx-auto hw-flex-1 hw-overflow-hidden'>
        <section
          id='hero'
          className='hw-relative hw-mx-auto hw-mt-32 hw-max-w-[80rem] hw-px-6 hw-text-center md:hw-px-8'
        >
          <GradientButton className='hw-animate-fade-in hw-opacity-0'>
            Introducing Harmony UI
          </GradientButton>
          <h1 className='hw-bg-gradient-to-br dark:hw-from-white hw-from-black hw-from-30% dark:hw-to-white/40 hw-to-black/40 hw-bg-clip-text hw-py-6 hw-text-5xl hw-font-medium hw-leading-none hw-tracking-tighter hw-text-transparent hw-text-balance sm:hw-text-6xl md:hw-text-7xl lg:hw-text-8xl hw-translate-y-[-1rem] hw-animate-fade-in hw-opacity-0 [--animation-delay:200ms]'>
            Magic UI is the new way to build landing pages.
          </h1>
          <p className='hw-mb-12 hw-text-lg hw-tracking-tight hw-text-gray-400 md:hw-text-xl hw-text-balance hw-translate-y-[-1rem] hw-animate-fade-in hw-opacity-0 [--animation-delay:400ms]'>
            Beautifully designed, animated components and templates built with
            <br />
            Tailwind CSS, React, and Framer Motion.
          </p>
          <button className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-text-sm hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-bg-primary hw-shadow hover:hw-bg-primary/90 hw-h-9 hw-px-4 hw-py-2 hw-translate-y-[-1rem] hw-animate-fade-in hw-gap-1 hw-rounded-lg hw-text-white dark:hw-text-black hw-opacity-0 hw-ease-in-out [--animation-delay:600ms]'>
            Get started for free
          </button>
          <div className='hw-mt-[8rem] hw-animate-fade-up hw-opacity-0 [--animation-delay:400ms] [perspective:2000px]'>
            <HeroVideoDialog
              videoSrc='https://www.youtube.com/embed/RARzoY59tCo?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1&autoplay=1&color=white'
              thumbnailSrc='https://startup-template-sage.vercel.app/hero-light.png'
            />
          </div>
        </section>
      </main>
      <Particles className='hw-absolute hw-inset-0 -hw-z-10' />
    </>
  )
}
