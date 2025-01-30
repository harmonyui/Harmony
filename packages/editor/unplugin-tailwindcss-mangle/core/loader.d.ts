import { LoaderContext } from 'webpack';
import { Context } from '@tailwindcss-mangle/core';

declare const TailwindcssMangleWebpackLoader: (this: LoaderContext<{
    ctx: Context;
}>, source: string) => Promise<void>;

export { TailwindcssMangleWebpackLoader as default };
