"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkKPDSPOCWcjs = require('./chunk-KPDSPOCW.cjs');
require('./chunk-DKIKMCW5.cjs');

// src/nuxt.ts
function nuxt_default(options = {}, nuxt) {
  nuxt.hook("webpack:config", (config) => {
    config.plugins = config.plugins || [];
    config.plugins.unshift(_chunkKPDSPOCWcjs.plugin_default.webpack(options));
  });
  nuxt.hook("vite:extendConfig", (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(_chunkKPDSPOCWcjs.plugin_default.vite(options));
  });
}


exports.default = nuxt_default;

module.exports = exports.default;
