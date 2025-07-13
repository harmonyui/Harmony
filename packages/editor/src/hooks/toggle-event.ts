import { useEffect } from 'react'

export const TOGGLE_EVENT = 'toggleEditor'
export const dispatchToggleEvent = (tabId?: number) => {
  window.dispatchEvent(
    new CustomEvent(TOGGLE_EVENT, tabId ? { detail: tabId } : undefined),
  )
}

export const useToggleEvent = (
  callback: (e: CustomEventInit<number>) => void,
) => {
  useEffect(() => {
    window.addEventListener(TOGGLE_EVENT, callback)
    return () => {
      window.removeEventListener(TOGGLE_EVENT, callback)
    }
  }, [callback])
}
