import {
  ChatTeardropIcon,
  TextIcon,
} from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'
import { usePublishButton } from '../publish/publish-button'
import { usePreviewButton } from '../preview/preview-button'
import { useLayersButton } from '../layers/layers-button'
import { useAIButton } from '../ai/ai-button'
import { useImageButton } from '../image/image-button'
import { useDesignButton } from '../design/design-button'

type HarmonyToolbar = object
export const HarmonyToolbar: React.FunctionComponent<HarmonyToolbar> = () => {
  const { icon: DesignIcon, onDesign, active: designActive } = useDesignButton()
  const { icon: PublishIcon, loading, disabled, onPublish } = usePublishButton()
  const {
    icon: PreviewIcon,
    onPreview,
    active: previewActive,
  } = usePreviewButton()
  const { icon: LayersIcon, onLayers, active: layerActive } = useLayersButton()
  const { icon: AIIcon } = useAIButton()
  const { icon: ImageIcon, onImage, active: imageActive } = useImageButton()

  const items: ToolbarItem[] = [
    {
      icon: DesignIcon,
      onClick: onDesign,
      mode: 'none',
      label: 'Design',
      active: designActive,
    },
    {
      icon: LayersIcon,
      onClick: onLayers,
      mode: 'none',
      label: 'Layers',
      active: layerActive,
    },
    {
      icon: AIIcon,
      mode: 'none',
      label: 'AI',
    },
    {
      icon: TextIcon,
      mode: 'none',
      label: 'Text',
    },
    {
      icon: ImageIcon,
      mode: 'none',
      label: 'Images',
      onClick: onImage,
      active: imageActive,
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
