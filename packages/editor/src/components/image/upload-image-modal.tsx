import { Header } from '@harmony/ui/src/components/core/header'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { UploadFile } from '@harmony/ui/src/components/core/upload-file'
import { useHarmonyStore } from '../../hooks/state'

interface UploadImageModalProps {
  isOpen: boolean
  onClose: () => void
}
export const UploadImageModal: React.FunctionComponent<
  UploadImageModalProps
> = ({ isOpen, onClose }) => {
  const uploadImage = useHarmonyStore((state) => state.uploadImage)
  if (!uploadImage) return null

  const onUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    await uploadImage(formData)
    onClose()
  }
  return (
    <HarmonyModal show={isOpen} onClose={onClose} editor>
      <Header>Upload Image</Header>
      <UploadFile onChange={onUpload} />
    </HarmonyModal>
  )
}
