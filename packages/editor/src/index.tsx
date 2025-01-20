'use client'
import { Root } from 'react-dom/client'
import type { HarmonyProviderProps } from './components/harmony-provider'
import { HarmonyProvider } from './components/harmony-provider'
import { HarmonySetup, useHarmonySetup } from './components/harmony-setup'

type HarmonyProvider = (
  options: Omit<HarmonyProviderProps, 'children'>,
  harmonyContainer: HTMLDivElement,
) => Root

declare global {
  interface Window {
    HarmonyProvider: HarmonyProvider
  }
}

export { HarmonySetup, useHarmonySetup }
