import React from "react";
import type { PolymorphicComponentProps } from "../../types/polymorphics";
import { Spinner } from "./spinner";

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
type TextProps<C extends React.ElementType> = PolymorphicComponentProps<
  C,
  ButtonProps
>;
export const Button = <T extends React.ElementType>({
  children,
  as,
  mode = "primary",
  backgroundColor,
  className,
  loading,
  ...rest
}: TextProps<T>): JSX.Element => {
  const Component = as || "button";
  const buttonClasses: { [key in ButtonType]: string } = {
    primary: "bg-primary text-white hover:bg-primary/80 fill-white",
    secondary: "hover:bg-gray-50",
    other: `text-secondary hover:opacity-80`,
		none: `text-sm font-semibold leading-6 text-gray-900`
  };
  const style = mode === "other" ? { backgroundColor } : undefined;
  const _class = mode !== 'none' ? `${
    buttonClasses[mode]
  } inline-flex justify-center rounded-md px-2.5 py-1.5 text-sm font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${className}`
	: `${buttonClasses[mode]} ${className}`;
  return (
    <Component className={_class} style={style} type="button" {...rest}>
      {loading ? <Spinner className="relative left-1/2 -translate-x-1/2" sizeClass="w-5 h-5"/> : null}
      {loading ? <div className="invisible">{children}</div> : children}
    </Component>
  );
};