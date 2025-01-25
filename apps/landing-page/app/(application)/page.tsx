import { GradientButton } from '@harmony/ui/src/components/design/gradient-button'
import { Particles } from '@harmony/ui/src/components/design/particles'
import { HeroVideoDialog } from '@harmony/ui/src/components/design/hero-video-dialog'
import { ShineBorder } from '@harmony/ui/src/components/design/shine-border'
import { PricingCard } from '../components/pricing-card'
import { GradientBackground } from '@/components/gradient'
export default function Home() {
  return (
    <>
      <main className='hw-mx-auto hw-flex-1 hw-overflow-hidden'>
        <GradientBackground />
        <section
          id='hero'
          className='hw-relative hw-mx-auto hw-mt-32 hw-max-w-[80rem] hw-px-6 hw-text-center md:hw-px-8'
        >
          <GradientButton className='hw-animate-fade-in hw-opacity-0'>
            Introducing Harmony UI
          </GradientButton>
          <h1 className='hw-bg-gradient-to-br dark:hw-from-white hw-from-black hw-from-30% dark:hw-to-white/40 hw-to-black/40 hw-bg-clip-text hw-py-6 hw-text-5xl hw-font-medium hw-leading-none hw-tracking-tighter hw-text-transparent hw-text-balance sm:hw-text-6xl md:hw-text-7xl lg:hw-text-8xl hw-translate-y-[-1rem] hw-animate-fade-in hw-opacity-0 [--animation-delay:200ms]'>
            Ship UI changes instantly as{' '}
            <span className='hw-from-primary hw-to-primary/40 hw-bg-gradient-to-br hw-text-transparent hw-bg-clip-text'>
              visual developers
            </span>
          </h1>
          <p className='hw-mb-12 hw-text-lg hw-tracking-tight hw-text-gray-400 md:hw-text-xl hw-text-balance hw-translate-y-[-1rem] hw-animate-fade-in hw-opacity-0 [--animation-delay:400ms]'>
            Harmony transforms your SaaS app into an interactive design canvas.
            <br />
            Changes shipped directly to your codebase. Made for designers.
          </p>
          <div className='hw-flex hw-gap-2 hw-justify-center hw-opacity-0 hw-ease-in-out [--animation-delay:600ms] hw-animate-fade-in hw-translate-y-[-1rem] '>
            <a
              href='https://dashboard.harmonyui.app'
              className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-text-sm hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-bg-primary hw-shadow hover:hw-bg-primary/90 hw-h-9 hw-px-4 hw-py-2 hw-gap-1 hw-rounded-lg hw-text-white'
            >
              Get started
            </a>
            <a
              href='https://dashboard.harmonyui.app/setup/quick?teamId=clua06nan0001dvpho5cb10sr'
              className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-rounded-md hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-bg-secondary hw-text-secondary-foreground hw-shadow-sm hover:hw-bg-secondary/80 hw-h-9 hw-px-4 hw-py-2 hw-mr-6 hw-text-sm'
            >
              Try Demo
            </a>
          </div>
          <div className='hw-mt-[8rem] hw-animate-fade-up hw-opacity-0 [--animation-delay:400ms] [perspective:2000px]'>
            <ShineBorder color={['#A07CFE', '#FE8FB5', '#FFBE7B']}>
              <HeroVideoDialog
                videoSrc='https://www.youtube.com/embed/RARzoY59tCo?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1&autoplay=1&color=white'
                thumbnailSrc='/video-picture.png'
              />
            </ShineBorder>
          </div>
        </section>
        <section
          id='client'
          className='hw-text-center hw-mx-auto hw-max-w-[80rem] hw-px-6 md:hw-px-8'
        >
          <div className='hw-py-14'>
            <div className='hw-mx-auto hw-max-w-screen-xl hw-px-4 md:hw-px-8'>
              <h2 className='hw-text-center hw-text-sm hw-font-semibold hw-text-gray-600'>
                TRUSTED BY TEAMS FROM AROUND THE WORLD
              </h2>
              <div className='hw-mt-6'>
                <ul className='hw-flex hw-flex-wrap hw-items-center hw-justify-center hw-gap-x-10 hw-gap-y-6 md:hw-gap-x-16 [&amp;_path]:hw-fill-white'>
                  <li>
                    <img src='/hintible.png' className='hw-h-8 hw-px-2' />
                  </li>
                  <li>
                    <img src='/sandbox.png' className='hw-h-8 hw-px-2' />
                  </li>
                  <li>
                    <img src='/yc.png' className='hw-h-8 hw-px-2' />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <div className='[--color:var(--color-one)] hw-pointer-events-none hw-relative -hw-z-[2] hw-mx-auto hw-h-[50rem] hw-overflow-hidden [mask-image:radial-gradient(ellipse_at_center_center,#000,transparent_50%)] hw-my-[-18.8rem] before:hw-absolute before:hw-inset-0 before:hw-h-full before:hw-w-full before:hw-opacity-40 before:[background-image:radial-gradient(circle_at_bottom_center,var(--color),transparent_70%)] after:hw-absolute after:-hw-left-1/2 after:hw-top-1/2 after:hw-aspect-[1/0.7] after:hw-w-[200%] after:hw-rounded-[50%] after:hw-border-t after:hw-border-[hsl(var(--border))] after:hw-bg-background' />
        <div className='hw-flex hw-max-w-screen-md hw-mr-auto hw-ml-auto hw-p-0'>
          <div className='hw-flex hw-justify-center hw-items-start hw-flex-col hw-gap-y-6 hw-gap-x-6 hw-w-full hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0'>
            <h2 className='hw-text-4xl hw-font-semibold hw-tracking-[-0.9px] hw-leading-10 hw-mr-0 hw-ml-0 hw-mt-0 hw-mb-0 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-black dark:hw-text-white'>
              Design directly inside your SaaS app.
            </h2>
            <p className='hw-text-4xl hw-font-medium hw-tracking-[-1.26px] hw-leading-10 hw-mr-0 hw-ml-0 hw-mt-0 hw-mb-0 hw-w-full hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-opacity-70 hw-text-black dark:hw-text-white'>
              Unlike other design tools that leverage a copy-and-paste approach,
              Harmony makes changes directly in your deployed application.
              Changes are then shipped straight to Github, freeing up precious
              developer time.
            </p>
            <div className='hw-flex hw-items-start hw-gap-y-4 hw-gap-x-4 hw-flex-wrap hw-pt-8 hw-w-full hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0'>
              <div className='hw-flex hw-items-center hw-gap-y-2 hw-gap-x-2 hw-pr-4 hw-pl-4 hw-h-10 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-rounded-tl-full hw-rounded-tr-full hw-rounded-bl-full hw-rounded-br-full hw-bg-[#f0f0f0]'>
                <span className='hw-text-base hw-font-semibold hw-flex hw-items-center hw-shrink-0 hw-leading-4 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-[#292929]'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='1em'
                    height='1em'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    className='hw-block hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-overflow-x-hidden hw-overflow-y-hidden'
                  >
                    <path d='M22 14a8 8 0 0 1-8 8'></path>
                    <path d='M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0'></path>
                    <path d='M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1'></path>
                    <path d='M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10'></path>
                    <path d='M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'></path>
                  </svg>
                </span>
                <h3 className='hw-text-lg hw-font-medium hw-leading-7 hw-mr-0 hw-ml-0 hw-mt-0 hw-mb-0 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-black'>
                  Custom components
                </h3>
              </div>
              <div className='hw-flex hw-items-center hw-gap-y-2 hw-gap-x-2 hw-pr-4 hw-pl-4 hw-h-10 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-rounded-tl-full hw-rounded-tr-full hw-rounded-bl-full hw-rounded-br-full hw-bg-[#f0f0f0]'>
                <span className='hw-text-base hw-font-semibold hw-flex hw-items-center hw-shrink-0 hw-leading-4 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-[#292929]'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='1em'
                    height='1em'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    className='hw-block hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-overflow-x-hidden hw-overflow-y-hidden'
                  >
                    <path d='M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6'></path>
                    <path d='m12 12 4 10 1.7-4.3L22 16Z'></path>
                  </svg>
                </span>
                <h3 className='hw-text-lg hw-font-medium hw-leading-7 hw-mr-0 hw-ml-0 hw-mt-0 hw-mb-0 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-black'>
                  Company design system
                </h3>
              </div>
              <div className='hw-flex hw-items-center hw-gap-y-2 hw-gap-x-2 hw-pr-4 hw-pl-4 hw-h-10 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-rounded-tl-full hw-rounded-tr-full hw-rounded-bl-full hw-rounded-br-full hw-bg-[#f0f0f0]'>
                <span className='hw-text-base hw-font-semibold hw-flex hw-items-center hw-shrink-0 hw-leading-4 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-[#292929]'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='1em'
                    height='1em'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    className='hw-block hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-overflow-x-hidden hw-overflow-y-hidden'
                  >
                    <line x1='22' x2='2' y1='6' y2='6'></line>
                    <line x1='22' x2='2' y1='18' y2='18'></line>
                    <line x1='6' x2='6' y1='2' y2='22'></line>
                    <line x1='18' x2='18' y1='2' y2='22'></line>
                  </svg>
                </span>
                <h3 className='hw-text-lg hw-font-medium hw-leading-7 hw-mr-0 hw-ml-0 hw-mt-0 hw-mb-0 hw-border-l-0 hw-border-r-0 hw-border-t-0 hw-border-b-0 hw-text-black'>
                  Pixel-perfect design
                </h3>
              </div>
            </div>
          </div>
        </div>
        <section id='pricing'>
          <div className='hw-mx-auto hw-flex hw-max-w-screen-xl hw-flex-col hw-gap-8 hw-px-4 hw-py-14 md:hw-px-8'>
            <div className='hw-mx-auto hw-max-w-5xl hw-text-center'>
              <h4 className='hw-text-xl hw-font-bold hw-tracking-tight hw-text-black dark:hw-text-white'>
                Pricing
              </h4>
              <h2 className='hw-text-5xl hw-font-bold hw-tracking-tight hw-text-black dark:hw-text-white sm:hw-text-6xl'>
                Simple pricing for everyone.
              </h2>
              <p className='hw-mt-6 hw-text-xl hw-leading-8 hw-text-black/80 dark:hw-text-white'>
                Choose an <strong>affordable plan</strong> that's packed with
                the best features for engaging your audience, creating customer
                loyalty, and driving sales.
              </p>
            </div>
            <div className='hw-mx-auto hw-grid hw-w-full hw-justify-center sm:hw-grid-cols-2 lg:hw-grid-cols-3 hw-flex-col hw-gap-4'>
              <PricingCard
                title='Starter'
                description='For solo designer'
                price={0}
                features={[
                  'Up to 2 designers on a team',
                  'Edit existing pages',
                  'Commented UI code',
                ]}
                link='https://dashboard.harmonyui.app'
              />
              <PricingCard
                title='Growth'
                description='For solo designer'
                price={50}
                features={[
                  'Up to 10 designers on a team',
                  'Ship design edits to Github',
                  'Request new features and integrations',
                ]}
                popular
                link='https://dashboard.harmonyui.app'
              />
              <PricingCard
                title='Enterprise'
                description='For teams'
                custom
                link='https://j48inpgngmc.typeform.com/to/Ch60XpCt'
              />
            </div>
          </div>
        </section>
      </main>
      <Particles
        className='hw-absolute hw-inset-0 -hw-z-10 dark:hidden'
        color='#000'
      />
      <Particles
        className='hw-absolute hw-inset-0 -hw-z-10 hidden dark:block'
        color='#fff1be'
      />
    </>
  )
}
