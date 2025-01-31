import React from 'react'
import type {
  ComponentUpdateWithoutGlobal,
  SelectMode,
} from '../harmony-context'
import { ComponentAttributeProvider } from '../attributes/attribute-provider'
import { SidePanel, SidePanelProvider } from './side-panel'
import { PublishProvider } from './publish/publish-button'
import { HarmonyToolbar } from './toolbar/harmony-toolbar'
import { DesignOverlay } from './design/design-overlay'
import { HarmonyPanelProvider } from './_common/panel/panel'
import { LayoutPanel } from './layers/layout-panel'
import { AIPanel } from './ai/ai-panel'
import { ImagePanel } from './image/image-panel'

export interface HarmonyPanelProps {
  onAttributesChange: (updates: ComponentUpdateWithoutGlobal[]) => void
  mode: SelectMode
  onModeChange: (mode: SelectMode) => void
  children: React.ReactNode
  toggle: boolean
  onToggleChange: (toggle: boolean) => void
  isDirty: boolean
  setIsDirty: (value: boolean) => void
}
export const HarmonyPanel: React.FunctionComponent<
  HarmonyPanelProps & { inspector: React.ReactNode }
> = ({ inspector, ...props }) => {
  return (
    <PublishProvider>
      <SidePanelProvider>
        <HarmonyPanelProvider>
          <ComponentAttributeProvider onChange={props.onAttributesChange}>
            <div
              className='fixed h-full w-full z-[10000] pointer-events-none top-0'
              id='harmony-overlay'
            >
              <div className='pointer-events-auto'>
                <div className='absolute top-[52px] bottom-0 left-0'>
                  <SidePanel />
                </div>
                <HarmonyToolbar />
                <DesignOverlay />
                <LayoutPanel />
                <AIPanel />
                <ImagePanel />
                {inspector}
              </div>
            </div>
          </ComponentAttributeProvider>
        </HarmonyPanelProvider>
      </SidePanelProvider>
    </PublishProvider>
  )
}
