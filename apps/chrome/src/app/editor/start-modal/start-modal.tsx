import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { EDITOR_URL } from '@harmony/util/src/constants'
import { PageSelector } from './page-selector'

interface StartModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (branchId: string) => void
}
export const StartModal: React.FunctionComponent<StartModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  return (
    <HarmonyModal show={isOpen} onClose={onClose} maxWidthClassName='max-w-lg'>
      <div className='flex flex-col justify-between items-center mb-4 gap-6 text-base'>
        <div className='w-52 h-12'>
          <img className='w-full' src={`${EDITOR_URL}/Logo_navy.png`} />
        </div>
        <div className='w-full'>
          <PageSelector onOpenProject={onSelectProject} />
        </div>
      </div>
    </HarmonyModal>
  )
}
