import React from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import type {
  ComponentUpdateWithoutGlobal,
  SelectMode,
} from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import { useHarmonyStore } from '../hooks/state'
import { ComponentAttributeProvider } from './design/attribute-provider'
import { GiveFeedbackModal, HelpGuide } from './welcome/help-guide'
import { SidePanel, SidePanelProvider } from './side-panel'
import { PublishProvider } from './publish/publish-button'
import { HarmonyToolbar } from './toolbar/harmony-toolbar'
import { DesignOverlay } from './design/design-overlay'
import { HarmonyPanelProvider } from './_common/panel/panel'
import { LayoutPanel } from './layers/layout-panel'

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
              className='hw-fixed hw-h-full hw-w-full hw-z-[10000] hw-pointer-events-none hw-top-0'
              id='harmony-overlay'
            >
              <div className='hw-pointer-events-auto'>
                <div className='hw-absolute hw-top-[52px] hw-bottom-0 hw-left-0'>
                  <SidePanel />
                </div>
                <FeedbackOverlay />
                <HarmonyToolbar />
                <DesignOverlay />
                <LayoutPanel />
                {inspector}
              </div>
            </div>
          </ComponentAttributeProvider>
        </HarmonyPanelProvider>
      </SidePanelProvider>
    </PublishProvider>
  )
}

const FeedbackOverlay: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { showGiveFeedback, setShowGiveFeedback } = useHarmonyContext()

  return (
    <>
      <div className='hw-absolute hw-left-4 hw-bottom-4'>
        {isDemo ? (
          <Button
            as='a'
            href='https://j48inpgngmc.typeform.com/to/Ch60XpCt'
            className='hw-mr-4'
            target='_blank'
          >
            Join Beta
          </Button>
        ) : null}
        <Button mode='secondary' onClick={() => setShowGiveFeedback(true)}>
          Give us feedback
        </Button>
      </div>
      <div className='hw-absolute hw-right-0 hw-bottom-0'>
        <HelpGuide className='hw-mr-4 hw-mb-4' />
      </div>
      <GiveFeedbackModal
        show={showGiveFeedback}
        onClose={() => setShowGiveFeedback(false)}
      />
    </>
  )
}
