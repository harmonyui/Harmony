import Redis from 'ioredis';

interface FileCacheKeyInfo {
    repo: string, 
    path: string,
    ref: string
}

interface IndexingCacheKeyInfo {
    repo: string,
    ref: string
}

export interface GithubCache {
    getFileOrDirectoryContents: (keyInfo: FileCacheKeyInfo) => Promise<string | string[] | null>;
    setFileOrDirectoryContents: (keyInfo: FileCacheKeyInfo, contents: string | string[]) => Promise<void>;
    getFileContents: (keyInfo: FileCacheKeyInfo) => Promise<string | null>;
    setFileContents: (keyInfo: FileCacheKeyInfo, content: string) => Promise<void>;
    getIndexingFiles: (keyInfo: IndexingCacheKeyInfo) => Promise<string[] | null>;
    setIndexingFiles: (keyInfo: IndexingCacheKeyInfo, files: string[]) => Promise<void>;
}

export class RedisGithubCache implements GithubCache {
    private redisClient: Redis;
    constructor() {
        this.redisClient = new Redis({
            port: Number(process.env.REDIS_PORT || 0), // Redis port
            host: process.env.REDIS_HOST, // Redis host
            password: process.env.REDIS_PASSWORD,
        })
    }

    public async getFileContents(keyInfo: FileCacheKeyInfo): Promise<string | null> {
        const cacheKey = this.getFileCacheKey(keyInfo);
        const cachedFile = await this.redisClient.get(cacheKey);
    
        return cachedFile;
    }

    public async setFileContents(keyInfo: FileCacheKeyInfo, content: string): Promise<void> {
        const cacheKey = this.getFileCacheKey(keyInfo);
        await this.redisClient.set(cacheKey, content);
    }

    public async getFileOrDirectoryContents(keyInfo: FileCacheKeyInfo): Promise<string | string[] | null> {
        const cacheKey = this.getFileCacheKey(keyInfo);
        const type = await this.redisClient.type(cacheKey); 
        if (type === 'string') {
            return this.getFileContents(keyInfo);
        }

       return this.redisClient.smembers(cacheKey);
    }

    public async setFileOrDirectoryContents(keyInfo: FileCacheKeyInfo, contentOrFiles: string | string[]): Promise<void> {
        const cacheKey = this.getFileCacheKey(keyInfo);
        
        const type = await this.redisClient.type(cacheKey);
        if (type === 'string') {
            if (typeof contentOrFiles !== 'string') throw new Error("Must be file content when setting a file");

            await this.setFileContents(keyInfo, contentOrFiles);
            return;
        }

        if (typeof contentOrFiles === 'string') throw new Error("Must be file content when setting a file"); 

        await this.redisClient.sadd(cacheKey, ...contentOrFiles);
    }

    public async getIndexingFiles(keyInfo: IndexingCacheKeyInfo): Promise<string[] | null> {
        const cacheKey = this.getIndexingCacheKey(keyInfo);

        const files = await this.redisClient.smembers(cacheKey);
        return files.length > 0 ? files : null;
    }
    public async setIndexingFiles(keyInfo: IndexingCacheKeyInfo, files: string[]): Promise<void> {
        const cacheKey = this.getIndexingCacheKey(keyInfo);
        await this.redisClient.sadd(cacheKey, ...files);
    }

    private getFileCacheKey({repo, ref, path}: FileCacheKeyInfo): string {
        const cacheKey = `${repo}:${ref}:${path}`;

        return cacheKey;
    }

    private getIndexingCacheKey({repo, ref}: IndexingCacheKeyInfo): string {
        const cacheKey = `${repo}:${ref}`;

        return cacheKey;
    }
}
