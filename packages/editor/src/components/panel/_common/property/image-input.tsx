import { Button } from '@harmony/ui/src/components/core/button'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { useState } from 'react'
import { ImageList } from '../../../image/image-list'
import { useUploadImage } from '../../../image/image-provider'
import type { PropertyInputComponent } from './types'

export const ImageInput: PropertyInputComponent<string> = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <div className='hw-col-span-2'>
        <Button onClick={() => setIsOpen(true)}>Select Image</Button>
      </div>
      <SelectImageModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

const SelectImageModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  )
  const { setIsUploadModalOpen, selectImage } = useUploadImage()

  const onSelect = () => {
    if (!selectedImage) return

    selectImage(selectedImage)
    onClose()
  }
  return (
    <HarmonyModal show={isOpen} onClose={onClose} editor>
      <ImageList
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        size='lg'
      />
      <div className='flex gap-2 hw-justify-end hw-mt-4'>
        <Button mode='secondary' onClick={() => setIsUploadModalOpen(true)}>
          Upload
        </Button>
        <Button onClick={onSelect} disabled={!selectImage}>
          Select
        </Button>
      </div>
    </HarmonyModal>
  )
}
