import { type SearchOptions } from 'flexsearch'

declare module '@/markdoc/search.mjs' {
  export interface Result extends Record<string, unknown> {
    url: string
    title: string
    pageTitle?: string
  }

  export function search(query: string, options?: SearchOptions): Result[]
}
