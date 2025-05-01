import Link from 'next/link'
import { DarkModeToggle } from './dark-mode-toggle'
import { GithubStars } from '@/app/components/github-stars'
import { getWebUrl } from '@harmony/util/src/utils/component'
import { WEB_URL } from '@harmony/util/src/constants'

export const Navbar: React.FunctionComponent = () => {
  return (
    <header className='fixed left-0 top-0 z-50 w-full translate-y-[-1rem] animate-fade-in border-b opacity-0 backdrop-blur-[12px] [--animation-delay:600ms]'>
      <div className='w-full mx-auto px-8 flex h-[3.5rem] items-center justify-between'>
        <Link
          className='text-md flex items-center text-secondary-foreground'
          href='/'
        >
          <img
            src='/icon-128.png'
            className='h-6 w-6 text-primary mr-2 dark:hidden'
          />
          <img
            src='/icon-dark-128.png'
            className='h-6 w-6 text-primary mr-2 hidden dark:inline-block'
          />
          Harmony UI
        </Link>
        <div className='ml-auto flex h-full items-center'>
          <GithubStars />
          <DarkModeToggle />
          <Link
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 mr-6 text-sm'
            href='/blog'
          >
            Blog
          </Link>
          <Link
            className='inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 mr-6 text-sm'
            href={WEB_URL}
          >
            Join Beta
          </Link>
        </div>
        <button className='ml-6 md:hidden'>
          <span className='sr-only'>Toggle menu</span>
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
            className='lucide lucide-align-justify '
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
