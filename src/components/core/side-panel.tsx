/* eslint-disable jsx-a11y/no-static-element-interactions -- allow */
/* eslint-disable jsx-a11y/click-events-have-key-events -- allow */
import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { getClass } from 'model/src/utils';
import type { IconComponent } from './icons';
import { Bars3Icon, XMarkIcon } from './icons';

export interface SidePanelItems {
  label: string;
  icon?: IconComponent;
  href: string;
	current: boolean;
}
export interface ProfileItem {
	img: string,
	name: string,
	href: string
}
export type SidePanelProps = {
  className?: string;
  items: SidePanelItems[];
  onBodyClick?: () => void;
  title?: string;
	profileItem?: ProfileItem;
} & React.PropsWithChildren;
export const SidePanel: React.FunctionComponent<SidePanelProps> = ({
  //className,
  items,
  children,
  onBodyClick,
  title,
	profileItem
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/*
        This example requires updating your template:

        ```
        <html class="h-full bg-gray-50">
        <body class="h-full">
        ```
      */}
      <div>
        <Transition.Root as={Fragment} show={sidebarOpen}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button className="-m-2.5 p-2.5" onClick={() => { setSidebarOpen(false); }} type="button">
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon aria-hidden="true" className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 py-2">
                    {title ? <div className="flex h-16 shrink-0 items-center">
                      <img
                        alt="Your Company"
                        className="h-8 w-auto"
                        src="/logo.png"
                      />
											{/* <Header className="" level={2}>{title}</Header> */}
                    </div> : null}
                    <nav className="flex flex-1 flex-col">
                      <ul className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul className="-mx-2 space-y-1">
                            {items.map((item) => (
                              <li key={item.label}>
                                <a
                                  className={getClass(
                                    item.current
                                      ? 'bg-gray-50 text-primary'
                                      : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                  )}
                                  href={item.href}
                                >
                                  {item.icon ? <item.icon
                                    aria-hidden="true"
                                    className={getClass(
                                      item.current ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
                                      'h-6 w-6 shrink-0'
                                    )}
                                  /> : null}
                                  {item.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-2">
            {title ? <div className="flex h-16 shrink-0 items-center">
              <img
                alt="Your Company"
                className="h-8 w-auto"
                src="/logo.png"
              />
							{/* <Header level={2}>{title}</Header> */}
            </div> : null}
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul className="-mx-2 space-y-1">
                    {items.map((item) => (
                      <li key={item.label}>
                        <a
                          className={getClass(
                            item.current
                              ? 'bg-gray-50 text-primary'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                          href={item.href}
                        >
                          {item.icon ? <item.icon
                            aria-hidden="true"
                            className={getClass(
                              item.current ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
                              'h-6 w-6 shrink-0'
                            )}
                          /> : null}
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                {profileItem ? <li className="-mx-6 mt-auto">
                  <a
                    className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                    href={profileItem.href}
                  >
                    <img
                      alt=""
                      className="h-8 w-8 rounded-full bg-gray-50"
                      src={profileItem.img}
                    />
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">{profileItem.name}</span>
                  </a>
                </li> : null}
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => { setSidebarOpen(true); }} type="button">
            <span className="sr-only">Open sidebar</span>
						<Bars3Icon aria-hidden="true" className="h-6 w-6"/>
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
          {profileItem ? <a href={profileItem.href}>
            <span className="sr-only">Your profile</span>
            <img
              alt=""
              className="h-8 w-8 rounded-full bg-gray-50"
              src={profileItem.img}
            />
          </a> : null}
        </div>

        <main className="lg:pl-60">
          <div className="" onClick={onBodyClick}>{children}</div>
        </main>
      </div>
    </>
  )
}
