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
import { Particles } from '../design/particles'
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
      <div>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className='hw-relative hw-z-50 lg:hw-hidden'
        >
          <DialogBackdrop
            transition
            className='hw-fixed hw-inset-0 hw-bg-gray-900/80 hw-transition-opacity hw-duration-300 hw-ease-linear data-[closed]:hw-opacity-0'
          />

          <div className='hw-fixed hw-inset-0 hw-flex'>
            <DialogPanel
              transition
              className='hw-relative hw-mr-16 hw-flex hw-w-full hw-max-w-xs hw-flex-1 hw-transform hw-transition hw-duration-300 hw-ease-in-out data-[closed]:-hw-translate-x-full'
            >
              <TransitionChild>
                <div className='hw-absolute hw-left-full hw-top-0 hw-flex hw-w-16 hw-justify-center hw-pt-5 hw-duration-300 hw-ease-in-out data-[closed]:hw-opacity-0'>
                  <button
                    type='button'
                    onClick={() => setSidebarOpen(false)}
                    className='-hw-m-2.5 hw-p-2.5'
                  >
                    <span className='hw-sr-only'>Close sidebar</span>
                    <XMarkIcon
                      aria-hidden='true'
                      className='hw-h-6 hw-w-6 hw-text-white'
                    />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className='hw-flex hw-grow hw-flex-col hw-gap-y-5 hw-overflow-y-auto hw-bg-white dark:bg-gray-900 hw-px-6 hw-pb-2'>
                <div className='hw-flex hw-h-16 hw-shrink-0 hw-items-center'>
                  <a
                    className='hw-text-md hw-flex hw-items-center hw-text-gray-950 dark:hw-text-white'
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
                </div>
                <nav className='hw-flex hw-flex-1 hw-flex-col'>
                  <ul
                    role='list'
                    className='hw-flex hw-flex-1 hw-flex-col hw-gap-y-7'
                  >
                    <li>
                      <ul role='list' className='-hw-mx-2 hw-space-y-1'>
                        {items.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              className={getClass(
                                item.current
                                  ? 'hw-bg-gray-50 hw-text-primary dark:hw-gray-800 dark:hw-text-white'
                                  : 'hw-text-gray-700 hover:hw-bg-gray-50 hover:hw-text-primary dark:hw-text-gray-400 dark:hover:hw-bg-gray-800 dark:hover:hw-text-white',
                                'hw-group hw-flex hw-gap-x-3 hw-rounded-md hw-p-2 hw-text-sm hw-font-semibold hw-leading-6',
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
                                  ? 'bg-gray-50 text-primary dark:hw-bg-gray-800 dark:hw-text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:hw-text-gray-400 dark:hover:hw-bg-gray-800 dark:hover:hw-text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                              )}
                            >
                              <span
                                className={getClass(
                                  team.current
                                    ? 'border-primary text-primary'
                                    : 'border-gray-200 text-gray-400 group-hover:border-primary group-hover:text-primary dark:group-hover:text-white dark:hw-border-gray-700 dark:hw-bg-gray-800',
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
        <div className='hw-hidden lg:hw-fixed lg:hw-inset-y-0 lg:hw-z-50 lg:hw-flex lg:hw-w-72 lg:hw-flex-col'>
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className='hw-flex hw-grow hw-flex-col hw-gap-y-5 hw-overflow-y-auto hw-border-r hw-border-gray-200 dark:hw-border-gray-700 hw-bg-white dark:hw-bg-gray-900 hw-px-6'>
            <div className='hw-flex hw-h-16 hw-shrink-0 hw-items-center'>
              <a
                className='hw-text-md hw-flex hw-items-center hw-text-gray-950 dark:hw-text-white'
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
            </div>
            <nav className='hw-flex hw-flex-1 hw-flex-col'>
              <ul
                role='list'
                className='hw-flex hw-flex-1 hw-flex-col hw-gap-y-7'
              >
                <li>
                  <ul role='list' className='-hw-mx-2 hw-space-y-1'>
                    {items.map((item) => (
                      <li key={item.label}>
                        <a
                          href={item.href}
                          className={getClass(
                            item.current
                              ? 'hw-bg-gray-50 hw-text-primary dark:hw-bg-gray-800 dark:hw-text-white'
                              : 'hw-text-gray-700 hover:hw-bg-gray-50 hover:hw-text-primary dark:hw-text-gray-400 dark:hover:hw-bg-gray-800 dark:hover:hw-text-white',
                            'hw-group hw-flex hw-gap-x-3 hw-rounded-md hw-p-2 hw-text-sm hw-font-semibold hw-leading-6',
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
                  <div className='text-xs font-semibold leading-6 hw-text-gray-400'>
                    Your teams
                  </div>
                  <ul role='list' className='-mx-2 mt-2 space-y-1'>
                    {teams.map((team) => (
                      <li key={team.name}>
                        <a
                          href={team.href}
                          className={getClass(
                           team.current
                                  ? 'bg-gray-50 text-primary dark:hw-bg-gray-800 dark:hw-text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary dark:hw-text-gray-400 dark:hover:hw-bg-gray-800 dark:hover:hw-text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                          )}
                        >
                          <span
                            className={getClass(
                              team.current
                                ? 'border-primary text-primary'
                                    : 'border-gray-200 text-gray-400 group-hover:border-primary group-hover:text-primary dark:group-hover:text-white dark:hw-border-gray-700 dark:hw-bg-gray-800',
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
                <li className='hw-mb-6 hw-mt-auto'>{profileItem}</li>
              </ul>
            </nav>
          </div>
        </div>

        <div className='hw-sticky hw-top-0 hw-z-40 hw-flex hw-items-center hw-gap-x-6 hw-bg-white hw-px-4 hw-py-4 hw-shadow-sm sm:hw-px-6 lg:hw-hidden'>
          <button
            type='button'
            onClick={() => setSidebarOpen(true)}
            className='-hw-m-2.5 hw-p-2.5 hw-text-gray-700 lg:hw-hidden'
          >
            <span className='hw-sr-only'>Open sidebar</span>
            <Bars3Icon aria-hidden='true' className='hw-h-6 hw-w-6' />
          </button>
          <div className='hw-flex-1 hw-text-sm hw-font-semibold hw-leading-6 hw-text-gray-900'>
            Dashboard
          </div>
          <a href='#'>
            <span className='hw-sr-only'>Your profile</span>
            <img
              alt=''
              src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
              className='hw-h-8 hw-w-8 hw-rounded-full hw-bg-gray-50'
            />
          </a>
        </div>

        <main className='hw-py-10 lg:hw-pl-72'>
          <div className='hw-px-4 sm:hw-px-6 lg:hw-px-8'>{children}</div>
        </main>
      </div>
    </>
  )
}
