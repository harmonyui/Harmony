import { useMemo, useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { getClass } from '@harmony/util/src/utils/common'
import { recurseElements } from '../../utils/element-utils'
import { useHarmonyStore } from '../hooks/state'

export const AddImagePanel = () => {
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const imageTags = useMemo(() => {
    const images: string[] = []
    rootComponent &&
      recurseElements(rootComponent.element, [
        (element) => {
          if (element instanceof HTMLImageElement) {
            const src = element.src
            if (!images.includes(src)) {
              images.push(src)
            }
          }
        },
      ])

    return images
  }, [rootComponent])
  const [selectedImage, setSelectedImage] = useState<string>()

  const onImageClick = (image: string) => {
    if (image === selectedImage) {
      setSelectedImage(undefined)
      return
    }
    setSelectedImage(image)
  }

  return (
    <div className='hw-flex hw-flex-col hw-justify-between hw-max-w-[300px] hw-p-5 hw-h-full'>
      <div className='hw-grid hw-grid-cols-3 hw-gap-2'>
        {imageTags.map((image) => (
          <ImageCard
            selected={selectedImage === image}
            image={image}
            onClick={() => onImageClick(image)}
          />
        ))}
      </div>
      <div className='hw-flex hw-justify-end hw-mt-4'>
        <Button mode='secondary'>Cancel</Button>
        <Button className='hw-ml-2'>Save</Button>
      </div>
    </div>
  )
}

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
    <div
      className={getClass(
        'hw-col-span-1 hover:hw-opacity-75 hw-cursor-pointer hw-border hw-rounded-md hw-bg-gray-100',
        selected ? 'hw-border-primary' : 'hw-border-gray-300',
      )}
      onClick={onClick}
    >
      <img className='hw-w-full hw-h-full hw-rounded-md' src={image} />
    </div>
  )
}
