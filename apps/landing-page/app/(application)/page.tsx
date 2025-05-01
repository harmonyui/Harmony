import { GradientButton } from '@harmony/ui/src/components/design/gradient-button'
import { Particles } from '@harmony/ui/src/components/design/particles'
import { HeroVideoDialog } from '@harmony/ui/src/components/design/hero-video-dialog'
import { ShineBorder } from '@harmony/ui/src/components/design/shine-border'
import { PricingCard } from '../components/pricing-card'
import { GradientBackground } from '@/components/gradient'
import { WEB_URL } from '@harmony/util/src/constants'
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
              href={WEB_URL}
              className='inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary shadow hover:bg-primary/90 h-9 px-4 py-2 gap-1 rounded-lg text-white'
            >
              Get started
            </a>
            <a
              href={`${WEB_URL}/setup/quick?teamId=clua06nan0001dvpho5cb10sr`}
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
        <div
          className='flex mr-auto ml-auto max-w-screen-xl p-8 justify-center'
          style={{
            justifyContent: 'normal',
          }}
        >
          <div className='flex justify-center flex-col gap-y-6 gap-x-6 w-full border-l-0 border-r-0 border-t-0 border-b-0 items-center max-w-none'>
            <h2 className='tracking-[-0.9px] mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-black dark:text-white text-6xl font-bold text-start'>
              Design directly inside your SaaS app.
            </h2>
            <p className='tracking-[-1.26px] mr-0 ml-0 mt-0 mb-0 w-full border-l-0 border-r-0 border-t-0 border-b-0 text-black dark:text-white font-normal text-xl text-center opacity-80'>
              Unlike other design tools that leverage a copy-and-paste approach,
              Harmony makes changes directly in your deployed application.
              Changes are then shipped straight to Github, freeing up precious
              developer time.
            </p>
            <div className='flex gap-y-4 gap-x-4 flex-wrap w-full border-l-0 border-r-0 border-t-0 border-b-0 items-start p-0 justify-center'>
              <div className='flex items-center gap-y-2 gap-x-2 pr-4 pl-4 h-10 border-l-0 border-r-0 border-t-0 border-b-0 rounded-tl-full rounded-tr-full rounded-bl-full rounded-br-full bg-[#f0f0f0]'>
                <span className='text-base font-semibold flex items-center shrink-0 leading-4 border-l-0 border-r-0 border-t-0 border-b-0 text-[#292929]'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='1em'
                    height='1em'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
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
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
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
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
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
        <div className='flex max-w-screen-xl m-auto pt-32 pb-32'>
          <div className='pr-8 pt-4 border-l-0 border-r-0 border-t-0 border-b-0 w-full'>
            <div className='block max-w-lg border-l-0 border-r-0 border-t-0 border-b-0'>
              <h2 className='font-semibold block leading-7 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-primary'>
                Agents for everyone
              </h2>
              <div className='block relative border-l-0 border-r-0 border-t-0 border-b-0'>
                <div className='absolute -top-6 -left-4 -right-4 -bottom-6 border-l-0 border-r-0 border-t-0 border-b-0 z-0'>
                  <div className='opacity-75 absolute top-0 left-0 right-0 bottom-0 border-l-0 border-r-0 border-t-0 border-b-0 bg-gradient-to-r from-[#fff1be] dark:from-[#b45309] from-[28%] via-[#ee87cb] dark:via-[#9d174d] via-[70%] to-[#b060ff] dark:to-[#86198f] blur-2xl'></div>
                </div>
                <p className='text-5xl font-semibold block relative tracking-[-1.2px] leading-none mr-0 ml-0 mt-2 mb-0 z-10 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white text-gray-950'>
                  Drag and Drop
                  <br className='border-l-0 border-r-0 border-t-0 border-b-0'></br>
                  Custom Components
                </p>
              </div>
              <p className='text-lg block leading-8 mr-0 ml-0 mt-6 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white/80 text-gray-600'>
                Work from your existing component library to build UIs directly
                inside your application
              </p>
              <dl className='block leading-7 mr-0 ml-0 mt-10 mb-0 max-w-none border-l-0 border-r-0 border-t-0 border-b-0 text-gray-600'>
                <div className='block relative pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='currentColor'
                      strokeWidth='0'
                      viewBox='0 0 512 512'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary bg-[#00000000]'
                    >
                      <path d='m292.6 407.78-120-320a22 22 0 0 0-41.2 0l-120 320a22 22 0 0 0 41.2 15.44l36.16-96.42a2 2 0 0 1 1.87-1.3h122.74a2 2 0 0 1 1.87 1.3l36.16 96.42a22 22 0 0 0 41.2-15.44zm-185.84-129 43.37-115.65a2 2 0 0 1 3.74 0l43.37 115.67a2 2 0 0 1-1.87 2.7h-86.74a2 2 0 0 1-1.87-2.7zM400.77 169.5c-41.72-.3-79.08 23.87-95 61.4a22 22 0 0 0 40.5 17.2c8.88-20.89 29.77-34.44 53.32-34.6 32.32-.22 58.41 26.5 58.41 58.85a1.5 1.5 0 0 1-1.45 1.5c-21.92.61-47.92 2.07-71.12 4.8-54.75 6.44-87.43 36.29-87.43 79.85 0 23.19 8.76 44 24.67 58.68C337.6 430.93 358 438.5 380 438.5c31 0 57.69-8 77.94-23.22h.06a22 22 0 1 0 44 .19v-143c0-56.18-45-102.56-101.23-102.97zM380 394.5c-17.53 0-38-9.43-38-36 0-10.67 3.83-18.14 12.43-24.23 8.37-5.93 21.2-10.16 36.14-11.92 21.12-2.49 44.82-3.86 65.14-4.47a2 2 0 0 1 2 2.1C455 370.1 429.46 394.5 380 394.5z'></path>
                    </svg>
                    Readable
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 opacity-80 dark:text-white text-gray-600'>
                    Modify your application without needing local access to the
                    codebase.
                  </dd>
                </div>
                <div className='block relative mt-8 pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='none'
                      strokeWidth='1.5'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z'
                      ></path>
                    </svg>
                    Analytical
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white/80 text-gray-600'>
                    Track the runtime of each agent to ensure consistent
                    results.
                  </dd>
                </div>
                <div className='block relative mt-8 pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='none'
                      strokeWidth='1.5'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
                      ></path>
                    </svg>
                    Comprehendable
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 opacity-80 dark:text-white text-gray-600'>
                    Made to be used by anyone, regardless of technical
                    background or experience.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className='flex p-2 w-full'>
            <img src='/screenshot.png' />
          </div>
        </div>

        <div className='flex max-w-screen-xl m-auto pt-32 pb-32'>
          <div className='flex w-full p-0 pt-4 pr-8'>
            <img src='/screenshot.png' />
          </div>
          <div className='border-l-0 border-r-0 border-t-0 border-b-0 w-full p-0'>
            <div className='block max-w-lg border-l-0 border-r-0 border-t-0 border-b-0'>
              <h2 className='font-semibold block leading-7 mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 text-primary'>
                Agents for everyone
              </h2>
              <div className='block relative border-l-0 border-r-0 border-t-0 border-b-0'>
                <div className='absolute -top-6 -left-4 -right-4 -bottom-6 border-l-0 border-r-0 border-t-0 border-b-0 z-0'>
                  <div className='opacity-75 absolute top-0 left-0 right-0 bottom-0 border-l-0 border-r-0 border-t-0 border-b-0 bg-gradient-to-r from-[#fff1be] dark:from-[#b45309] from-[28%] via-[#ee87cb] dark:via-[#9d174d] via-[70%] to-[#b060ff] dark:to-[#86198f] blur-2xl'></div>
                </div>
                <p className='text-5xl font-semibold block relative tracking-[-1.2px] leading-none mr-0 ml-0 mt-2 mb-0 z-10 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white text-gray-950'>
                  Drag and Drop
                  <br className='border-l-0 border-r-0 border-t-0 border-b-0'></br>
                  Fine-Tuning
                </p>
              </div>
              <p className='text-lg block leading-8 mr-0 ml-0 mt-6 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white/80 text-gray-600'>
                Build advanced workflows, personalized to your business, without
                introducing all the complexity of code.
              </p>
              <dl className='block leading-7 mr-0 ml-0 mt-10 mb-0 max-w-none border-l-0 border-r-0 border-t-0 border-b-0 text-gray-600'>
                <div className='block relative pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='currentColor'
                      strokeWidth='0'
                      viewBox='0 0 512 512'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary bg-[#00000000]'
                    >
                      <path d='m292.6 407.78-120-320a22 22 0 0 0-41.2 0l-120 320a22 22 0 0 0 41.2 15.44l36.16-96.42a2 2 0 0 1 1.87-1.3h122.74a2 2 0 0 1 1.87 1.3l36.16 96.42a22 22 0 0 0 41.2-15.44zm-185.84-129 43.37-115.65a2 2 0 0 1 3.74 0l43.37 115.67a2 2 0 0 1-1.87 2.7h-86.74a2 2 0 0 1-1.87-2.7zM400.77 169.5c-41.72-.3-79.08 23.87-95 61.4a22 22 0 0 0 40.5 17.2c8.88-20.89 29.77-34.44 53.32-34.6 32.32-.22 58.41 26.5 58.41 58.85a1.5 1.5 0 0 1-1.45 1.5c-21.92.61-47.92 2.07-71.12 4.8-54.75 6.44-87.43 36.29-87.43 79.85 0 23.19 8.76 44 24.67 58.68C337.6 430.93 358 438.5 380 438.5c31 0 57.69-8 77.94-23.22h.06a22 22 0 1 0 44 .19v-143c0-56.18-45-102.56-101.23-102.97zM380 394.5c-17.53 0-38-9.43-38-36 0-10.67 3.83-18.14 12.43-24.23 8.37-5.93 21.2-10.16 36.14-11.92 21.12-2.49 44.82-3.86 65.14-4.47a2 2 0 0 1 2 2.1C455 370.1 429.46 394.5 380 394.5z'></path>
                    </svg>
                    Readable
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 opacity-80 dark:text-white text-gray-600'>
                    Visualize the flow of data, providing a clear look at the
                    inputs and outputs of each agent.
                  </dd>
                </div>
                <div className='block relative mt-8 pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='none'
                      strokeWidth='1.5'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z'
                      ></path>
                    </svg>
                    Analytical
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 dark:text-white/80 text-gray-600'>
                    Track the runtime of each agent to ensure consistent
                    results.
                  </dd>
                </div>
                <div className='block relative mt-8 pl-9 border-l-0 border-r-0 border-t-0 border-b-0'>
                  <dt className='font-semibold inline border-l-0 border-r-0 border-t-0 border-b-0 mr-1 dark:text-white text-primary'>
                    <svg
                      stroke='currentColor'
                      fill='none'
                      strokeWidth='1.5'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                      height='1em'
                      width='1em'
                      xmlns='http://www.w3.org/2000/svg'
                      className='block absolute top-1 left-1 border-l-0 border-r-0 border-t-0 border-b-0 overflow-x-hidden overflow-y-hidden text-primary'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
                      ></path>
                    </svg>
                    Comprehendable
                  </dt>
                  <dd className='inline mr-0 ml-0 mt-0 mb-0 border-l-0 border-r-0 border-t-0 border-b-0 opacity-80 dark:text-white text-gray-600'>
                    Made to be used by anyone, regardless of technical
                    background or experience.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <section id='pricing'>
          <div className='mx-auto flex max-w-screen-xl flex-col gap-8 px-4 py-14 md:px-8 mt-16'>
            <div className='mx-auto text-center max-w-none'>
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
                link={WEB_URL}
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
                link={WEB_URL}
              />
              <PricingCard
                title='Enterprise'
                description='For teams'
                custom
                link={WEB_URL}
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
