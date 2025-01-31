"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/core/loader.ts
var _core = require('@tailwindcss-mangle/core');
var TailwindcssMangleWebpackLoader = async function(source) {
  const callback = this.async();
  const { ctx } = this.getOptions();
  const { code } = await _core.cssHandler.call(void 0, source, {
    ctx,
    id: this.resource
  });
  callback(null, code);
};
var loader_default = TailwindcssMangleWebpackLoader;


exports.default = loader_default;

module.exports = exports.default;
