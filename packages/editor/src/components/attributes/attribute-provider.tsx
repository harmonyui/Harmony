import { camelToKebab } from '@harmony/util/src/utils/common'
import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Token } from '@harmony/util/src/types/tokens'
import type { ComponentUpdateWithoutGlobal } from '../harmony-context'
import { useHarmonyContext } from '../harmony-context'
import { useHarmonyStore } from '../../hooks/state'
import {
  getComponentIdAndChildIndex,
  getComputedValue,
} from '../../utils/element-utils'
import { compareCSSValues } from '../panel/design/utils'
import type {
  CommonTools,
  ComponentToolData,
  ToolAttributeValue,
} from './types'
import { getTextToolsFromAttributes } from './utils'

interface ComponentAttributeContextProps {
  selectedComponent: HTMLElement | undefined
  onAttributeChange: (value: ComponentToolData) => void
  data: ReturnType<typeof getTextToolsFromAttributes> | undefined
  getAttribute: <T extends CommonTools>(
    value: T,
    isComputed?: boolean,
  ) => ToolAttributeValue<T>['value']
  getCurrentToken: <T extends CommonTools>(
    name: T,
  ) => Token['values'][number] | undefined
  getTokenValues: <T extends CommonTools>(name: T) => Token['values']
}
const ComponentAttributeContext = createContext<ComponentAttributeContextProps>(
  {
    selectedComponent: {} as HTMLElement,
    onAttributeChange: () => undefined,
    data: [],
    getAttribute: () => '',
    getCurrentToken: () => undefined,
    getTokenValues: () => [],
  },
)
interface ComponentAttributeProviderProps {
  children: React.ReactNode
  onChange: (update: ComponentUpdateWithoutGlobal[]) => void
}
export const ComponentAttributeProvider: React.FunctionComponent<
  ComponentAttributeProviderProps
> = ({ children, onChange }) => {
  const { fonts } = useHarmonyContext()
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)
  const updateCounter = useHarmonyStore((state) => state.updateCounter)
  const tokens = useHarmonyStore((state) => state.harmonyTokens)
  const data = useMemo(
    () =>
      selectedComponent
        ? getTextToolsFromAttributes(selectedComponent.element, fonts)
        : undefined,
    [selectedComponent, fonts, updateCounter],
  )

  const onAttributeChange = (values: ComponentToolData) => {
    if (!data || !selectedComponent) return

    const old = data.find((t) => t.name === values.name)
    if (!old) throw new Error('Cannot find old property')
    const oldValue = old.value
    const { componentId, childIndex } = getComponentIdAndChildIndex(old.element)

    const update: ComponentUpdateWithoutGlobal = {
      componentId,
      type: 'className',
      name: values.name,
      value: values.value,
      oldValue,
      childIndex,
    }

    onChange([update])
  }

  const selectedElement = selectedComponent?.element

  const getAttribute = useCallback(
    <T extends CommonTools>(
      attribute: T,
      isComputed = false,
    ): ToolAttributeValue<T>['value'] => {
      if (isComputed && selectedElement) {
        return getComputedValue(selectedElement, camelToKebab(attribute))
      }
      if (data) {
        const value = data.find((d) => d.name === attribute)
        if (value) {
          return value.value
        }
      }

      return ''
    },
    [data, selectedElement],
  )

  const getCurrentToken = useCallback(
    <T extends CommonTools>(name: T): Token['values'][number] | undefined => {
      const value = getAttribute(name)
      const token = tokens.find((t) => t.name === name)
      if (token) {
        const tokenValue = token.values.find((v) =>
          compareCSSValues(name, v.value, value),
        )
        if (tokenValue) {
          return tokenValue
        }
      }

      return undefined
    },
    [getAttribute, tokens],
  )

  const getTokenValues = useCallback(
    <T extends CommonTools>(name: T): Token['values'] => {
      const token = tokens.find((t) => t.name === name)
      if (token) {
        return token.values
      }

      return []
    },
    [tokens],
  )

  return (
    <ComponentAttributeContext.Provider
      value={{
        selectedComponent: selectedComponent?.element,
        onAttributeChange,
        data,
        getAttribute,
        getCurrentToken,
        getTokenValues,
      }}
    >
      {children}
    </ComponentAttributeContext.Provider>
  )
}

export const useComponentAttribute = () => {
  return useContext(ComponentAttributeContext)
}
