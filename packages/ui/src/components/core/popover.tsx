import { useEffect, useRef, useState } from "react";
import type { AllOrNothing } from "@harmony/util/src/types/utils";
import {getClass} from "@harmony/util/src/utils/common"

import { Popover as ReactPopover } from "./date-picker";

type PopoverProps = React.PropsWithChildren<
  {
    button: React.ReactNode;
    className?: string;
    buttonClass?: string;
    container?: HTMLElement;
    closeTrigger?: number;
  } & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
>;
export const Popover: React.FunctionComponent<PopoverProps> = ({
  children,
  button,
  isOpen,
  setIsOpen,
  container,
  buttonClass,
  className = "hw-p-2",
  closeTrigger
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
          {false ? <PopoverContainer>{children}</PopoverContainer> : children}
        </ReactPopover>
      ) : null}
    </>
  );
};

export const PopoverContainer: React.FunctionComponent<{children: React.ReactNode}> = ({children}) => {
  return (
    <div className="hw-bg-white hw-border hw-rounded-md hw-p-4">
      {children}
    </div>
  )
}
