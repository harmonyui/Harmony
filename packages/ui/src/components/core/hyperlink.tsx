import { getClass } from "../../../../../src/utils/util";

type HyperlinkComponentProps = React.ComponentPropsWithoutRef<"a">;
export const Hyperlink = ({
  className,
  children,
  ...rest
}: HyperlinkComponentProps) => {
  return (
    <a
      {...rest}
      className={getClass(
        className,
        "font-semibold leading-6 text-primary hover:text-opacity-80 cursor-pointer",
      )}
    >
      {children}
    </a>
  );
};
