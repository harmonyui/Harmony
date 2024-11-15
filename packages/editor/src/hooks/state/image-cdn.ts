import { createHarmonySlice } from './factory'

export interface ImageCdnState {
  cdnImages?: string[]
  uploadImage?: (form: FormData) => Promise<string>
  setUploadImage: (value: (form: FormData) => Promise<string>) => void
}
export const createImageCDNSlice = createHarmonySlice<ImageCdnState>((set) => ({
  cdnImages: undefined,
  uploadImage: undefined,
  setUploadImage(value) {
    set({
      async uploadImage(...props) {
        const src = await value(...props)
        set((prev) => ({
          ...prev,
          cdnImages: prev.cdnImages ? [src, ...prev.cdnImages] : undefined,
        }))

        return src
      },
    })
  },
}))
