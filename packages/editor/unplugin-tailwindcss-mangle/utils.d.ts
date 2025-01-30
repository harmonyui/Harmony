export { defaultMangleClassFilter, isMap, isRegexp } from '@tailwindcss-mangle/shared';

declare function escapeStringRegexp(str: string): string;
declare function getGroupedEntries<T>(entries: [string, T][], options?: {
    cssMatcher(file: string): boolean;
    htmlMatcher(file: string): boolean;
    jsMatcher(file: string): boolean;
}): Record<"css" | "html" | "js" | "other", [string, T][]>;
declare function getCacheDir(basedir?: string): string;
declare function ensureDir(p: string): Promise<void>;

export { ensureDir, escapeStringRegexp, getCacheDir, getGroupedEntries };
