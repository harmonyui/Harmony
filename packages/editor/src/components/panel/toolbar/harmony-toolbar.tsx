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
  const {
    icon: PreviewIcon,
    onPreview,
    active: previewActive,
  } = usePreviewButton()
  const { icon: LayersIcon, onLayers, active: layerActive } = useLayersButton()

  const items: ToolbarItem[] = [
    {
      icon: LayersIcon,
      onClick: onLayers,
      mode: 'none',
      label: 'Layers',
      active: layerActive,
    },
    {
      icon: TextIcon,
      mode: 'none',
      label: 'Text',
    },
    {
      icon: SquareIcon,
      mode: 'none',
      label: 'Shapes',
    },

    {
      icon: LogsIcon,
      mode: 'none',
      label: 'Logs',
    },
    {
      icon: ChatTeardropIcon,
      mode: 'none',
      label: 'Comments',
    },
    {
      icon: PreviewIcon,
      onClick: onPreview,
      mode: 'none',
      label: 'Preview',
      active: previewActive,
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
