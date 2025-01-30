import "../chunk-3LGYGEJT.js";

// src/core/loader.ts
import { cssHandler } from "@tailwindcss-mangle/core";
var TailwindcssMangleWebpackLoader = async function(source) {
  const callback = this.async();
  const { ctx } = this.getOptions();
  const { code } = await cssHandler(source, {
    ctx,
    id: this.resource
  });
  callback(null, code);
};
var loader_default = TailwindcssMangleWebpackLoader;
export {
  loader_default as default
};
