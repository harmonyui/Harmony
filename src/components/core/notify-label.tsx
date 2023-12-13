import { useColorVariant } from "model/src/core/colors";

type ColorVariant = "primary" | "blue";

export interface NotifyLabelProps {
  label: string;
  variant: ColorVariant;
  className?: string;
}
export const NotifyLabel = ({
  label,
  className,
  variant,
}: NotifyLabelProps) => {
  const variantClass = useColorVariant(variant);
  return (
    <span
      className={`inline-flex items-center justify-center px-2 text-sm font-medium rounded-full ${variantClass} ${
        className || ""
      }`}
    >
      {label}
    </span>
  );
};
