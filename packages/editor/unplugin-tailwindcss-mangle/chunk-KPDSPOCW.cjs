"use strict";Object.defineProperty(exports, "__esModule", {value: true});



var _chunkDKIKMCW5cjs = require('./chunk-DKIKMCW5.cjs');

// src/core/plugin.ts
var _unplugin = require('unplugin');

// src/core/factory.ts
var _pluginutils = require('@rollup/pluginutils');
var _core = require('./@tailwindcss-mangle/core/index.cjs');
var _iscssrequest = require('is-css-request');
var WEBPACK_LOADER = _chunkDKIKMCW5cjs.path.resolve(__dirname, false ? "../../dist/core/loader.cjs" : "core/loader.cjs");
var factory = (options) => {
  const ctx = new (0, _core.Context)();
  let filter = (_id) => true;
  return [
    {
      name: `${_chunkDKIKMCW5cjs.pluginName}:pre`,
      enforce: "pre",
      async buildStart() {
        await ctx.initConfig({
          mangleOptions: options
        });
        filter = _pluginutils.createFilter.call(void 0, ctx.options.include, ctx.options.exclude);
      }
    },
    {
      name: `${_chunkDKIKMCW5cjs.pluginName}`,
      transformInclude(id) {
        return filter(id);
      },
      async transform(code, id) {
        const opts = {
          ctx,
          id
        };
        if (/\.[jt]sx?(?:$|\?)/.test(id)) {
          return _core.jsHandler.call(void 0, code, opts);
        } else if (/\.(?:vue|svelte)(?:$|\?)/.test(id)) {
          if (_iscssrequest.isCSSRequest.call(void 0, id)) {
            return await _core.cssHandler.call(void 0, code, opts);
          } else {
            return _core.jsHandler.call(void 0, code, opts);
          }
        } else if (_iscssrequest.isCSSRequest.call(void 0, id)) {
          return await _core.cssHandler.call(void 0, code, opts);
        } else if (/\.html?/.test(id)) {
          return _core.htmlHandler.call(void 0, code, opts);
        }
      },
      webpack(compiler) {
        const { NormalModule } = compiler.webpack;
        const isExisted = true;
        compiler.hooks.compilation.tap(_chunkDKIKMCW5cjs.pluginName, (compilation) => {
          NormalModule.getCompilationHooks(compilation).loader.tap(_chunkDKIKMCW5cjs.pluginName, (_loaderContext, module) => {
            if (isExisted) {
              const idx = module.loaders.findIndex((x) => x.loader.includes("postcss-loader"));
              if (idx > -1) {
                module.loaders.splice(idx, 0, {
                  loader: WEBPACK_LOADER,
                  ident: null,
                  options: {
                    ctx
                  },
                  type: null
                });
              }
            }
          });
        });
      }
    },
    {
      name: `${_chunkDKIKMCW5cjs.pluginName}:post`,
      enforce: "post",
      vite: {
        transformIndexHtml(html) {
          const { code } = _core.htmlHandler.call(void 0, html, { ctx });
          return code;
        }
        // generateBundle: {
        //   async handler(options, bundle) {
        //     const groupedEntries = getGroupedEntries(Object.entries(bundle))
        //     if (Array.isArray(groupedEntries.css) && groupedEntries.css.length > 0) {
        //       for (let i = 0; i < groupedEntries.css.length; i++) {
        //         const [id, cssSource] = groupedEntries.css[i] as [string, OutputAsset]
        //         const { code } = await cssHandler(cssSource.source.toString(), {
        //           id,
        //           ctx,
        //         })
        //         cssSource.source = code
        //       }
        //     }
        //   },
        // },
      },
      webpack(compiler) {
        const { Compilation, sources } = compiler.webpack;
        const { ConcatSource } = sources;
        compiler.hooks.compilation.tap(_chunkDKIKMCW5cjs.pluginName, (compilation) => {
          compilation.hooks.processAssets.tapPromise(
            {
              name: _chunkDKIKMCW5cjs.pluginName,
              stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
            },
            async (assets) => {
              const groupedEntries = _chunkDKIKMCW5cjs.getGroupedEntries.call(void 0, Object.entries(assets));
              if (groupedEntries.css.length > 0) {
                for (let i = 0; i < groupedEntries.css.length; i++) {
                  const [id, cssSource] = groupedEntries.css[i];
                  const { code } = await _core.cssHandler.call(void 0, cssSource.source().toString(), {
                    id,
                    ctx
                  });
                  const source = new ConcatSource(code);
                  compilation.updateAsset(id, source);
                }
              }
            }
          );
        });
      },
      writeBundle() {
        ctx.dump();
      }
    }
  ];
};
var factory_default = factory;

// src/core/plugin.ts
var unplugin = _unplugin.createUnplugin.call(void 0, factory_default);
var plugin_default = unplugin;



exports.plugin_default = plugin_default;
