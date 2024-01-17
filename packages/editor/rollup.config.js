import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias'
import path from 'node:path';

export default {
  input: 'src/index.ts', // Entry point of your library
  output: {
    file: 'dist/my-library.js',
    format: 'umd', // Universal Module Definition (works as CommonJS, AMD, and for browser globals)
    name: 'MyLibrary', // Global variable name when used as a script tag
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    alias({
        entries: [
            {find: '@harmony/ui', replacement: path.join(__dirname, '../ui')},
            {find: '@harmony/util', replacement: path.join(__dirname, '../util')}
        ],
        customResolver: resolve({
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        })
    }),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      presets: ['@babel/preset-env', '@babel/preset-react'],
    }),
    
  ],
  external: ['react', 'react-dom', 'react/jsx-runtime'], // Specify dependencies that shouldn't be bundled
//   external: (id) => {
//     // Exclude external node modules but include local @harmony/ui and @harmony/util
//     return !/^\.{0,2}\//.test(id) && !id.startsWith('@harmony/');
//   },
};
