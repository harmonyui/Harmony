/* eslint-disable @typescript-eslint/require-await -- ok*/
/* eslint-disable @typescript-eslint/no-unused-vars -- ok */
//import Redis from 'ioredis';

//const redisClient = new Redis();

interface CacheKeyInfo {
    repo: string, 
    path: string,
    ref: string
}

const getCacheKey = ({repo, path, ref}: CacheKeyInfo): string => {
    const cacheKey = `${repo}:${ref}:${path}`;

    return cacheKey;
}

export const getFileContentsFromCache = async (keyInfo: CacheKeyInfo): Promise<string | null> => {
    //const cacheKey = getCacheKey(keyInfo);
    //const cachedFile = await redisClient.get(cacheKey);
  
    //return cachedFile;

    return null;
}

export const setFileCache = async (keyInfo: CacheKeyInfo, content: string): Promise<void> => {
    //const cacheKey = getCacheKey(keyInfo);
    //await redisClient.set(cacheKey, content);
}