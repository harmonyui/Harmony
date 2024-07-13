/** @typedef  {import("prettier").Config} PrettierConfig */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig } */
const config = {
  plugins: ["prettier-plugin-prisma"],
  overrides: [
    {
      files: "*.{js,ts,jsx,tsx}",
      options: {
        semi: false,
        singleQuote: true,
        jsxSingleQuote: true,
      },
    },
  ],
};

export default config;
