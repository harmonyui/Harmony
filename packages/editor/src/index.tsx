'use client'
import { createRoot } from 'react-dom/client'
import { getClass } from '@harmony/util/src/utils/common'
import { useEffect, useRef } from 'react'
import { QueryStateProvider } from '@harmony/ui/src/hooks/query-state'
import type { HarmonyProviderProps } from './components/harmony-provider'
import { HarmonyProvider } from './components/harmony-provider'
import { HarmonySetup, useHarmonySetup } from './components/harmony-setup'

type HarmonyProvider = (
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) => void

declare global {
  interface Window {
    HarmonyProvider: HarmonyProvider
  }
}

export { HarmonySetup, useHarmonySetup }
