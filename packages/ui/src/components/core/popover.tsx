import { useRef, useState } from "react";
import type { AllOrNothing } from "../../types/utils";
import {getClass} from "../../../../util/src/index"

import { Popover as ReactPopover } from "./date-picker";

type PopoverProps = React.PropsWithChildren<
  {
    button: React.ReactNode;
    className?: string;
    container?: boolean;
  } & AllOrNothing<{ isOpen: boolean; setIsOpen: (value: boolean) => void }>
>;
export const Popover: React.FunctionComponent<PopoverProps> = ({
  children,
  button,
  isOpen,
  setIsOpen,
  container=false,
  className = "p-2",
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
        //className="hw-w-full"
        style={{width: '100%'}}
      >
        {button}
      </div>
      {isOpenActual ? (
        <ReactPopover
          className={getClass(className, "overflow-hidden")}
          state={state}
          triggerRef={ref}
        >
          {container ? <PopoverContainer>{children}</PopoverContainer> : children}
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
