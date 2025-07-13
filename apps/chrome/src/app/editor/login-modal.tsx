import { Button } from '@harmony/ui/src/components/core/button'
import { FC } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@harmony/ui/src/components/shadcn/dialog'
import { sendMessage } from '../../utils/listeners'
import { Actions } from '../../utils/actions'

interface LoginModalProps {
  show: boolean
  tabId: number
  onTryAgain: () => void
}

export const LoginModal: FC<LoginModalProps> = ({
  show,
  tabId,
  onTryAgain,
}) => {
  const handleLogin = () => {
    sendMessage({
      action: Actions.AuthTab,
      payload: {
        tabId,
      },
    })
  }
  return (
    <Dialog
      open={show}
      onOpenChange={() => undefined} // Prevent closing the modal
    >
      <DialogContent noClose>
        <DialogHeader>Login to Harmony</DialogHeader>
        <DialogDescription>
          Click the button below to login to Harmony.
        </DialogDescription>
        <DialogFooter>
          <Button mode='secondary' onClick={onTryAgain}>
            Try again
          </Button>
          <Button onClick={handleLogin}>Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
