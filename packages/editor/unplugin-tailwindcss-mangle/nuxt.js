import {
  plugin_default
} from "./chunk-EP3UY5UD.js";
import "./chunk-4S5PKHEQ.js";
import "./chunk-3LGYGEJT.js";

// src/nuxt.ts
function nuxt_default(options = {}, nuxt) {
  nuxt.hook("webpack:config", (config) => {
    config.plugins = config.plugins || [];
    config.plugins.unshift(plugin_default.webpack(options));
  });
  nuxt.hook("vite:extendConfig", (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(plugin_default.vite(options));
  });
}
export {
  nuxt_default as default
};
