import { z } from "zod";
import type { PropsOf } from "../../types/polymorphics";

const HeaderLevelsArray = [1, 2, 3, 4, 5, 6] as const;
export const HeaderLevelsSchema = z.custom<HeaderLevels>(
  (data) =>
    typeof data === "number" &&
    (HeaderLevelsArray as readonly number[]).includes(data),
);
export type HeaderLevels = (typeof HeaderLevelsArray)[number];

type Headers = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeaderProps = {
  level?: HeaderLevels;
  className?: string;
} & React.PropsWithChildren &
  PropsOf<Headers>;

export const Header = ({
  children,
  className,
  level,
  ...rest
}: HeaderProps): JSX.Element => {
  const size: Record<Headers, string> = {
    h1: "text-5xl font-semibold",
    h2: "text-3xl",
    h3: "text-xl",
    h4: "text-m",
    h5: "text-s",
    h6: "text-xs",
  };
  const headerMapping: Record<HeaderLevels, Headers> = {
    1: "h1",
    2: "h2",
    3: "h3",
    4: "h4",
    5: "h5",
    6: "h6",
  };
  const Component = headerMapping[level ?? 2];
  return (
    <Component
      className={`${
        size[Component]
      } font-semibold leading-9 tracking-tight text-gray-900 dark:text-gray-200 ${
        className || ""
      }`}
      {...rest}
    >
      {children}
    </Component>
  );
};
