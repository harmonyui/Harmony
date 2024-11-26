import React, { useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { useHarmonyStore } from '../../../hooks/state'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { isImageElement } from '../../inspector/inspector'
import { ImageList } from '../../image/image-list'
import { useUploadImage } from '../../image/image-provider'

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
  const uploadImage = useHarmonyStore((state) => state.uploadImage)
  const { selectImage, setIsUploadModalOpen } = useUploadImage()
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  )

  const selectedComponent = useHarmonyStore((state) => {
    const selected = state.selectedComponent?.element
    if (selected && isImageElement(selected)) {
      return selected
    }
    return undefined
  })

  const onSave = (): void => {
    if (!selectedImage) {
      return
    }
    selectImage(selectedImage)
  }

  const onUpload = (): void => {
    setIsUploadModalOpen(true)
  }

  return (
    <>
      <div className='hw-flex hw-flex-col hw-justify-between hw-max-w-[300px] hw-h-full'>
        {selectedComponent ? (
          <>
            <ImageList
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />
            <div className='hw-flex hw-justify-end hw-mt-4'>
              {uploadImage ? (
                <Button onClick={onUpload} mode='secondary'>
                  Upload
                </Button>
              ) : null}
              <Button className='hw-ml-2' onClick={onSave}>
                Select
              </Button>
            </div>
          </>
        ) : (
          <div>Select an image to update</div>
        )}
      </div>
    </>
  )
}
