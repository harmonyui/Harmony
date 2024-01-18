import React from "react";

type PanelProps = {
  className?: string;
  disabled?: boolean;
} & React.PropsWithChildren;
export const Panel = ({
  children,
  className,
  disabled = false,
}: PanelProps) => {
  return (
    <>
      <div
        className={`${
          className || ""
        } bg-gray relative rounded-xl p-3 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2`}
      >
        {disabled && (
          <div className="absolute top-0 left-0 h-full w-full opacity-50 bg-red-200 rounded-xl z-10"></div>
        )}
        {children}
      </div>
    </>
  );
};
