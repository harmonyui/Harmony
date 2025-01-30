import { GradientButton } from '@harmony/ui/src/components/design/gradient-button'
import { Particles } from '@harmony/ui/src/components/design/particles'
import { HeroVideoDialog } from '@harmony/ui/src/components/design/hero-video-dialog'
import { ShineBorder } from '@harmony/ui/src/components/design/shine-border'
import { PricingCard } from '../components/pricing-card'
import { GradientBackground } from '@/components/gradient'
export default function Home() {
  return (
    <>
      <main className='mx-auto flex-1 overflow-hidden'>
        <GradientBackground />
        <section
          id='hero'
          className='relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8'
        >
          <GradientButton className='animate-fade-in opacity-0'>
            Introducing Harmony UI
          </GradientButton>
          <h1 className='bg-gradient-to-br dark:from-white from-black from-30% dark:to-white/40 to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent text-balance sm:text-6xl md:text-7xl lg:text-8xl translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]'>
            Ship UI changes instantly as{' '}
            <span className='from-primary to-primary/40 bg-gradient-to-br text-transparent bg-clip-text'>
              visual developers
            </span>
          </h1>
          <p className='mb-12 text-lg tracking-tight text-gray-400 md:text-xl text-balance translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]'>
            Harmony transforms your SaaS app into an interactive design canvas.
            <br />
            Changes shipped directly to your codebase. Made for designers.
          </p>
          <div className='flex gap-2 justify-center opacity-0 ease-in-out [--animation-delay:600ms] animate-fade-in translate-y-[-1rem] '>
            <a
              href='https://dashboard.harmonyui.app'
              className='inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary shadow hover:bg-primary/90 h-9 px-4 py-2 gap-1 rounded-lg text-white'
            >
              Get started
            </a>
            <a
              href='https://dashboard.harmonyui.app/setup/quick?teamId=clua06nan0001dvpho5cb10sr'
              className='inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 mr-6 text-sm'
            >
              Try Demo
            </a>
          </div>
          <div className='mt-[8rem] animate-fade-up opacity-0 [--animation-delay:400ms] [perspective:2000px]'>
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
          className='text-center mx-auto max-w-[80rem] px-6 md:px-8'
        >
          <div className='py-14'>
            <div className='mx-auto max-w-screen-xl px-4 md:px-8'>
              <h2 className='text-center text-sm font-semibold text-gray-600'>
                TRUSTED BY TEAMS FROM AROUND THE WORLD
              </h2>
              <div className='mt-6'>
                <ul className='flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16 [&amp;_path]:fill-white'>
                  <li>
                    <img src='/hintible.png' className='h-8 px-2' />
                  </li>
                  <li>
                    <img src='/sandbox.png' className='h-8 px-2' />
                  </li>
                  <li>
                    <img src='/yc.png' className='h-8 px-2' />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <div className='[--color:var(--color-one)] pointer-events-none relative -z-[2] mx-auto h-[50rem] overflow-hidden [mask-image:radial-gradient(ellipse_at_center_center,#000,transparent_50%)] my-[-18.8rem] before:absolute before:inset-0 before:h-full before:w-full before:opacity-40 before:[background-image:radial-gradient(circle_at_bottom_center,var(--color),transparent_70%)] after:absolute after:-left-1/2 after:top-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[50%] after:border-t after:border-[hsl(var(--border))] after:bg-background' />
        <div className='flex max-w-screen-md mr-auto ml-auto p-0'>
          <div className='flex justify-center items-start flex-col gap-y-6 gap-x-6 w-full border-l-0 border-r-0 border-t-0 border-b-0'>
            <h2 className='text-4xl font-semibold tracking-[-0.9px] leading-10 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-black dark:text-white'>
              Design directly inside your SaaS app.
            </h2>
            <p className='text-4xl font-medium tracking-[-1.26px] leading-10 mr-0 ml-0 mt-0 mb-0 w-full border-l-0 border-r-0 border-t-0 border-b-0 opacity-70 text-black dark:text-white'>
              Unlike other design tools that leverage a copy-and-paste approach,
              Harmony makes changes directly in your deployed application.
              Changes are then shipped straight to Github, freeing up precious
              developer time.
            </p>
            <div className='flex items-start gap-y-4 gap-x-4 flex-wrap pt-8 w-full border-l-0 border-r-0 border-t-0 border-b-0'>
              <div className='flex items-center gap-y-2 gap-x-2 pr-4 pl-4 h-10 border-l-0 border-r-0 border-t-0 border-b-0 rounded-tl-full rounded-tr-full rounded-bl-full rounded-br-full bg-[#f0f0f0]'>
                <span className='text-base font-semibold flex items-center shrink-0 leading-4 border-l-0 border-r-0 border-t-0 border-b-0 text-[#292929]'>
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
                    className='block border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden'
                  >
                    <path d='M22 14a8 8 0 0 1-8 8'></path>
                    <path d='M18 11v-1a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0'></path>
                    <path d='M14 10V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1'></path>
                    <path d='M10 9.5V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10'></path>
                    <path d='M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'></path>
                  </svg>
                </span>
                <h3 className='text-lg font-medium leading-7 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-black'>
                  Custom components
                </h3>
              </div>
              <div className='flex items-center gap-y-2 gap-x-2 pr-4 pl-4 h-10 border-l-0 border-r-0 border-t-0 border-b-0 rounded-tl-full rounded-tr-full rounded-bl-full rounded-br-full bg-[#f0f0f0]'>
                <span className='text-base font-semibold flex items-center shrink-0 leading-4 border-l-0 border-r-0 border-t-0 border-b-0 text-[#292929]'>
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
                    className='block border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden'
                  >
                    <path d='M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6'></path>
                    <path d='m12 12 4 10 1.7-4.3L22 16Z'></path>
                  </svg>
                </span>
                <h3 className='text-lg font-medium leading-7 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-black'>
                  Company design system
                </h3>
              </div>
              <div className='flex items-center gap-y-2 gap-x-2 pr-4 pl-4 h-10 border-l-0 border-r-0 border-t-0 border-b-0 rounded-tl-full rounded-tr-full rounded-bl-full rounded-br-full bg-[#f0f0f0]'>
                <span className='text-base font-semibold flex items-center shrink-0 leading-4 border-l-0 border-r-0 border-t-0 border-b-0 text-[#292929]'>
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
                    className='block border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden'
                  >
                    <line x1='22' x2='2' y1='6' y2='6'></line>
                    <line x1='22' x2='2' y1='18' y2='18'></line>
                    <line x1='6' x2='6' y1='2' y2='22'></line>
                    <line x1='18' x2='18' y1='2' y2='22'></line>
                  </svg>
                </span>
                <h3 className='text-lg font-medium leading-7 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-black'>
                  Pixel-perfect design
                </h3>
              </div>
            </div>
          </div>
        </div>
        <section id='pricing'>
          <div className='mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-14 md:px-8'>
            <div className='mx-auto max-w-5xl text-center'>
              <h4 className='text-xl font-bold tracking-tight text-black dark:text-white'>
                Pricing
              </h4>
              <h2 className='text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl'>
                Simple pricing for everyone.
              </h2>
              <p className='mt-6 text-xl leading-8 text-black/80 dark:text-white'>
                Choose an <strong>affordable plan</strong> that's packed with
                the best features for engaging your audience, creating customer
                loyalty, and driving sales.
              </p>
            </div>
            <div className='mx-auto grid w-full justify-center sm:grid-cols-2 lg:grid-cols-3 flex-col gap-4'>
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
      <Particles className='absolute inset-0 -z-10 dark:hidden' color='#000' />
      <Particles
        className='absolute inset-0 -z-10 hidden dark:block'
        color='#fff1be'
      />
    </>
  )
}
