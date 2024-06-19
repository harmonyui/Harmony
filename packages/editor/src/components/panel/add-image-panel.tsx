import React, { useRef, useMemo, useState, useEffect, forwardRef } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { getClass } from '@harmony/util/src/utils/common'
import { SideDrawer } from '@harmony/ui/src/components/core/side-drawer'
import { recurseElements } from '../../utils/element-utils'
import { useHarmonyStore } from '../hooks/state'

type ImageType = 'image' | 'svg'

interface AddImagePanelProps {
  isOpen: boolean
  onSave: (image: string, type: ImageType) => void
  onClose: () => void
}
export const AddImagePanel: React.FunctionComponent<AddImagePanelProps> = ({
  isOpen,
  onSave: onSaveProps,
  onClose,
}) => {
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const { imageTags, svgTags } = useMemo(() => {
    const images: string[] = []
    const svgs: string[] = []
    rootComponent &&
      recurseElements(rootComponent.element, [
        (element) => {
          if (element instanceof HTMLImageElement) {
            const src = element.src
            if (!images.includes(src)) {
              images.push(src)
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
  }, [rootComponent])

  const [selectedImage, setSelectedImage] = useState<string>()

  const onImageClick = (image: string) => {
    if (image === selectedImage) {
      setSelectedImage(undefined)
      return
    }
    setSelectedImage(image)
  }

  const onSave = (): void => {
    if (!selectedImage) {
      return
    }
    const type = imageTags.includes(selectedImage) ? 'image' : 'svg'
    onSaveProps(selectedImage, type)
  }

  return (
    <SideDrawer header='Images' isOpen={isOpen} onClose={onClose}>
      <div className='hw-flex hw-flex-col hw-justify-between hw-max-w-[300px] hw-h-full'>
        <div className='hw-grid hw-grid-cols-3 hw-gap-x-2 hw-gap-y-4'>
          {imageTags.map((image) => (
            <ImageCard
              selected={selectedImage === image}
              image={image}
              onClick={() => onImageClick(image)}
            />
          ))}
          {svgTags.map((svg) => (
            <SVGCard
              selected={selectedImage === svg}
              svg={svg}
              onClick={() => onImageClick(svg)}
            />
          ))}
        </div>
        <div className='hw-flex hw-justify-end hw-mt-4'>
          <Button mode='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button className='hw-ml-2' onClick={onSave}>
            Select
          </Button>
        </div>
      </div>
    </SideDrawer>
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
