/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/

'use client'
import { MinimizeIcon } from '@harmony/ui/src/components/core/icons'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import {
  DEFAULT_HEIGHT as HEIGHT,
  DEFAULT_WIDTH as WIDTH,
} from '@harmony/util/src/constants'
import type { Font } from '@harmony/util/src/fonts'
import type {
  BehaviorType,
  ComponentUpdate,
} from '@harmony/util/src/types/component'
import type { Environment } from '@harmony/util/src/utils/component'
import hotkeys from 'hotkeys-js'
import $ from 'jquery'
import React, { useEffect, useRef, useState } from 'react'
import type { UpdateAttributeValue } from '@harmony/util/src/updates/component'
import type { UpdateProperty } from '@harmony/util/src/updates/property'
import { createUpdate } from '@harmony/util/src/updates/utils'
import {
  getComponentIdAndChildIndex,
  getImageSrc,
  recurseElements,
} from '../utils/element-utils'
import { useHarmonyStore } from '../hooks/state'
import type { Source } from '../hooks/state/component-state'
import { dispatchToggleEvent } from '../hooks/toggle-event'
import { useComponentUpdator } from '../hooks/component-updater'
import type { RegistryComponent } from '../utils/harmonycn/types'
import type {
  ComponentUpdateWithoutGlobal,
  DisplayMode,
  SelectMode,
} from './harmony-context'
import { HarmonyContext, viewModes } from './harmony-context'
import type { Setup } from './harmony-setup'
import { Inspector, replaceTextContentWithSpans } from './inspector/inspector'
import { HarmonyPanel } from './panel/harmony-panel'
import { GlobalUpdatePopup } from './panel/global-change-popup'
import { UploadImageProvider } from './image/image-provider'
import { ComponentProvider } from './harmonycn/component-provider'

