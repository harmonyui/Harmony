import {
  ChainLinkIcon,
  ChainLinkSlashIcon,
} from '@harmony/ui/src/components/core/icons'
import { ButtonGroupButton } from './button-group'

export const LinkButton: React.FunctionComponent<{
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
}> = ({ isExpanded, setIsExpanded }) => {
  return (
    <ButtonGroupButton show={false} onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? (
        <ChainLinkIcon className='w-4 h-4' />
      ) : (
        <ChainLinkSlashIcon className='w-4 h-4' />
      )}
    </ButtonGroupButton>
  )
}
