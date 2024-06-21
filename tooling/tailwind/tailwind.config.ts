import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export const files = [
  "../../packages/ui/src/**/*.{ts,tsx}",
  "../../apps/dashboard/app/**/*.{ts,tsx}",
  "../../apps/dashboard/utils/**/*.{ts,tsx}",
  "../../packages/editor/src/**/*.{ts,tsx}",
];

const config: Config = {
  prefix: "hw-",
  content: files,
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: {
          light: "#dbeafe",
          DEFAULT: "#379BDA", //"#318BD0",
          dark: "#2B7ABF",
        },
      },
    },
  },
  plugins: [
    //forms
  ],
};
export default config;
