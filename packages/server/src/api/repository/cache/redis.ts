import Redis from 'ioredis'
import type {
  FileCacheKeyInfo,
  GithubCache,
  IndexingCacheKeyInfo,
} from './types'

export class RedisGithubCache implements GithubCache {
  private redisClient: Redis
  constructor() {
    this.redisClient = new Redis({
      port: Number(process.env.REDIS_PORT || 0), // Redis port
      host: process.env.REDIS_HOST, // Redis host
      password: process.env.REDIS_PASSWORD,
    })
  }

  public async getFileContents(
    keyInfo: FileCacheKeyInfo,
  ): Promise<string | null> {
    const cacheKey = this.getFileCacheKey(keyInfo)
    const cachedFile = await this.redisClient.get(cacheKey)

    return cachedFile
  }

  public async setFileContents(
    keyInfo: FileCacheKeyInfo,
    content: string,
  ): Promise<void> {
    const cacheKey = this.getFileCacheKey(keyInfo)
    await this.redisClient.set(cacheKey, content)
  }

  public async getFileOrDirectoryContents(
    keyInfo: FileCacheKeyInfo,
  ): Promise<string | { path: string; type: string }[] | null> {
    const cacheKey = this.getFileCacheKey(keyInfo)
    const type = await this.redisClient.type(cacheKey)
    if (type === 'none') return null

    if (type === 'string') {
      return this.getFileContents(keyInfo)
    }

    const files = await this.redisClient.smembers(cacheKey)

    const contents = files.map((file) => {
      const [path, fileType] = file.split(':')

      return { path, type: fileType }
    })

    if (contents.some((content) => !content.type)) return null

    return contents
  }

  public async setFileOrDirectoryContents(
    keyInfo: FileCacheKeyInfo,
    contentOrFiles: string | { path: string; type: string }[],
  ): Promise<void> {
    const cacheKey = this.getFileCacheKey(keyInfo)

    let type = await this.redisClient.type(cacheKey)
    if (type === 'none') {
      type = typeof contentOrFiles === 'string' ? 'string' : 'set'
    }
    if (type === 'string') {
      if (typeof contentOrFiles !== 'string')
        throw new Error('Must be file content when setting a file')

      await this.setFileContents(keyInfo, contentOrFiles)
      return
    }

    if (typeof contentOrFiles === 'string')
      throw new Error('Must be file content when setting a file')

    await this.redisClient.sadd(
      cacheKey,
      ...contentOrFiles.map((content) => `${content.path}:${content.type}`),
    )
  }

  public async getIndexingFiles(
    keyInfo: IndexingCacheKeyInfo,
  ): Promise<string[] | null> {
    const cacheKey = this.getIndexingCacheKey(keyInfo)

    const files = await this.redisClient.smembers(cacheKey)
    return files.length > 0 ? files : null
  }
  public async setIndexingFiles(
    keyInfo: IndexingCacheKeyInfo,
    files: string[],
  ): Promise<void> {
    const cacheKey = this.getIndexingCacheKey(keyInfo)
    await this.redisClient.sadd(cacheKey, ...files)
  }

  private getFileCacheKey({ repo, ref, path }: FileCacheKeyInfo): string {
    const cacheKey = `${repo}:${ref}:${path}`

    return cacheKey
  }

  private getIndexingCacheKey({ repo, ref }: IndexingCacheKeyInfo): string {
    const cacheKey = `${repo}:${ref}`

    return cacheKey
  }
}
