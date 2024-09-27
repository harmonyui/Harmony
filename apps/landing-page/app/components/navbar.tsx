export const Navbar: React.FunctionComponent = () => {
  return (
    <header className='hw-fixed hw-left-0 hw-top-0 hw-z-50 hw-w-full hw-translate-y-[-1rem] hw-animate-fade-in hw-border-b hw-opacity-0 hw-backdrop-blur-[12px] [--animation-delay:600ms]'>
      <div className='hw-w-full hw-mx-auto hw-px-8 hw-flex hw-h-[3.5rem] hw-items-center hw-justify-between'>
        <a
          className='hw-text-md hw-flex hw-items-center hw-text-secondary-foreground'
          href='/'
        >
          <img
            src='/icon-128.png'
            className='hw-h-6 hw-w-6 hw-text-primary hw-mr-2 dark:hw-hidden'
          />
          <img
            src='/icon-dark-128.png'
            className='hw-h-6 hw-w-6 hw-text-primary hw-mr-2 hw-hidden dark:hw-inline-block'
          />
          Harmony UI
        </a>
        <div className='hw-ml-auto hw-flex hw-h-full hw-items-center'>
          <a
            className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-rounded-md hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-text-secondary-foreground hw-shadow-sm hover:hw-bg-secondary/80 hw-h-9 hw-px-4 hw-py-2 hw-mr-6 hw-text-sm'
            href='/blog'
          >
            Blog
          </a>
          <a
            className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-rounded-md hw-font-medium hw-transition-colors focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-bg-secondary hw-text-secondary-foreground hw-shadow-sm hover:hw-bg-secondary/80 hw-h-9 hw-px-4 hw-py-2 hw-mr-6 hw-text-sm'
            href='https://dashboard.harmonyui.app'
          >
            Join Beta
          </a>
        </div>
        <button className='hw-ml-6 md:hw-hidden'>
          <span className='hw-sr-only'>Toggle menu</span>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='hw-lucide hw-lucide-align-justify '
          >
            <line x1='3' x2='21' y1='6' y2='6'></line>
            <line x1='3' x2='21' y1='12' y2='12'></line>
            <line x1='3' x2='21' y1='18' y2='18'></line>
          </svg>
        </button>
      </div>
    </header>
  )
}
