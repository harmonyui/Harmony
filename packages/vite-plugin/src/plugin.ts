import type { Plugin } from 'vite'
import { transformSync } from '@babel/core'
import { isValidPath } from '@harmony/util/src/utils/common'
import type { PluginOptions } from 'babel-plugin-harmony/src/babel-plugin'
import harmonyPlugin from 'babel-plugin-harmony/src/babel-plugin'

type HarmonyOptions = PluginOptions['opts']
const harmony = (options: HarmonyOptions): Plugin => {
  const repushPlugin = (
    plugins: Plugin[],
    pluginName: string,
    pluginNames: string[],
  ): void => {
    const namesSet = new Set(pluginNames)

    let baseIndex = -1
    let targetIndex = -1
    let targetPlugin: Plugin
    for (let i = 0, len = plugins.length; i < len; i += 1) {
      const current = plugins[i]
      if (namesSet.has(current.name) && baseIndex === -1) {
        baseIndex = i
      }
      if (current.name === pluginName) {
        targetIndex = i
        targetPlugin = current
      }
    }
    if (baseIndex !== -1 && targetIndex !== -1 && baseIndex < targetIndex) {
      plugins.splice(targetIndex, 1)
      plugins.splice(baseIndex, 0, targetPlugin!)
    }
  }
  return {
    name: 'harmony-plugin',
    configResolved(config) {
      // run our plugin before the following plugins:
      repushPlugin(config.plugins as Plugin[], 'harmony-plugin', [
        'million',
        // https://github.com/withastro/astro/blob/main/packages/astro/src/vite-plugin-jsx/index.ts#L173
        'astro:jsx',
        // https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react
        'vite:react-babel',
        'vite:react-jsx',
        // https://github.com/preactjs/preset-vite/blob/main/src/index.ts
        'vite:preact-jsx',
        // https://github.com/vitejs/vite-plugin-react-swc/blob/main/src/index.ts
        'vite:react-swc',
      ])
    },
    transform(code, id) {
      if (!isValidPath(id.substring(1))) return

      const result = transformSync(code, {
        plugins: [[harmonyPlugin, options]],
        parserOpts: { plugins: ['jsx', 'typescript'] },
        filename: id,
        ast: false,
        sourceFileName: id,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
      })
      if (!result) {
        throw new Error('Unable to transform code')
      }
      return { code: result.code || '', map: result.map }
    },
  }
}

export default harmony