export interface HarmonyProviderProps {
  repositoryId: string | undefined
  branchId: string
  children: React.ReactNode
  setup: Setup
  fonts?: Font[]
  environment?: Environment
  source?: Source
  overlay?: boolean
  cdnImages?: string[]
  uploadImage?: (data: FormData) => Promise<string>
  components?: RegistryComponent[]
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({
  repositoryId,
  children,
  branchId,
  fonts,
  setup,
  cdnImages,
  uploadImage,
  components = [],
  environment = 'production',
  source = 'document',
  overlay = true,
}) => {
  const [isToggled, setIsToggled] = useState(true)
  const harmonyContainerRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<SelectMode>('tweezer')
  const [scale, _setScale] = useState(0.8)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const setSelectedComponent = useHarmonyStore((state) => state.selectElement)
  const [error, setError] = useState<string | undefined>()
  const [showGiveFeedback, setShowGiveFeedback] = useState(false)
  const [behaviors, setBehaviors] = useState<BehaviorType[]>([])
  const [isGlobal, setIsGlobal] = useState(false)
  const pullRequest = useHarmonyStore((state) => state.pullRequest)
  const componentUpdates = useHarmonyStore((state) => state.componentUpdates)
  const isInitialized = useHarmonyStore((state) => state.isInitialized)
  const onApplyGlobal = useHarmonyStore((state) => state.onApplyGlobal)
  const initializeProject = useHarmonyStore((state) => state.initializeProject)
  const updateComponentsFromIds = useHarmonyStore(
    (state) => state.updateComponentsFromIds,
  )
  const initHarmonyComponents = useHarmonyStore(
    (state) => state.initHarmonyComponents,
  )
  const updateTheCounter = useHarmonyStore((state) => state.updateTheCounter)
  const makeUpdates = useHarmonyStore((state) => state.makeUpdates)
  const rootComponent = useHarmonyStore((state) => state.rootComponent)?.element
  const setSource = useHarmonyStore((state) => state.setSource)
  const displayMode = useHarmonyStore((state) => state.displayMode)
  const setDisplayMode = useHarmonyStore((state) => state.setDisplayMode)
  const setIsOverlay = useHarmonyStore((state) => state.setIsOverlay)
  const initMutationObserverRef = useRef<MutationObserver | null>(null)

  const { executeCommand, onUndo, clearUpdates } = useComponentUpdator({
    isSaving,
    environment,
    setIsSaving,
    fonts,
    isPublished: Boolean(pullRequest),
    branchId,
    behaviors,
    onChange() {
      updateTheCounter()
    },
    onError: setError,
  })

  const onHistoryChange = () => {
    changeMode(displayMode)
  }

  useEffect(() => {
    const initialize = async () => {
      setSource(source)
      setIsOverlay(overlay)

      onHistoryChange()

      await initializeProject({
        branchId,
        repositoryId,
        environment,
        cdnImages,
        uploadImage,
        registryComponents: components,
      })
    }

    void initialize()

    window.addEventListener('popstate', onHistoryChange)

    return () => {
      window.removeEventListener('popstate', onHistoryChange)
    }
  }, [])

  useEffect(() => {
    if (displayMode.includes('preview')) {
      setIsToggled(false)
      //setScale(0.5, { x: 0, y: 0 })
    }

    if (displayMode === 'designer') {
      setIsToggled(true)
    }
  }, [displayMode, harmonyContainerRef])

  const onToggle = useEffectEvent(() => {
    setIsToggled(!isToggled)
  })

  useEffect(() => {
    hotkeys('T', onToggle)

    return () => {
      hotkeys.unbind('esc', onToggle)
    }
  }, [])

  useEffect(() => {
    if (!isToggled) {
      setSelectedComponent(undefined)
    }
  }, [isToggled])

  useEffect(() => {
    const scrollContainer = document.getElementById('harmony-scroll-container')
    if (scrollContainer) {
      //TODO: Hacky beyond hacky (we want to center the screen)
      scrollContainer.scrollLeft = 150
    }
  }, [rootComponent])

  useEffect(() => {
    if (rootComponent && isInitialized) {
      const recurseAndUpdateElements = async (
        updateFilter?: (update: ComponentUpdate) => boolean,
      ) => {
        const componentIds: string[] = []
        recurseElements(rootComponent, [initElements(componentIds)])
        await makeUpdates(
          updateFilter
            ? componentUpdates.filter(updateFilter)
            : componentUpdates,
          fonts,
          rootComponent,
        )

        if (repositoryId) {
          void updateComponentsFromIds(
            { branchId, components: componentIds, repositoryId },
            rootComponent,
          )
        } else {
          initHarmonyComponents()
        }
      }
      initMutationObserverRef.current = new MutationObserver((mutations) => {
        //Only update if this is a harmony element
        if (
          mutations.some((m) =>
            Array.from(m.addedNodes).some((n) =>
              n instanceof HTMLElement ? n.dataset.harmonyId : false,
            ),
          )
        ) {
          recurseElements(rootComponent, [initElements([])])
        }
      })
      const body = rootComponent.querySelector('body')
      initMutationObserverRef.current.observe(body || rootComponent, {
        childList: true,
        subtree: true,
      })
      void recurseAndUpdateElements()

      //Hacky fix for the toolbar zooming weird and the user does not have the updated editor
      const harmonyContainer = document.getElementById('harmony-container')
      if (
        harmonyContainer &&
        harmonyContainer.className.includes('hw-h-full')
      ) {
        harmonyContainer.classList.add('hw-w-full')
      }
    }
  }, [rootComponent, isInitialized])

  const initElements =
    (componentIds: string[]) =>
    (element: HTMLElement): void => {
      if (!rootComponent) return

      let id = element.dataset.harmonyId
      if (id && id !== 'undefined') {
        const split = id.split('#')
        const componentId = split[split.length - 1]
        element.dataset.harmonyComponentId = componentId

        if (/pages\/_app\.(tsx|jsx|js)/.exec(atob(split[0]))) {
          id = split.slice(1).join('#')
          element.dataset.harmonyId = id
        }

        const childIndex = componentIds.filter((c) => c === id).length
        if (!element.dataset.harmonyChildIndex)
          element.dataset.harmonyChildIndex = String(childIndex)

        id && componentIds.push(id)
      }

      const children = Array.from(element.childNodes)
      const textNodes = children.filter(
        (child) => child.nodeType === Node.TEXT_NODE,
      )
      const styles = getComputedStyle(element)
      //Sticky elements behavior weirdly in the editor (follow us down the screen at a slow pace), so let's make them not sticky
      if (styles.position === 'sticky') {
        element.style.position = 'relative'
      }

      //Save the original image source so we can choose from it even if the image is replaced in
      //our image panel
      if (element instanceof HTMLImageElement) {
        element.dataset.harmonySrc = getImageSrc(element)
      }

      //TODO: Do this better so there is no dependency on this action in this function
      //If there are text nodes and non-text nodes inside of an element, wrap the text nodes in
      //span tags so we can select and edit them
      if (
        textNodes.length > 0 &&
        (children.length > textNodes.length ||
          ['Bottom', 'Top', 'Left', 'Right'].some(
            (d) => parseFloat($(element).css(`padding${d}`)) !== 0,
          ))
      ) {
        replaceTextContentWithSpans(element)
      }
    }

  const onReorder = useEffectEvent(
    ({
      from,
      to,
      element,
    }: {
      from: number
      to: number
      element: HTMLElement
    }) => {
      const componentId =
        element.dataset.harmonyText === 'true'
          ? element.parentElement!.dataset.harmonyId
          : element.dataset.harmonyId
      if (!componentId) throw new Error('Error when getting component')

      const value = `from=${from}:to=${to}`
      const oldValue = `from=${to}:to=${from}`
      const childIndex = Array.from(element.parentElement!.children).indexOf(
        element,
      )
      if (childIndex < 0) throw new Error('Cannot get right child index')

      const update: ComponentUpdateWithoutGlobal = {
        componentId,
        type: 'component',
        name: 'reorder',
        value,
        oldValue,
        childIndex,
      }

      onAttributesChange([update], false)
    },
  )

  const onAttributesChange = (
    updates: ComponentUpdateWithoutGlobal[],
    execute = true,
  ) => {
    executeCommand(
      updates.map((update) => ({ ...update, isGlobal: false })),
      execute,
    )
    onApplyGlobal(updates)
  }

  const onTextChange = useEffectEvent(
    (
      value: string,
      oldValue: string,
      selectedComponent: HTMLElement | undefined,
    ) => {
      if (!selectedComponent) return

      const { componentId, childIndex, index } =
        getComponentIdAndChildIndex(selectedComponent)

      const update: ComponentUpdateWithoutGlobal = {
        componentId,
        type: 'text',
        name: String(index),
        value,
        oldValue,
        childIndex,
      }
      onAttributesChange([update], false)
    },
  )

  const onElementPropertyChange = useEffectEvent(
    (name: string, value: string, element: HTMLElement | undefined) => {
      if (!element) return

      const { componentId, childIndex } = getComponentIdAndChildIndex(element)

      const oldValue = element.getAttribute(name) || ''
      const update: ComponentUpdateWithoutGlobal = {
        componentId,
        type: 'component',
        name: 'update-attribute',
        value: JSON.stringify({
          action: 'update',
          name,
          value,
        } satisfies UpdateAttributeValue),
        oldValue: JSON.stringify({
          action: 'update',
          name,
          value: oldValue,
        } satisfies UpdateAttributeValue),
        childIndex,
      }
      onAttributesChange([update], true)
    },
  )

  const onComponentPropertyChange = useEffectEvent(
    (
      value: UpdateProperty,
      oldValue: UpdateProperty,
      element: HTMLElement | undefined,
    ) => {
      if (!element) return

      const { componentId, childIndex } = getComponentIdAndChildIndex(element)

      const update: ComponentUpdateWithoutGlobal = {
        componentId,
        type: 'property',
        name: value.name,
        value: createUpdate<UpdateProperty>(value),
        oldValue: createUpdate<UpdateProperty>(oldValue),
        childIndex,
      }
      onAttributesChange([update], true)
    },
  )

  const onElementChange = (
    element: HTMLElement,
    update: ComponentUpdateWithoutGlobal[],
    execute = true,
  ) => {
    onAttributesChange(update, execute)
  }

  const changeMode = (_mode: DisplayMode) => {
    if ((viewModes as readonly string[]).includes(_mode)) {
      setDisplayMode(_mode as DisplayMode)
      setup.changeMode(!overlay && _mode !== 'preview-full')
    }
  }

  const onMinimize = () => {
    changeMode('preview')
  }

  const onClose = () => {
    void clearUpdates()
    initMutationObserverRef.current?.disconnect()
    dispatchToggleEvent()
  }

  const inspector = isToggled ? (
    <Inspector
      rootElement={rootComponent}
      parentElement={harmonyContainerRef.current || rootComponent}
      onReorder={onReorder}
      mode={mode}
      scale={scale}
      onChange={onElementChange}
    />
  ) : null

  return (
    <>
      {
        <HarmonyContext.Provider
          value={{
            isSaving,
            setIsSaving,
            displayMode,
            changeMode,
            fonts,
            scale,
            onClose,
            error,
            setError,
            environment,
            showGiveFeedback,
            setShowGiveFeedback,
            behaviors,
            setBehaviors,
            isGlobal,
            setIsGlobal,
            onAttributesChange,
            onTextChange,
            onElementPropertyChange,
            onComponentPropertyChange,
            onToggleInspector: onToggle,
          }}
        >
          <ComponentProvider>
            <UploadImageProvider>
              {displayMode !== 'preview-full' ? (
                <>
                  <HarmonyPanel
                    onAttributesChange={onAttributesChange}
                    mode={mode}
                    onModeChange={setMode}
                    toggle={isToggled}
                    onToggleChange={setIsToggled}
                    isDirty={isDirty}
                    setIsDirty={setIsDirty}
                    inspector={inspector}
                  >
                    <div
                      style={{
                        width: `${WIDTH * scale}px`,
                        minHeight: `${HEIGHT * scale}px`,
                      }}
                    >
                      <div
                        id='harmony-scaled'
                        ref={(d) => {
                          if (d && d !== harmonyContainerRef.current) {
                            harmonyContainerRef.current = d
                          }
                        }}
                        style={{
                          width: `${WIDTH}px`,
                          minHeight: `${HEIGHT}px`,
                          transformOrigin: '0 0',
                          transform: `scale(${scale})`,
                        }}
                      >
                        {inspector}
                        {children}
                      </div>
                    </div>
                  </HarmonyPanel>
                </>
              ) : (
                <div className='hw-fixed hw-z-[100] hw-group hw-p-2 hw-bottom-0 hw-left-0'>
                  <button
                    className='hw-bg-[#11283B] hover:hw-bg-[#11283B]/80 hw-rounded-md hw-p-2'
                    onClick={onMinimize}
                  >
                    <MinimizeIcon className='hw-h-5 hw-w-5 hw-fill-white hw-stroke-none' />
                  </button>
                </div>
              )}
              <GlobalUpdatePopup
                onUndo={onUndo}
                executeCommand={executeCommand}
              />
            </UploadImageProvider>
          </ComponentProvider>
        </HarmonyContext.Provider>
      }
    </>
  )
}

export const usePinchGesture = ({
  scale,
  onTouching,
}: {
  scale: number
  onTouching: (scale: number, cursorPos: { x: number; y: number }) => void
}) => {
  const onTouch = useEffectEvent((event: WheelEvent) => {
    if (!event.ctrlKey) return
    event.preventDefault()

    const delta = event.deltaY
    const scaleFactor = 0.01 // Adjust sensitivity as needed
    const newScale = scale - scaleFactor * delta

    // Update the scale state, ensuring it doesn't go below a minimum value
    onTouching(Math.max(0.1, newScale), { x: event.clientX, y: event.clientY })
  })

  return { onTouch }
}
