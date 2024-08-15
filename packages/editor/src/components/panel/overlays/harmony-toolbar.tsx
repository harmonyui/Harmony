import { PlayIcon } from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'

interface HarmonyToolbar {
  // TODO
}
export const HarmonyToolbar: React.FunctionComponent<HarmonyToolbar> = ({}) => {
  const items: ToolbarItem[] = [
    {
      icon: PlayIcon,
      onClick: () => {},
      mode: 'primary',
      label: 'Run',
    },
  ]
  return <Toolbar items={items} />
}
