'use server'

import { unstable_cache as unstableCache } from 'next/cache'

export const getThumbnail = unstableCache(
  async (url: string): Promise<string> => {
    const response = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`,
    )
    if (!response.ok) {
      throw new Error('There was an error fetching the thumbnail')
    }

    const json = (await response.json()) as {
      data: { screenshot: { url: string } }
    }
    const thumbnailImage = json.data.screenshot.url

    return thumbnailImage
  },
  undefined,
  {
    revalidate: 3600,
  },
)
