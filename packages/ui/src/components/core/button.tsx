import React, { useState } from "react";
import type { PolymorphicComponentProps } from "../../types/polymorphics";
import { Spinner } from "./spinner";
import { ModalPortal } from "./modal";
import { Header } from "./header";

export type ButtonType = "primary" | "secondary" | "other" | "none";
type ButtonProps = {
  loading?: boolean
}
  & ({
      mode?: Exclude<ButtonType, "other">;
      className?: string;
      backgroundColor?: string;
    }
  | {
      mode: "other";
      backgroundColor: string;
      className?: string;
    })
export type TextProps<C extends React.ElementType> = PolymorphicComponentProps<
  C,
  ButtonProps
>;
export function Button <T extends React.ElementType>({
  children,
  as,
  mode = "primary",
  backgroundColor,
  className,
  loading,
  ...rest
}: TextProps<T>): JSX.Element {
  const Component = as || "button";
  const buttonClasses: { [key in ButtonType]: string } = {
    primary: "hw-bg-primary hw-text-white hover:hw-bg-primary/80 hw-fill-white",
    secondary: "hover:hw-bg-gray-50",
    other: `hw-text-secondary hover:hw-opacity-80`,
		none: `hw-text-sm hw-font-semibold hw-leading-6 hw-text-gray-900`
  };
  const style = mode === "other" ? { backgroundColor } : undefined;
  const _class = mode !== 'none' ? `${
    buttonClasses[mode]
  } hw-inline-flex hw-justify-center hw-rounded-md hw-px-2.5 hw-py-1.5 hw-text-sm hw-font-medium hw-border focus:hw-outline-none focus-visible:hw-ring-2 focus-visible:hw-ring-white focus-visible:hw-ring-opacity-75 ${className}`
	: `${buttonClasses[mode]} ${className}`;
  return (
    <Component className={_class} style={style} type="button" {...rest}>
      {loading ? <Spinner className="hw-relative hw-left-1/2 -hw-translate-x-1/2" sizeClass="hw-w-5 hw-h-5"/> : null}
      {loading ? <div className="hw-invisible">{children}</div> : children}
    </Component>
  );
};