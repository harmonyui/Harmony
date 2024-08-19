import {
  ChatTeardropIcon,
  LogsIcon,
  SquareIcon,
  TextIcon,
} from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'
import { usePublishButton } from '../publish/publish-button'
import { usePreviewButton } from '../preview/preview-button'
import { useLayersButton } from '../layers/layers-button'

type HarmonyToolbar = object
export const HarmonyToolbar: React.FunctionComponent<HarmonyToolbar> = () => {
  const { icon: PublishIcon, loading, disabled, onPublish } = usePublishButton()
  const { icon: PreviewIcon, onPreview } = usePreviewButton()
  const { icon: LayersIcon, onLayers } = useLayersButton()

  const items: ToolbarItem[] = [
    {
      icon: LayersIcon,
      onClick: onLayers,
      mode: 'none',
      label: 'Layers',
    },
    {
      icon: TextIcon,
      onClick: () => undefined,
      mode: 'none',
      label: 'Text',
    },
    {
      icon: SquareIcon,
      onClick: () => undefined,
      mode: 'none',
      label: 'Shapes',
    },

    {
      icon: LogsIcon,
      onClick: () => undefined,
      mode: 'none',
      label: 'Logs',
    },
    {
      icon: ChatTeardropIcon,
      onClick: () => undefined,
      mode: 'none',
      label: 'Comments',
    },
    {
      icon: PreviewIcon,
      onClick: onPreview,
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