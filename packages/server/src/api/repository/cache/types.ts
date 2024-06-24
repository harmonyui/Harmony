export interface FileCacheKeyInfo {
  repo: string
  path: string
  ref: string
}

export interface IndexingCacheKeyInfo {
  repo: string
  ref: string
}

export interface GithubCache {
  getFileOrDirectoryContents: (
    keyInfo: FileCacheKeyInfo,
  ) => Promise<string | { path: string; type: string }[] | null>
  setFileOrDirectoryContents: (
    keyInfo: FileCacheKeyInfo,
    contents: string | { path: string; type: string }[],
  ) => Promise<void>
  getFileContents: (keyInfo: FileCacheKeyInfo) => Promise<string | null>
  setFileContents: (keyInfo: FileCacheKeyInfo, content: string) => Promise<void>
  getIndexingFiles: (keyInfo: IndexingCacheKeyInfo) => Promise<string[] | null>
  setIndexingFiles: (
    keyInfo: IndexingCacheKeyInfo,
    files: string[],
  ) => Promise<void>
}
