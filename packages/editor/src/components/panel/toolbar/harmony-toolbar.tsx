import {
  ChatTeardropIcon,
  TextIcon,
  XMarkIcon,
} from '@harmony/ui/src/components/core/icons'
import type { ToolbarItem } from '@harmony/ui/src/components/core/toolbar'
import { Toolbar } from '@harmony/ui/src/components/core/toolbar'
import { usePublishButton } from '../publish/publish-button'
import { usePreviewButton } from '../preview/preview-button'
import { useLayersButton } from '../layers/layers-button'
import { useAIButton } from '../ai/ai-button'
import { useImageButton } from '../image/image-button'
import { useDesignButton } from '../design/design-button'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const items: ToolbarItem[][] = [
    [
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
    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 z-[999]'>
      <AnimatePresence mode='wait'>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Toolbar items={items} />
          </motion.div>
        ) : (
          <HarmonyCollapsedToolbar onClick={() => setIsOpen(!isOpen)} />
        )}
      </AnimatePresence>
    </div>
  )
}

const HarmonyCollapsedToolbar: React.FunctionComponent<{
  onClick: () => void
}> = ({ onClick }) => {
  return (
    <motion.button
      className='flex items-center justify-center p-2 bg-white rounded-full !cursor-pointer border border-[#e5e5e5]'
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <img
        src='https://dashboard.harmonyui.app/icon-128.png'
        className='size-5'
      />
    </motion.button>
  )
}
