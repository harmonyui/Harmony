import { forwardRef, useEffect, useRef } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { useUploadImage } from './image-provider'

export const ImageList: React.FunctionComponent<{
  selectedImage: string | undefined
  setSelectedImage: (selectedImage: string | undefined) => void
  size?: 'sm' | 'lg'
}> = ({ selectedImage, setSelectedImage, size = 'sm' }) => {
  const { imageTags, svgTags } = useUploadImage()

  const onImageClick = (image: string) => {
    if (image === selectedImage) {
      setSelectedImage(undefined)
      return
    }
    setSelectedImage(image)
  }
  return (
    <div
      className={getClass(
        'hw-grid hw-gap-x-2 hw-gap-y-4 hw-overflow-auto hw-max-h-[480px]',
        size === 'sm' ? 'hw-grid-cols-3 ' : 'hw-grid-cols-6',
      )}
    >
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
