'use client'

import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { useEffect, useRef } from 'react'

let controller = new AbortController()

//The event function emitted. Return whether or not this is the desired element (should stop propagation)
export type HighlighterDispatch = (
  element: HTMLElement,
  clientX: number,
  clientY: number,
  event: MouseEvent,
) => boolean
export interface HighlighterProps {
  handlers: {
    onClick: HighlighterDispatch
    onHover: HighlighterDispatch
    onHold: HighlighterDispatch
    onPointerUp: HighlighterDispatch
    onDoubleClick: HighlighterDispatch
  }
  container: HTMLElement | undefined
  noEvents: string[]
}
export const useHighlighter = ({
  handlers: {
    onClick,
    onHover,
    onPointerUp: onPointerUpProps,
    onDoubleClick: onDoubleClickProps,
  },
  container,
  noEvents,
}: HighlighterProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)

  const registerListeners = useEffectEvent((): void => {
    controller = new AbortController()
    const options: AddEventListenerOptions = {
      signal: controller.signal,
      capture: true,
    }
    container?.addEventListener('pointerup', onPointerUp, options)
    container?.addEventListener('pointermove', onPointerOver, options)
    container?.addEventListener('click', onMouseEvent, options)
    //container?.addEventListener('mousedown', onMouseEvent, options) //This one handels the content editable
    container?.addEventListener('mouseover', onMouseEvent, options)
    //container?.addEventListener('mouseup', onMouseEvent, options)
    container?.addEventListener('pointerdown', onPointerDown, options)
    container?.addEventListener('dblclick', onDoubleClick, options)
  })

  const removeListeners = useEffectEvent((): void => {
    controller.abort()
  })

  useEffect(() => {
    registerListeners()

    return () => {
      removeListeners()
      clearTimeout(timeoutRef.current)
    }
  }, [registerListeners, removeListeners, container])

  const highligherDispatcher = (
    dispatch: HighlighterDispatch,
    finish?: HighlighterDispatch,
  ) =>
    useEffectEvent((event: MouseEvent) => {
      let target = event.target as HTMLElement | null
      if (
        noEvents.some((no) => document.querySelector(no)?.contains(target)) ||
        target?.closest('[data-non-selectable="true"]')
      )
        return
      while (
        target !== null &&
        !dispatch(target, event.clientX, event.clientY, event)
      ) {
        target = target.parentElement
      }

      finish &&
        target !== null &&
        finish(target, event.clientX, event.clientY, event)
    })

  //Disables the event
  const onMouseEvent = useEffectEvent((event: Event): boolean | undefined => {
    const target = event.target as HTMLElement | null
    if (
      noEvents.some((no) => document.querySelector(no)?.contains(target)) ||
      target?.closest('[data-non-selectable="true"]')
    )
      return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    return false
  })

  const onPointerUp = highligherDispatcher(onPointerUpProps)
  const onPointerOver = highligherDispatcher(onHover)
  const onPointerDown = highligherDispatcher(onClick)
  const onDoubleClick = highligherDispatcher(onDoubleClickProps)
}
