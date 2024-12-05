import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useHarmonyStore } from '../../hooks/state'
import { getImageSrc, recurseElements } from '../../utils/element-utils'
import { useHarmonyContext } from '../harmony-context'
import type { ImageType } from '../panel/image/image-panel'
import { UploadImageModal } from './upload-image-modal'

interface UploadImageContextProps {
  isUploadModalOpen: boolean
  setIsUploadModalOpen: (isOpen: boolean) => void
}
const UploadImageContext = createContext<UploadImageContextProps | undefined>(
  undefined,
)

export const UploadImageProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  return (
    <UploadImageContext.Provider
      value={{ isUploadModalOpen, setIsUploadModalOpen }}
    >
      {children}
      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </UploadImageContext.Provider>
  )
}

export const useUploadImage = () => {
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const cdnImages = useHarmonyStore((state) => state.cdnImages)
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const { onElementPropertyChange: onPropertyChange } = useHarmonyContext()
  const contextProps = useContext(UploadImageContext)

  const { imageTags, svgTags } = useMemo(() => {
    const images: string[] = cdnImages || []
    const svgs: string[] = []
    rootComponent &&
      recurseElements(rootComponent.element, [
        (element) => {
          if (element instanceof HTMLImageElement) {
            const src = getImageSrc(element)
            if (!images.includes(src)) {
              images.push(src)
            }
            const harmonySrc = element.dataset.harmonySrc
            if (harmonySrc && !images.includes(harmonySrc)) {
              images.push(harmonySrc)
            }
          }
          // if (element.tagName.toLowerCase() === 'svg') {
          //   const data = element.outerHTML
          //   if (!svgs.includes(data)) {
          //     svgs.push(data)
          //   }
          // }
        },
      ])

    return { imageTags: images, svgTags: svgs }
  }, [rootComponent, cdnImages])

  const handleAddImage = useEffectEvent((value: string, _type: ImageType) => {
    onPropertyChange('src', value, selectedComponent?.element)
  })

  const selectImage = useCallback(
    (image: string): void => {
      const type = imageTags.includes(image) ? 'image' : 'svg'
      handleAddImage(image, type)
    },
    [handleAddImage, imageTags],
  )

  if (!contextProps) {
    throw new Error('UploadImageContext is not provided')
  }

  return { selectImage, imageTags, svgTags, ...contextProps }
}
