'use client'

import { Root } from 'react-dom/client'
import React, { useCallback, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import type { Fiber } from 'react-reconciler'
import type { Environment } from '@harmony/util/src/utils/component'
import { getEditorUrl } from '@harmony/util/src/utils/component'
import {
  QueryStateProvider,
  useQueryState,
} from '@harmony/ui/src/hooks/query-state'
import type { HarmonyProviderProps } from './harmony-provider'
import { getComponentElementFiber } from './inspector/component-identifier'
import type { FiberHTMLElement } from './inspector/fiber'
import { getElementFiber } from './inspector/fiber'
import { useToggleEnable } from '../hooks/toggle-enable'
import { useBranchId } from '../hooks/branch-id'
import { getRepositoryId } from '../utils/get-repository-id'
import { useStorageState } from '@harmony/ui/src/hooks/storage-state'
import interact from 'interactjs'
type HarmonySetupProps = Pick<
  HarmonyProviderProps,
  | 'repositoryId'
  | 'fonts'
  | 'environment'
  | 'source'
  | 'overlay'
  | 'cdnImages'
  | 'uploadImage'
  | 'components'
> & {
  local?: boolean
}
export const HarmonySetup: React.FunctionComponent<HarmonySetupProps> =
  React.memo((options) => {
    return (
      <QueryStateProvider>
        <HarmonySetupPrimitive {...options} />
      </QueryStateProvider>
    )
  })

const HarmonySetupPrimitive: React.FunctionComponent<HarmonySetupProps> = (
  options,
) => {
  const { branchId, setBranchId } = useBranchId()
  const [chrome] = useStorageState({
    key: 'chrome',
    defaultValue: false,
    storage: 'local',
  })

  const [_environment] = useQueryState<Environment | undefined>({
    key: 'harmony-environment',
    defaultValue: options.environment,
  })
  const environment = (_environment ||
    process.env.ENV ||
    process.env.NEXT_PUBLIC_ENV) as Environment | undefined

  useHarmonySetup(
    { ...options, environment, initShow: !chrome, show: Boolean(branchId) },
    branchId,
  )

  useToggleEnable()

  return <></>
}

export const useHarmonySetup = (
  {
    local = false,
    show,
    initShow = true,
    ...options
  }: HarmonySetupProps & { show?: boolean; initShow?: boolean },
  branchId: string | undefined,
) => {
  const resultRef = useRef<ReturnType<typeof setupHarmonyProvider>>(null)
  const rootRef = useRef<Root>(null)

  const cleanup = useCallback(() => {
    resultRef.current?.setup.changeMode(false)
    const container = document.getElementById('harmony-container')
    if (container) {
      rootRef.current?.unmount()
      container.remove()
      resultRef.current?.controller.abort()
    }
  }, [resultRef, rootRef])

  useEffect(() => {
    if (!initShow) return

    if (!show) {
      cleanup()

      return
    }

    resultRef.current = setupHarmonyProvider()

    if (resultRef.current) {
      const { harmonyContainer } = resultRef.current
      let repositoryId = options.repositoryId
      //If the repository id is set in the plugin, then it will show up in the body tag
      if (repositoryId === undefined) {
        repositoryId = getRepositoryId()
      }
      if (!local) {
        createProductionScript(
          { ...options, repositoryId },
          branchId || '',
          harmonyContainer,
          resultRef.current.setup,
        ).then((root) => (rootRef.current = root))
      } else {
        rootRef.current = window.HarmonyProvider(
          {
            ...options,
            repositoryId,
            branchId: branchId || '',
            setup: resultRef.current.setup,
          },
          harmonyContainer,
        )
      }
    }
  }, [show, resultRef])

  return cleanup
}

function createProductionScript(
  options: HarmonySetupProps,
  branchId: string,
  harmonyContainer: HTMLDivElement,
  setup: Setuper,
): Promise<Root> {
  return new Promise<Root>((resolve) => {
    const script = document.createElement('script')
    const src = `${getEditorUrl(options.environment || 'production')}/bundle.js`
    script.src = src
    script.addEventListener('load', function load() {
      resolve(
        window.HarmonyProvider(
          { ...options, branchId, setup },
          harmonyContainer,
        ),
      )
    })

    document.body.appendChild(script)
  })
}

function isNativeElement(element: Element): boolean {
  return (
    element.tagName.toLowerCase() !== 'script' &&
    element.id !== 'harmony-container'
  )
}

const appendChild = (container: Element, child: Element | Node) => {
  const childFiber = getElementFiber(child as FiberHTMLElement)
  if (childFiber) {
    const fiber = getComponentElementFiber(child as FiberHTMLElement)
    console.log(fiber)
    //const parentFiber = new ParentFiber();
    let parent: Fiber | null = (childFiber as Fiber | undefined) || null
    while (parent !== null) {
      if (parent.elementType === 'body') {
        break
      }

      // if (parent.tag === 4) {
      //     break;
      // }

      parent = parent.return
    }

    if (parent?.stateNode instanceof HTMLElement) {
      parent.stateNode = container
    }
    container.appendChild(child)
    // parentFiber.setFiber(parent);
    // parentFiber.sendChild(containerParent, 0, 0);
    //removeChildFiberAt(fiber.return.return, 0);
    //child.parentElement?.removeChild(child);
    //appendChildFiber(containerFiber, fiber.return);
  } else {
    container.appendChild(child)
  }
}

const createPortal = ReactDOM.createPortal

export interface Setup {
  setContainer: (container: Element) => void
  changeMode: (inEditor: boolean) => void
  harmonyContainer: Element
}
export class Setuper implements Setup {
  private bodyObserver: MutationObserver
  private container: Element | undefined
  private waitingForContainer: { inEditor: boolean } | undefined
  constructor(public harmonyContainer: Element) {
    this.bodyObserver = new MutationObserver(() => undefined)
  }

  public setContainer(container: Element) {
    this.container = container
    if (this.waitingForContainer) {
      this.changeMode(this.waitingForContainer.inEditor)
      this.waitingForContainer = undefined
    }
  }

  public changeMode(inEditor: boolean) {
    if (inEditor) {
      this.setupHarmonyMode()
    } else {
      this.setupNormalMode()
    }
  }

  private setupNormalMode() {
    if (this.container) {
      for (let i = 0; i < this.container.children.length; i++) {
        const child = this.container.children[i]
        if (isNativeElement(child)) {
          appendChild(document.body, child)
          i--
        }
      }
    }

    ReactDOM.createPortal = createPortal
    this.bodyObserver.disconnect()
    this.harmonyContainer.classList.remove('h-full')
    this.harmonyContainer.classList.remove('w-full')

    return true
  }

  private setupHarmonyMode(): boolean {
    if (this.container) {
      if (document.body.contains(this.container)) {
        for (let i = 0; i < document.body.children.length; i++) {
          const child = document.body.children[i]
          if (isNativeElement(child)) {
            appendChild(this.container, child)
            i--
          }
        }
      } else {
        this.waitingForContainer = { inEditor: true }
      }

      // eslint-disable-next-line @typescript-eslint/no-this-alias -- ok
      const self = this
      ReactDOM.createPortal = function create(
        children: React.ReactNode,
        _container: Element | DocumentFragment,
        key?: React.Key | null | undefined,
      ) {
        if (_container === document.body) {
          _container = self.container as HTMLElement
        }

        return createPortal(children, _container, key)
      }

      this.bodyObserver.disconnect()
      this.bodyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (
              node.parentElement === document.body &&
              isNativeElement(node as Element) &&
              this.container
            ) {
              appendChild(this.container, node)
            }
          })
        }
      })
    }

    this.harmonyContainer.className = 'h-full w-full'
    if (document.body.dataset.harmonyId && this.container) {
      ;(this.container as HTMLElement).dataset.harmonyId =
        document.body.dataset.harmonyId
    }

    this.bodyObserver.observe(document.body, {
      attributeOldValue: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    })

    return true
  }
}

