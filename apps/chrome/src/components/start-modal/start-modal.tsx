import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
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
    <HarmonyModal
      show={isOpen}
      onClose={onClose}
      maxWidthClassName='hw-max-w-lg'
    >
      <div className='hw-flex hw-flex-col hw-justify-between hw-items-center hw-mb-4 hw-gap-6 hw-text-base'>
        <div className='hw-w-52 hw-h-12'>
          <img className='hw-w-full' src={`${EDITOR_URL}/Logo_navy.png`} />
        </div>
        <SignedOut>
          <SignInButton mode='modal' />
        </SignedOut>
        <SignedIn>
          <div className='hw-w-full'>
            <PageSelector onOpenProject={onSelectProject} />
          </div>
        </SignedIn>
      </div>
    </HarmonyModal>
  )
}
