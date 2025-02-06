import { TransformResult } from 'unplugin';
import * as _tailwindcss_mangle_config from '@tailwindcss-mangle/config';
import { MangleUserConfig } from '@tailwindcss-mangle/config';
import { ClassGenerator } from '@tailwindcss-mangle/shared';
export { ClassGenerator } from '@tailwindcss-mangle/shared';
import MagicString from 'magic-string';
import { StringLiteral, TemplateElement } from '@babel/types';

interface InitConfigOptions {
    cwd?: string;
    classList?: string[];
    mangleOptions?: MangleUserConfig;
}
declare class Context {
    options: MangleUserConfig;
    replaceMap: Map<string, string>;
    classSet: Set<string>;
    classGenerator: ClassGenerator;
    preserveFunctionSet: Set<string>;
    preserveClassNamesSet: Set<string>;
    preserveFunctionRegexs: RegExp[];
    constructor();
    isPreserveClass(className: string): boolean;
    addPreserveClass(className: string): Set<string>;
    isPreserveFunction(calleeName: string): boolean;
    private mergeOptions;
    currentMangleClassFilter(className: string): boolean;
    getClassSet(): Set<string>;
    getReplaceMap(): Map<string, string>;
    addToUsedBy(key: string, file?: string): void;
    loadClassSet(classList: string[]): void;
    initConfig(opts?: InitConfigOptions): Promise<_tailwindcss_mangle_config.UserConfig>;
    dump(): Promise<void>;
}

interface IClassGeneratorContextItem {
    name: string;
    usedBy: string[];
}
interface IClassGeneratorOptions {
    reserveClassName?: (string | RegExp)[];
    customGenerate?: (original: string, opts: IClassGeneratorOptions, context: Record<string, any>) => string | undefined;
    log?: boolean;
    exclude?: (string | RegExp)[];
    include?: (string | RegExp)[];
    ignoreClass?: (string | RegExp)[];
    classPrefix?: string;
}
interface IHandler {
    (code: string, options: IHandlerOptions): IHandlerTransformResult;
}
type IHandlerTransformResult = Exclude<TransformResult, null | undefined | string | void>;
interface IHandlerOptions {
    ctx: Context;
    id?: string;
}
interface IHtmlHandlerOptions extends IHandlerOptions {
}
interface IJsHandlerOptions extends IHandlerOptions {
    splitQuote?: boolean;
}
interface ICssHandlerOptions extends IHandlerOptions {
    ignoreVueScoped?: boolean;
}

declare function cssHandler(rawSource: string, options: ICssHandlerOptions): Promise<IHandlerTransformResult>;

declare function htmlHandler(raw: string | MagicString, options: IHtmlHandlerOptions): IHandlerTransformResult;

declare function handleValue(raw: string, node: StringLiteral | TemplateElement, options: IJsHandlerOptions, ms: MagicString, offset: number, escape: boolean): string | undefined;
declare function jsHandler(rawSource: string | MagicString, options: IJsHandlerOptions): IHandlerTransformResult;

export { Context, type IClassGeneratorContextItem, type IClassGeneratorOptions, type ICssHandlerOptions, type IHandler, type IHandlerOptions, type IHandlerTransformResult, type IHtmlHandlerOptions, type IJsHandlerOptions, cssHandler, handleValue, htmlHandler, jsHandler };
