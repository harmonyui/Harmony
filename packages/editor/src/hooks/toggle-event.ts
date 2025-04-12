import { useEffect } from 'react'

export const TOGGLE_EVENT = 'toggleEditor'
export const dispatchToggleEvent = (token?: string) => {
  window.dispatchEvent(
    new CustomEvent(TOGGLE_EVENT, token ? { detail: token } : undefined),
  )
}

export const useToggleEvent = (
  callback: (e: CustomEventInit<string>) => void,
) => {
  useEffect(() => {
    window.addEventListener(TOGGLE_EVENT, callback)
    return () => {
      window.removeEventListener(TOGGLE_EVENT, callback)
    }
  }, [callback])
}
