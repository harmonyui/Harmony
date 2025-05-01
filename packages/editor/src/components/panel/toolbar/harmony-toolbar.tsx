import { FolderIcon, XMarkIcon } from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'
import { usePublishButton } from '../publish/publish-button'
import { usePreviewButton } from '../preview/preview-button'
import { useLayersButton } from '../layers/layers-button'
import { useAIButton } from '../ai/ai-button'
import { useImageButton } from '../image/image-button'
import { useDesignButton } from '../design/design-button'
import { useCommentButton } from '../comment/comment-button'
import { useState } from 'react'
import { SelectProject } from '../project/select-project'
import { AnimateButton } from '@harmony/ui/src/components/design/animate-button'
import { AnimateOpenClose } from '@harmony/ui/src/components/design/animate-open-close'
import { useVersionsButton } from '../versions/versions-button'
import { WEB_URL } from '@harmony/util/src/constants'

type HarmonyToolbar = object
export const HarmonyToolbar: React.FunctionComponent<HarmonyToolbar> = () => {
  const [isOpen, setIsOpen] = useState(false)

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
  const {
    icon: CommentIcon,
    onClick: onComment,
    active: commentActive,
  } = useCommentButton()
  const {
    icon: VersionsIcon,
    onVersions,
    active: versionsActive,
  } = useVersionsButton()

  const items: ToolbarItem[][] = [
    [
      {
        icon: DesignIcon,
        onClick: onDesign,
        mode: 'none',
        label: 'Design',
        active: designActive,
        disabled: previewActive,
      },
      {
        icon: LayersIcon,
        onClick: onLayers,
        mode: 'none',
        label: 'Layers',
        active: layerActive,
        disabled: previewActive,
      },
      {
        icon: AIIcon,
        mode: 'none',
        label: 'AI',
      },
      {
        icon: ImageIcon,
        mode: 'none',
        label: 'Images',
        onClick: onImage,
        active: imageActive,
        disabled: previewActive,
      },
      {
        icon: CommentIcon,
        mode: 'none',
        label: 'Comments',
        onClick: onComment,
        active: commentActive,
      },
    ],
    [
      {
        icon: VersionsIcon,
        mode: 'none',
        label: 'Changes',
        onClick: onVersions,
        active: versionsActive,
        disabled: previewActive,
      },
      {
        icon: FolderIcon,
        mode: 'none',
        label: 'Projects',
        onClick: () => undefined,
        popover: <SelectProject />,
      },
    ],
    [
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
    ],
    [
      {
        icon: XMarkIcon,
        onClick: () => setIsOpen(!isOpen),
        mode: 'none',
        label: '',
      },
    ],
  ]
  return (
    <>
      <div className='absolute bottom-2 left-1/2 -translate-x-1/2 z-[999]'>
        <AnimateOpenClose
          openElement={<Toolbar items={items} />}
          closedElement={
            <HarmonyCollapsedToolbar onClick={() => setIsOpen(!isOpen)} />
          }
          isOpen={isOpen}
        />
      </div>
    </>
  )
}

const HarmonyCollapsedToolbar: React.FunctionComponent<{
  onClick: () => void
}> = ({ onClick }) => {
  return (
    <AnimateButton
      className='flex items-center justify-center p-2 bg-white rounded-full !cursor-pointer border border-[#e5e5e5]'
      onClick={onClick}
    >
      <img src={`${WEB_URL}/icon-128.png`} className='size-5' />
    </AnimateButton>
  )
}
