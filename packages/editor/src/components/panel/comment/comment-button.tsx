import { ChatTeardropOutlineIcon } from '@harmony/ui/src/components/core/icons'
import { useHarmonyContext } from '../../../components/harmony-context'
import { useHotKeys } from '../../../hooks/hotkeys'
import { useEffect } from 'react'

export const useCommentButton = () => {
  const { isComment, onToggleComment, isToggled } = useHarmonyContext()

  useHotKeys('C', onToggleComment)

  useEffect(() => {
    if (!isToggled && isComment) {
      onToggleComment()
    }
  }, [isToggled, isComment, onToggleComment])

  return {
    icon: ChatTeardropOutlineIcon,
    onClick: onToggleComment,
    active: isComment,
  }
}
