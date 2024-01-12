/* eslint-disable jsx-a11y/no-static-element-interactions -- allow */
/* eslint-disable jsx-a11y/click-events-have-key-events -- allow */
'use client';
import React, { Fragment, useState } from 'react'
import { type IconComponent, ToggleIcon } from './icons';
import { Bars3Icon, ChevronDownIcon, Cog6ToothIcon, XMarkIcon } from './icons';
import {Transition, Dialog, Menu} from '@headlessui/react';
import { getClass } from '@harmony/utils/util';
import { Header } from './header';

export interface SidePanelItems {
  label: string;
  icon?: IconComponent | React.ReactNode;
  href: string;
	current: boolean;
}
export interface ProfileItem {
	img: string,
	name: string,
	navigation: ({name: string} & ({
    href?: undefined;
    onClick: () => void;
  } | {href: string, onClick?: undefined}))[]

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
                      {/* <img
                        alt="Your Company"
                        className="h-8 w-auto"
                        src="/logo.png"
                      /> */}
											<Header className="" level={2}>{title}</Header>
                    </div> : null}
                    <nav className="flex flex-1 flex-col">
                      <ul className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul className="-mx-2 space-y-1">
                            {items.map((item) => (
                              <SidePanelItem item={item} key={item.label}/>
                            ))}
                          </ul>
                        </li>
												<SidePanelItem className="mt-auto" item={{current: false, href: '/settings', icon: Cog6ToothIcon, label: 'Settings'}}/>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-2">
            {title ? <div className="flex h-16 shrink-0 items-center">
              {/* <img
                alt="Your Company"
                className="h-8 w-auto"
                src="/logo.png"
              /> */}
							<Header level={2}>{title}</Header>
            </div> : null}
            <nav className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul className="-mx-2 space-y-1">
                    {items.map((item) => (
                      <SidePanelItem item={item} key={item.label}/>
                    ))}
                  </ul>
                </li>
								<SidePanelItem className="mt-auto" item={{current: false, href: '/settings', icon: Cog6ToothIcon, label: 'Settings'}}/>
                {/* <li className="mt-auto">
                  <a
                    href="#"
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                  >
                    <Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Settings
                  </a>
                </li> */}
              </ul>
            </nav>
          </div>
        </div>

				<div className="lg:pl-72">
					<div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
						<button className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => { setSidebarOpen(true); }} type="button">
							<span className="sr-only">Open sidebar</span>
							<Bars3Icon aria-hidden="true" className="h-6 w-6"/>
						</button>
						{/* Separator */}
						<div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

						<div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
							<div className="flex flex-1"/>
							<div className="flex items-center gap-x-4 lg:gap-x-6">
								{/* <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
									<span className="sr-only">View notifications</span>
									<BellIcon className="h-6 w-6" aria-hidden="true" />
								</button> */}

								{/* Separator */}
								{/* <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" /> */}

								{/* Profile dropdown */}
								{profileItem ? <Menu as="div" className="relative">
									<Menu.Button className="-m-1.5 flex items-center p-1.5">
										<span className="sr-only">Open user menu</span>
										<img
											className="h-8 w-8 rounded-full bg-gray-50"
											src={profileItem.img}
											alt=""
										/>
										<span className="hidden lg:flex lg:items-center">
											<span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
												{profileItem.name}
											</span>
											<ChevronDownIcon className="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />
										</span>
									</Menu.Button>
									<Transition
										as={Fragment}
										enter="transition ease-out duration-100"
										enterFrom="transform opacity-0 scale-95"
										enterTo="transform opacity-100 scale-100"
										leave="transition ease-in duration-75"
										leaveFrom="transform opacity-100 scale-100"
										leaveTo="transform opacity-0 scale-95"
									>
										<Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
											{profileItem.navigation.map((item) => (
												<Menu.Item key={item.name}>
													{({ active }) => (
														item.href ? <a
															href={item.href}
                              className={getClass(
																active ? 'bg-gray-50' : '',
																'block px-3 py-1 text-sm leading-6 text-gray-900'
															)}
														>
															{item.name}
														</a> :  <button
															onClick={item.onClick}
                              className={getClass(
																active ? 'bg-gray-50' : '',
																'block px-3 py-1 text-sm leading-6 text-gray-900'
															)}
														>
															{item.name}
														</button>
													)}
												</Menu.Item>
											))}
										</Menu.Items>
									</Transition>
								</Menu> : null}
							</div> 
						</div>
					</div>
					<main className="py-10">
						<div className="px-4 sm:px-6 lg:px-8" onClick={onBodyClick}>{children}</div>
					</main>
				</div>
      </div>
    </>
  )
}

const SidePanelItem: React.FunctionComponent<{item: SidePanelItems, className?: string}> = ({item, className}) => {
	return (
		<li key={item.label} className={getClass(className)}>
			<a
				className={getClass(
					item.current
						? 'bg-gray-50 text-primary'
						: 'text-gray-700 hover:text-primary hover:bg-gray-50',
					'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
				)}
				href={item.href}
			>
				{item.icon ? typeof item.icon === 'function' ? <ToggleIcon icon={item.icon} selected={item.current}/> : item.icon : null}
				{item.label}
			</a>
		</li>
	)
}
