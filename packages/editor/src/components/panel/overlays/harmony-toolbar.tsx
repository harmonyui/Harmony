import {
  ChatTeardropIcon,
  LogsIcon,
  MonitorPlayIcon,
  StackIcon,
  SquareIcon,
  TextIcon,
} from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'
import { usePublishButton } from '../publish-button'

interface HarmonyToolbar {
  // TODO
}
export const HarmonyToolbar: React.FunctionComponent<HarmonyToolbar> = ({}) => {
  const { icon: PublishIcon, loading, disabled, onPublish } = usePublishButton()

  const items: ToolbarItem[] = [
    {
      icon: StackIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Layers',
    },
    {
      icon: TextIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Text',
    },
    {
      icon: SquareIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Shapes',
    },

    {
      icon: LogsIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Logs',
    },
    {
      icon: ChatTeardropIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Comments',
    },
    {
      icon: MonitorPlayIcon,
      onClick: () => {},
      mode: 'none',
      label: 'Preview',
    },
    {
      icon: PublishIcon,
      onClick: onPublish,
      mode: 'primary',
      label: 'Publish',
      loading,
      disabled,
    },
  ]
  return <Toolbar items={items} />
}
