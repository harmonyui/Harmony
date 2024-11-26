'use client'

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import { Bars2Icon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { Link } from './link'
import { Logo } from './logo'
import { PlusGrid, PlusGridItem, PlusGridRow } from './plus-grid'

const links = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/company', label: 'Company' },
  { href: '/blog', label: 'Blog' },
  { href: '/login', label: 'Login' },
]

function DesktopNav() {
  return (
    <nav className='hw-relative hw-hidden lg:hw-flex'>
      {links.map(({ href, label }) => (
        <PlusGridItem key={href} className='hw-relative hw-flex'>
          <Link
            href={href}
            className='hw-flex hw-items-center hw-px-4 hw-py-3 hw-text-base hw-font-medium hw-text-gray-950 hw-bg-blend-multiply data-[hover]:hw-bg-black/[2.5%]'
          >
            {label}
          </Link>
        </PlusGridItem>
      ))}
    </nav>
  )
}

function MobileNavButton() {
  return (
    <DisclosureButton
      className='hw-flex hw-size-12 hw-items-center hw-justify-center hw-self-center hw-rounded-lg data-[hover]:hw-bg-black/5 lg:hw-hidden'
      aria-label='Open main menu'
    >
      <Bars2Icon className='hw-size-6' />
    </DisclosureButton>
  )
}

function MobileNav() {
  return (
    <DisclosurePanel className='lg:hw-hidden'>
      <div className='hw-flex hw-flex-col hw-gap-6 hw-py-4'>
        {links.map(({ href, label }, linkIndex) => (
          <motion.div
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{
              duration: 0.15,
              ease: 'easeInOut',
              rotateX: { duration: 0.3, delay: linkIndex * 0.1 },
            }}
            key={href}
          >
            <Link
              href={href}
              className='hw-text-base hw-font-medium hw-text-gray-950'
            >
              {label}
            </Link>
          </motion.div>
        ))}
      </div>
      <div className='hw-absolute hw-left-1/2 hw-w-screen -hw-translate-x-1/2'>
        <div className='hw-absolute hw-inset-x-0 hw-top-0 hw-border-t hw-border-black/5' />
        <div className='hw-absolute hw-inset-x-0 hw-top-2 hw-border-t hw-border-black/5' />
      </div>
    </DisclosurePanel>
  )
}

export function Navbar({ banner }: { banner?: React.ReactNode }) {
  return (
    <Disclosure as='header' className='hw-pt-12 sm:hw-pt-16'>
      <PlusGrid>
        <PlusGridRow className='hw-relative hw-flex hw-justify-between'>
          <div className='hw-relative hw-flex hw-gap-6'>
            <PlusGridItem className='hw-py-3'>
              <Link href='/' title='Home'>
                <Logo className='hw-h-9' />
              </Link>
            </PlusGridItem>
            {banner && (
              <div className='hw-relative hw-hidden hw-items-center hw-py-3 lg:hw-flex'>
                {banner}
              </div>
            )}
          </div>
          <DesktopNav />
          <MobileNavButton />
        </PlusGridRow>
      </PlusGrid>
      <MobileNav />
    </Disclosure>
  )
}
