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
        'grid gap-x-2 gap-y-4 overflow-auto max-h-[480px]',
        size === 'sm' ? 'grid-cols-3 ' : 'grid-cols-6',
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
          'col-span-1 hover:opacity-75 cursor-pointer border rounded-md bg-white',
          selected
            ? 'border-primary'
            : 'hover:border-gray-300  border-transparent',
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
      <img className='w-full h-full rounded-md' src={image} />
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
      className='flex items-center justify-center'
      onClick={onClick}
      selected={selected}
      ref={ref}
    ></CardContainer>
  )
}
