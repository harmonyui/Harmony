import { z } from "zod";

export type HexColor = `#${string}`;

export const HexColorSchema = z.custom<HexColor>(
  (val) => typeof val == "string" && val.startsWith("#"),
);

export type ColorVariant = "primary" | "blue";

export const useColorVariant = (variant: ColorVariant) => {
  const colorVariants: Record<ColorVariant, string> = {
    primary: "text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-300",
    blue: "text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
  };

  return colorVariants[variant];
};
