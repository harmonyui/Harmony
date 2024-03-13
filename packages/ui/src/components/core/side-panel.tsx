/* eslint-disable jsx-a11y/no-static-element-interactions -- allow */
/* eslint-disable jsx-a11y/click-events-have-key-events -- allow */
'use client';
import React, { Fragment, useState } from 'react'
import { type IconComponent, ToggleIcon } from './icons';
import { Bars3Icon, ChevronDownIcon, Cog6ToothIcon, XMarkIcon } from './icons';
import {Transition, Dialog, Menu} from '@headlessui/react';
import { getClass } from '../../../../util/src/index';
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
        <html class="hw-h-full hw-bg-gray-50">
        <body class="hw-h-full">
        ```
      */}
      <div>
        <Transition.Root as={Fragment} show={sidebarOpen}>
          <Dialog as="div" className="hw-relative hw-z-50 lg:hw-hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="hw-transition-opacity hw-ease-linear hw-duration-300"
              enterFrom="hw-opacity-0"
              enterTo="hw-opacity-100"
              leave="hw-transition-opacity hw-ease-linear hw-duration-300"
              leaveFrom="hw-opacity-100"
              leaveTo="hw-opacity-0"
            >
              <div className="hw-fixed hw-inset-0 hw-bg-gray-900/80" />
            </Transition.Child>

            <div className="hw-fixed hw-inset-0 hw-flex">
              <Transition.Child
                as={Fragment}
                enter="hw-transition hw-ease-in-out hw-duration-300 hw-transform"
                enterFrom="-hw-translate-x-full"
                enterTo="hw-translate-x-0"
                leave="hw-transition hw-ease-in-out hw-duration-300 hw-transform"
                leaveFrom="hw-translate-x-0"
                leaveTo="-hw-translate-x-full"
              >
                <Dialog.Panel className="hw-relative hw-mr-16 hw-flex hw-w-full hw-max-w-xs hw-flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="hw-ease-in-out hw-duration-300"
                    enterFrom="hw-opacity-0"
                    enterTo="hw-opacity-100"
                    leave="hw-ease-in-out hw-duration-300"
                    leaveFrom="hw-opacity-100"
                    leaveTo="hw-opacity-0"
                  >
                    <div className="hw-absolute hw-left-full hw-top-0 hw-flex hw-w-16 hw-justify-center hw-pt-5">
                      <button className="-hw-m-2.5 hw-p-2.5" onClick={() => { setSidebarOpen(false); }} type="button">
                        <span className="hw-sr-only">Close sidebar</span>
                        <XMarkIcon aria-hidden="true" className="hw-h-6 hw-w-6 hw-text-white" />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  <div className="hw-flex hw-grow hw-flex-col hw-gap-y-5 hw-overflow-y-auto hw-bg-white hw-px-6 hw-py-2">
                    {title ? <div className="hw-flex hw-h-16 hw-shrink-0 hw-items-center">
                      {/* <img
                        alt="Your Company"
                        className="hw-h-8 hw-w-auto"
                        src="/logo.png"
                      /> */}
											<Header className="" level={2}>{title}</Header>
                    </div> : null}
                    <nav className="hw-flex hw-flex-1 hw-flex-col">
                      <ul className="hw-flex hw-flex-1 hw-flex-col hw-gap-y-7">
                        <li>
                          <ul className="-hw-mx-2 hw-space-y-1">
                            {items.map((item) => (
                              <SidePanelItem item={item} key={item.label}/>
                            ))}
                          </ul>
                        </li>
												<SidePanelItem className="hw-mt-auto" item={{current: false, href: '/settings', icon: Cog6ToothIcon, label: 'Settings'}}/>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hw-hidden lg:hw-fixed lg:hw-inset-y-0 lg:hw-z-50 lg:hw-flex lg:hw-w-72 lg:hw-flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="hw-flex hw-grow hw-flex-col hw-gap-y-5 hw-overflow-y-auto hw-border-r hw-border-gray-200 hw-bg-white hw-px-6 hw-py-2">
            {title ? <div className="hw-flex hw-h-16 hw-shrink-0 hw-items-center">
              {/* <img
                alt="Your Company"
                className="hw-h-8 hw-w-auto"
                src="/logo.png"
              /> */}
							<Header level={2}>{title}</Header>
            </div> : null}
            <nav className="hw-flex hw-flex-1 hw-flex-col">
              <ul className="hw-flex hw-flex-1 hw-flex-col hw-gap-y-7">
                <li className="hw-h-full">
                  <ul className="-hw-mx-2 hw-space-y-1 hw-h-1/2 hw-flex hw-flex-col">
                    {items.map((item) => (
                      <SidePanelItem item={item} key={item.label}/>
                    ))}
                  </ul>
                </li>
								<SidePanelItem className="hw-mt-auto" item={{current: false, href: '/settings', icon: Cog6ToothIcon, label: 'Settings'}}/>
                {/* <li className="hw-mt-auto">
                  <a
                    href="#"
                    className="group hw--mx-2 hw-flex hw-gap-x-3 hw-rounded-md hw-p-2 hw-text-sm hw-font-semibold hw-leading-6 hw-text-gray-400 hover:hw-bg-gray-800 hover:hw-text-white"
                  >
                    <Cog6ToothIcon className="hw-h-6 hw-w-6 shrink-0" aria-hidden="true" />
                    Settings
                  </a>
                </li> */}
              </ul>
            </nav>
          </div>
        </div>

				<div className="lg:hw-pl-72">
					<div className="hw-top-0 hw-z-40 hw-flex hw-h-16 shrink-0 hw-items-center hw-gap-x-4 hw-border-b hw-border-gray-200 hw-bg-white hw-px-4 hw-shadow-sm sm:hw-gap-x-6 sm:hw-px-6 lg:hw-px-8">
						<button className="-hw-m-2.5 hw-p-2.5 hw-text-gray-700 lg:hw-hidden" onClick={() => { setSidebarOpen(true); }} type="button">
							<span className="hw-sr-only">Open sidebar</span>
							<Bars3Icon aria-hidden="true" className="hw-h-6 hw-w-6"/>
						</button>
						{/* Separator */}
						<div className="hw-h-6 hw-w-px hw-bg-gray-200 lg:hw-hidden" aria-hidden="true" />

						<div className="hw-flex hw-flex-1 hw-gap-x-4 hw-self-stretch lg:hw-gap-x-6">
							<div className="hw-flex hw-flex-1"/>
							<div className="hw-flex hw-items-center hw-gap-x-4 lg:hw-gap-x-6">
								{/* <button type="button" className="hw--m-2.5 hw-p-2.5 hw-text-gray-400 hover:hw-text-gray-500">
									<span className="hw-sr-only">View notifications</span>
									<BellIcon className="hw-h-6 hw-w-6" aria-hidden="true" />
								</button> */}

								{/* Separator */}
								{/* <div className="hw-hidden lg:hw-block lg:hw-h-6 lg:hw-w-px lg:hw-bg-gray-200" aria-hidden="true" /> */}

								{/* Profile dropdown */}
								{profileItem ? <Menu as="div" className="hw-relative">
									<Menu.Button className="hw-flex hw-items-center hw-p-1.5">
										<span className="hw-sr-only">Open user menu</span>
										<img
											className="hw-h-8 hw-w-8 hw-rounded-full hw-bg-gray-50"
											src={profileItem.img}
											alt=""
										/>
										<span className="hw-hidden lg:hw-flex lg:hw-items-center">
											<span className="hw-ml-4 hw-text-sm hw-font-semibold hw-leading-6 hw-text-gray-900" aria-hidden="true">
												{profileItem.name}
											</span>
											<ChevronDownIcon className="hw-ml-2 hw-h-5 hw-w-5 hw-text-gray-400" aria-hidden="true" />
										</span>
									</Menu.Button>
									<Transition
										as={Fragment}
										enter="hw-transition hw-ease-out hw-duration-100"
										enterFrom="hw-transform hw-opacity-0 hw-scale-95"
										enterTo="hw-transform hw-opacity-100 hw-scale-100"
										leave="hw-transition hw-ease-in hw-duration-75"
										leaveFrom="hw-transform hw-opacity-100 hw-scale-100"
										leaveTo="hw-transform hw-opacity-0 hw-scale-95"
									>
										<Menu.Items className="hw-absolute hw-right-0 hw-z-10 hw-mt-2.5 hw-w-32 hw-origin-top-right hw-rounded-md hw-bg-white hw-py-2 hw-shadow-lg hw-ring-1 hw-ring-gray-900/5 focus:hw-outline-none">
											{profileItem.navigation.map((item) => (
												<Menu.Item key={item.name}>
													{({ active }) => (
														item.href ? <a
															href={item.href}
                              className={getClass(
																active ? 'hw-bg-gray-50' : '',
																'hw-block hw-px-3 hw-py-1 hw-text-sm hw-leading-6 hw-text-gray-900'
															)}
														>
															{item.name}
														</a> :  <button
															onClick={item.onClick}
                              className={getClass(
																active ? 'hw-bg-gray-50' : '',
																'hw-block hw-px-3 hw-py-1 hw-text-sm hw-leading-6 hw-text-gray-900 hw-w-full'
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
					<main className="hw-py-10">
						<div className="hw-px-4 sm:hw-px-6 lg:hw-px-8" onClick={onBodyClick}>{children}</div>
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
						? 'hw-bg-gray-50 hw-text-primary'
						: 'hw-text-gray-700 hover:hw-text-primary hover:hw-bg-gray-50',
					'group hw-flex hw-gap-x-3 hw-rounded-md hw-p-2 hw-text-sm hw-leading-6 hw-font-semibold'
				)}
				href={item.href}
			>
				{item.icon ? typeof item.icon === 'function' ? <ToggleIcon icon={item.icon} selected={item.current}/> : item.icon : null}
				{item.label}
			</a>
		</li>
	)
}
