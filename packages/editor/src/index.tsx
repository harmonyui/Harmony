'use client'
import { getClass } from '@harmony/util/src/utils/common'
import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import type { HarmonyProviderProps } from './components/harmony-provider'
import { HarmonyProvider } from './components/harmony-provider'
import { HarmonySetup, useHarmonySetup } from './components/harmony-setup'
import { QueryStateProvider } from './components/hooks/query-state'

type HarmonyProvider = (
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) => void

declare global {
  interface Window {
    HarmonyProvider: HarmonyProvider
  }
}

export function HarmonyProviderFunc(
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) {
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
      className={getClass(document.body.className, 'hw-select-none')}
    />
  ) //document.createElement('body');
  ReactDOM.render(
    <QueryStateProvider>
      <HarmonyProvider {...options}>{container}</HarmonyProvider>
    </QueryStateProvider>,
    harmonyContainer,
  )
}

export { HarmonySetup, useHarmonySetup }

if (typeof window !== 'undefined') {
  window.HarmonyProvider = HarmonyProviderFunc
}
