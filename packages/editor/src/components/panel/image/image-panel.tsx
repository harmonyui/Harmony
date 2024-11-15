import React, { useRef, useMemo, useState, useEffect, forwardRef } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { getClass } from '@harmony/util/src/utils/common'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import {
  getComponentIdAndChildIndex,
  getImageSrc,
  recurseElements,
} from '../../../utils/element-utils'
import { useHarmonyStore } from '../../../hooks/state'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import type { ComponentUpdateWithoutGlobal } from '../../harmony-context'
import { useHarmonyContext } from '../../harmony-context'
import { Panels } from '../_common/panel/types'
import { isImageElement } from '../../inspector/inspector'
import { UploadImageModal } from './upload-image-modal'

export type ImageType = 'image' | 'svg'

export const ImagePanel: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  if (isDemo || isDemo === undefined) return null

  return (
    <DraggablePanel title='Images' id={Panels.Image} defaultActive={false}>
      <AddImagePanel />
    </DraggablePanel>
  )
}

export const AddImagePanel: React.FunctionComponent = () => {
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const cdnImages = useHarmonyStore((state) => state.cdnImages)
  const uploadImage = useHarmonyStore((state) => state.uploadImage)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const selectedComponent = useHarmonyStore((state) => {
    const selected = state.selectedComponent?.element
    if (selected && isImageElement(selected)) {
      return selected
    }
    return undefined
  })
  const { onAttributesChange } = useHarmonyContext()

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
          if (element.tagName.toLowerCase() === 'svg') {
            const data = element.outerHTML
            if (!svgs.includes(data)) {
              svgs.push(data)
            }
          }
        },
      ])

    return { imageTags: images, svgTags: svgs }
  }, [rootComponent, cdnImages])

  const [selectedImage, setSelectedImage] = useState<string>()

  const onImageClick = (image: string) => {
    if (image === selectedImage) {
      setSelectedImage(undefined)
      return
    }
    setSelectedImage(image)
  }

  const handleAddImage = useEffectEvent((value: string, type: ImageType) => {
    if (!selectedComponent) return
    const { childIndex, componentId } =
      getComponentIdAndChildIndex(selectedComponent)
    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'replace-element',
      componentId,
      childIndex,
      oldValue: JSON.stringify({ type, value: '' }),
      value: JSON.stringify({ type, value }),
    }
    onAttributesChange([update])
  })

  const onSave = (): void => {
    if (!selectedImage) {
      return
    }
    const type = imageTags.includes(selectedImage) ? 'image' : 'svg'
    handleAddImage(selectedImage, type)
  }

  const onUpload = (): void => {
    setIsUploadModalOpen(true)
  }

  return (
    <>
      <div className='hw-flex hw-flex-col hw-justify-between hw-max-w-[300px] hw-h-full'>
        {selectedComponent ? (
          <>
            <div className='hw-grid hw-grid-cols-3 hw-gap-x-2 hw-gap-y-4 hw-overflow-auto hw-max-h-[480px]'>
              {imageTags.map((image) => (
                <ImageCard
                  key={image}
                  selected={selectedImage === image}
                  image={image}
                  onClick={() => onImageClick(image)}
                />
              ))}
              {svgTags.map((svg) => (
                <SVGCard
                  key={svg}
                  selected={selectedImage === svg}
                  svg={svg}
                  onClick={() => onImageClick(svg)}
                />
              ))}
            </div>
            <div className='hw-flex hw-justify-end hw-mt-4'>
              {uploadImage ? <Button onClick={onUpload}>Upload</Button> : null}
              <Button className='hw-ml-2' onClick={onSave}>
                Select
              </Button>
            </div>
          </>
        ) : (
          <div>Select an image to update</div>
        )}
      </div>
      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  )
}

interface CardContainerProps {
  className?: string
  onClick: () => void
  selected?: boolean
  children?: React.ReactNode
}
const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(
  ({ children, onClick, selected, className }, ref) => {
    return (
      <div
        className={getClass(
          'hw-col-span-1 hover:hw-opacity-75 hw-cursor-pointer hw-border hw-rounded-md hw-bg-white',
          selected
            ? 'hw-border-primary'
            : 'hover:hw-border-gray-300  hw-border-transparent',
          className,
        )}
        onClick={onClick}
        ref={ref}
      >
        {children}
      </div>
    )
  },
)

interface ImageCardProps {
  image: string
  onClick: () => void
  selected?: boolean
}
const ImageCard: React.FunctionComponent<ImageCardProps> = ({
  image,
  onClick,
  selected,
}) => {
  return (
    <CardContainer onClick={onClick} selected={selected}>
      <img className='hw-w-full hw-h-full hw-rounded-md' src={image} />
    </CardContainer>
  )
}

interface SVGCardProps {
  svg: string
  onClick: () => void
  selected?: boolean
}
const SVGCard: React.FunctionComponent<SVGCardProps> = ({
  svg,
  onClick,
  selected,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = svg
    }
  }, [ref])

  return (
    <CardContainer
      className='hw-flex hw-items-center hw-justify-center'
      onClick={onClick}
      selected={selected}
      ref={ref}
    ></CardContainer>
  )
}
