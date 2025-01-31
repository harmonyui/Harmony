/* eslint-disable no-nested-ternary -- ok*/
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { getClass } from '@harmony/util/src/utils/common'
import { ToggleIcon, type IconComponent } from './icons'

export interface SidePanelItems {
  label: string
  icon?: IconComponent | React.ReactNode
  href: string
  current: boolean
}
export interface ProfileItem {
  img: string
  name: string
  navigation: ({ name: string } & (
    | {
        href?: undefined
        onClick: () => void
      }
    | { href: string; onClick?: undefined }
  ))[]
}
export type SidePanelProps = {
  className?: string
  items: SidePanelItems[]
  onBodyClick?: () => void
  title?: string
  profileItem?: React.ReactNode
} & React.PropsWithChildren

export const SidePanel: React.FunctionComponent<SidePanelProps> = ({
  items,
  children,
  profileItem,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <div className='dark:bg-gray-900'>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className='relative z-50 lg:hidden'
        >
          <DialogBackdrop
            transition
            className='fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0'
          />

          <div className='fixed inset-0 flex'>
            <DialogPanel
              transition
              className='relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full'
            >
              <TransitionChild>
                <div className='absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0'>
                  <button
                    type='button'
                    onClick={() => setSidebarOpen(false)}
                    className='-m-2.5 p-2.5'
                  >
                    <span className='sr-only'>Close sidebar</span>
                    <XMarkIcon
                      aria-hidden='true'
                      className='h-6 w-6 text-white'
                    />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-2'>
                <div className='flex h-16 shrink-0 items-center'>
                  <a
                    className='text-md flex items-center text-gray-950 dark:text-white'
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
                  </a>
                </div>
                <nav className='flex flex-1 flex-col'>
                  <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                    <li>
                      <ul role='list' className='-mx-2 space-y-1'>
                        {items.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              className={getClass(
                                item.current
                                  ? 'bg-gray-50 text-primary dark:gray-800 dark:text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                              )}
                            >
                              {item.icon ? (
                                typeof item.icon === 'function' ? (
                                  <ToggleIcon
                                    className='d'
                                    icon={item.icon}
                                    selected={item.current}
                                  />
                                ) : (
                                  item.icon
                                )
                              ) : null}
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    {/* <li>
                      <div className='text-xs font-semibold leading-6 text-gray-400'>
                        Your teams
                      </div>
                      <ul role='list' className='-mx-2 mt-2 space-y-1'>
                        {teams.map((team) => (
                          <li key={team.name}>
                            <a
                              href={team.href}
                              className={getClass(
                                team.current
                                  ? 'bg-gray-50 text-primary dark:bg-gray-800 dark:text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                              )}
                            >
                              <span
                                className={getClass(
                                  team.current
                                    ? 'border-primary text-primary'
                                    : 'border-gray-200 text-gray-400 group-hover:border-primary group-hover:text-primary dark:group-hover:text-white dark:border-gray-700 dark:bg-gray-800',
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                                )}
                              >
                                {team.initial}
                              </span>
                              <span className='truncate'>{team.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li> */}
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col'>
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className='flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6'>
            <div className='flex h-16 shrink-0 items-center'>
              <a
                className='text-md flex items-center text-gray-950 dark:text-white'
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
              </a>
            </div>
            <nav className='flex flex-1 flex-col'>
              <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                <li>
                  <ul role='list' className='-mx-2 space-y-1'>
                    {items.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          className={getClass(
                            item.current
                              ? 'bg-gray-50 text-primary dark:bg-gray-800 dark:text-white'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                          )}
                        >
                          {item.icon ? (
                            typeof item.icon === 'function' ? (
                              <ToggleIcon
                                className='d'
                                icon={item.icon}
                                selected={item.current}
                              />
                            ) : (
                              item.icon
                            )
                          ) : null}
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                {/* <li>
                  <div className='text-xs font-semibold leading-6 text-gray-400'>
                    Your teams
                  </div>
                  <ul role='list' className='-mx-2 mt-2 space-y-1'>
                    {teams.map((team) => (
                      <li key={team.name}>
                        <a
                          href={team.href}
                          className={getClass(
                           team.current
                                  ? 'bg-gray-50 text-primary dark:bg-gray-800 dark:text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                          )}
                        >
                          <span
                            className={getClass(
                              team.current
                                ? 'border-primary text-primary'
                                    : 'border-gray-200 text-gray-400 group-hover:border-primary group-hover:text-primary dark:group-hover:text-white dark:border-gray-700 dark:bg-gray-800',
                                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                            )}
                          >
                            {team.initial}
                          </span>
                          <span className='truncate'>{team.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li> */}
                <li className='mb-6 mt-auto'>{profileItem}</li>
              </ul>
            </nav>
          </div>
        </div>

        <div className='sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden'>
          <button
            type='button'
            onClick={() => setSidebarOpen(true)}
            className='-m-2.5 p-2.5 text-gray-700 lg:hidden'
          >
            <span className='sr-only'>Open sidebar</span>
            <Bars3Icon aria-hidden='true' className='h-6 w-6' />
          </button>
          <div className='flex-1 text-sm font-semibold leading-6 text-gray-900'>
            Dashboard
          </div>
          <a href='#'>
            <span className='sr-only'>Your profile</span>
            <img
              alt=''
              src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              className='h-8 w-8 rounded-full bg-gray-50'
            />
          </a>
        </div>

        <main className='py-10 lg:pl-72'>
          <div className='px-4 sm:px-6 lg:px-8'>{children}</div>
        </main>
      </div>
    </>
  )
}
