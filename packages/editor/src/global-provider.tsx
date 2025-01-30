'use client'
import { QueryStateProvider } from '@harmony/ui/src/hooks/query-state'
import { getClass } from '@harmony/util/src/utils/common'
import { useRef, useEffect } from 'react'
import { Root, createRoot } from 'react-dom/client'
import {
  HarmonyProviderProps,
  HarmonyProvider,
} from './components/harmony-provider'

export function HarmonyProviderFunc(
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
): Root {
  const Container: React.FunctionComponent<{
    harmonyContainer: HTMLElement
    className: string
  }> = ({ className }) => {
    const ref = useRef<HTMLBodyElement>(null)
    useEffect(() => {
      if (ref.current) {
        options.setup.setContainer(ref.current)
        //options.setup.changeMode(options.mode || 'designer')
      }
    }, [ref])
    return (
      <section
        id='harmony-section'
        className={className}
        ref={ref}
        style={{ backgroundColor: 'white' }}
      ></section>
    )
  }
  const container = (
    <Container
      harmonyContainer={harmonyContainer}
      className={getClass(document.body.className, 'select-none')}
    />
  ) //document.createElement('body');
  const root = createRoot(harmonyContainer)

  root.render(
    <QueryStateProvider>
      <HarmonyProvider {...options}>{container}</HarmonyProvider>
    </QueryStateProvider>,
  )

  return root
}

type HarmonyProvider = (
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) => Root

declare global {
  interface Window {
    HarmonyProvider: HarmonyProvider
  }
}

if (typeof window !== 'undefined') {
  window.HarmonyProvider = HarmonyProviderFunc
}
