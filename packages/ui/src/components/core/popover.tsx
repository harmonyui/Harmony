import React, { Fragment, useEffect, useRef, useState } from "react";
import { getClass } from "@harmony/util/src/utils/common";
import {
  Popover as NativePopover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { AllOrNothing } from "@harmony/util/src/types/utils";
import { Popover as ReactPopover } from "./date-picker";

type PopoverProps = React.PropsWithChildren<{
  button: React.ReactNode;
  className?: string;
  buttonClass?: string;
}>;
export const Popover: React.FunctionComponent<PopoverProps> = ({
  children,
  button,
  buttonClass,
  className = "hw-p-2",
}) => {
  return (
    <NativePopover>
      <div className={getClass("hover:hw-cursor-pointer", buttonClass)}>
        <PopoverButton as={Fragment}>{button}</PopoverButton>
      </div>
      <Transition
        enter="hw-transition hw-ease-out hw-duration-100"
        enterFrom="hw-opacity-0 hw-translate-y-1"
        enterTo="hw-opacity-100 hw-translate-y-0"
        leave="hw-transition hw-ease-in hw-duration-150"
        leaveFrom="hw-opacity-100 hw-translate-y-0"
        leaveTo="hw-opacity-0 hw-translate-y-1"
      >
        <PopoverPanel
          className={getClass(
            "hw-absolute hw-bg-white hw-border hw-border-gray-400 hw-rounded-[3px] hw-shadow-lg hw-mt-2 hw-z-10 hw-overflow-auto",
            className,
          )}
        >
          {children}
        </PopoverPanel>
      </Transition>
    </NativePopover>
  );
};

export const PopoverContainer: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="hw-bg-white hw-border hw-rounded-md hw-p-4">{children}</div>
  );
};

type PopoverPropsAria = React.PropsWithChildren<
  {
    button: React.ReactNode;
    className?: string;
    buttonClass?: string;
    container?: HTMLElement;
    closeTrigger?: number;
  } & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
>;
export const PopoverAria: React.FunctionComponent<PopoverPropsAria> = ({
  children,
  button,
  isOpen,
  setIsOpen,
  container,
  buttonClass,
  className = "hw-p-2",
  closeTrigger,
}) => {
  const [isOpenState, setIsOpenState] = useState<boolean | undefined>(
    isOpen === undefined ? false : undefined,
  );
  const isOpenActual: boolean =
    isOpen !== undefined ? isOpen : Boolean(isOpenState);
  const setIsOpenActual =
    isOpen !== undefined
      ? setIsOpen
      : (setIsOpenState as (value: boolean) => void);
  const ref = useRef<HTMLDivElement>(null);
  const state = {
    isOpen: isOpenActual,
    setOpen: setIsOpenActual,
    open: () => {
      setIsOpenActual(true);
    },
    close: () => {
      setIsOpenActual(false);
    },
    toggle: () => {
      setIsOpenActual(!isOpenActual);
    },
  };

  useEffect(() => {
    if (closeTrigger) {
      setIsOpenActual(false);
    }
  }, [closeTrigger]);
  return (
    <>
      <div
        onClick={() => {
          setIsOpenActual(!isOpenActual);
        }}
        onKeyDown={() => {
          setIsOpenActual(!isOpenActual);
        }}
        ref={ref}
        role="button"
        tabIndex={0}
        className={buttonClass}
        //className="hw-w-full"
        //style={{width: '100%'}}
      >
        {button}
      </div>
      {isOpenActual ? (
        <ReactPopover
          className={getClass(className, "hw-overflow-hidden")}
          state={state}
          triggerRef={ref}
          container={container}
        >
          {children}
        </ReactPopover>
      ) : null}
    </>
  );
};