export function setupHarmonyProvider(setupHarmonyContainer = true) {
  if (document.getElementById('harmony-container') && setupHarmonyContainer)
    return undefined

  let harmonyContainer: HTMLDivElement
  const controller = new AbortController()
  if (setupHarmonyContainer) {
    harmonyContainer = document.createElement('div')
    harmonyContainer.id = 'harmony-container'
    harmonyContainer.style.pointerEvents = 'auto'
    harmonyContainer.classList.add('harmony-comment-mode-disable')

    // Radix and other libraries use pretty aggressive focus capturing in their dialogs, so these events get around that.
    handleFocusCapturing(harmonyContainer, controller)

    document.body.appendChild(harmonyContainer)
  } else {
    const _container = document.getElementById('harmony-container') as
      | HTMLDivElement
      | undefined
    if (!_container) {
      return undefined
    }
    harmonyContainer = _container
  }

  const documentBody = document.body as HTMLBodyElement

  const setup = new Setuper(harmonyContainer)

  //container.className = documentBody.className;
  documentBody.classList.add('h-full')
  document.documentElement.classList.add('h-full')
  //documentBody.contentEditable = 'true';

  //TODO: Probably need to do this for all styles;
  //container.style.backgroundColor = 'white';
  //const {bodyObserver} = setupHarmonyMode(container, harmonyContainer, documentBody);

  return { harmonyContainer, setup, controller }
}

/**
 * Radix and other libraries use pretty aggressive focus capturing in their dialogs, so these events get around that.
 */
function handleFocusCapturing(
  container: HTMLElement,
  controller: AbortController,
) {
  const listeners: {
    listener: EventListener
    options?: AddEventListenerOptions | boolean
    target: EventTarget
  }[] = []

  // We need to stopPropagation for modal library pointerdown events so that dialogs don't close when clicking on the editor.
  // However, this will also turn off pointer events for draggable panels in the editor.
  // To get around this, we create a base pointerdown listener for all bubbling events in the editor.
  // This will call the draggable panel events and stopPropagation for the modal library events.
  const addEventListener = EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    if (
      type === 'pointerdown' &&
      // Only bubble events because the inspector does pointerdown on capture.
      (!options || (typeof options === 'object' && !options.capture))
    ) {
      listeners.push({ listener, options, target: this })
      return
    }
    return addEventListener.call(this, type, listener, options)
  }
  // container because most libraries use document for pointerdown events, so we need to capture it for every event on the harmony container.
  // NOTE: stopPropagation is called on the `onClick` event handler in the inspector to achieve the same effect while in editor mode.
  addEventListener.call(
    container,
    'pointerdown',
    (e) => {
      for (const listener of listeners) {
        listener.listener.call(listener.target, e)
      }
      e.stopPropagation()
    },
    {
      signal: controller.signal,
    },
  )

  controller.signal.addEventListener('abort', () => {
    EventTarget.prototype.addEventListener = addEventListener
    try {
      // interact.js does not re-add the event listeners when harmony is turned off, so we need to do it manually.
      interact.removeDocument(document)
    } catch {} // if a document does not exist (no draggable element was initialized), then an error will be thrown, so we catch it.
  })
  // Prevent aggresive focus capturing and enable scrolling
  const stopPropagation = (e: Event) => {
    e.stopPropagation()
  }
  document.addEventListener('focusin', stopPropagation, {
    capture: true,
    signal: controller.signal,
  })
  document.addEventListener('wheel', stopPropagation, {
    capture: true,
    signal: controller.signal,
  })
}
