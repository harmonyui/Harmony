import { ComponentUpdate } from '@harmony/util/src/types/component'
import { VersionUpdate } from '../../utils/version-updates'
import { ComponentUpdateState } from './component-update/slice'
import { createHarmonySlice } from './factory'
import { getComponentName } from '../../components/panel/design/utils'
import { ComponentElement } from '../../components/inspector/component-identifier'
import { ComponentState, findElement } from './component-state'
import { findElementFromId } from '../../utils/element-utils'
import { ProjectInfoState } from './project-info'
import { displayTime } from '@harmony/util/src/utils/common'
import { getTokenValue } from '../../components/attributes/utils'

interface VersionUpdatesState {
  versionUpdates: VersionUpdate[]
}

const isSameDay = (date1: Date, date2: Date) => {
  return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0]
}

export const createVersionUpdatesSlice = createHarmonySlice<
  VersionUpdatesState,
  ComponentUpdateState & ComponentState & ProjectInfoState
>((set, get) => {
  const updateVersionUpdates = (componentUpdates: ComponentUpdate[]) => {
    const rootComponent = get().rootComponent
    const tokens = get().harmonyTokens
    if (!rootComponent) {
      return
    }

    const getCode = ({
      name,
      value,
      type,
    }: {
      name: string
      value: string
      type: ComponentUpdate['type']
    }) => {
      if (type === 'className') {
        const formattedValue =
          getTokenValue(name, value, tokens)?.value ?? value
        return `${name}: ${formattedValue}`
      }

      return value
    }

    const componentUpdateToVersionUpdate = (
      componentUpdate: ComponentUpdate,
      component: ComponentElement | undefined,
      index: number,
    ): VersionUpdate['changes'][number] | undefined => {
      const element =
        component?.element ||
        findElementFromId(
          componentUpdate.componentId,
          componentUpdate.childIndex,
          rootComponent.element,
        )
      const name = component
        ? getComponentName(component)
        : (element?.tagName.toLowerCase() ?? 'Unknown')

      if (!element) {
        return undefined
      }

      const beforeCode = getCode({
        name: componentUpdate.name,
        value: componentUpdate.oldValue,
        type: componentUpdate.type,
      })
      const afterCode = getCode({
        name: componentUpdate.name,
        value: componentUpdate.value,
        type: componentUpdate.type,
      })

      const user = get().user

      return {
        id: index,
        update: componentUpdate,
        description: '',
        time: displayTime(componentUpdate.dateModified),
        element: name,
        author: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        beforeImage: '',
        afterImage: '',
        beforeCode,
        afterCode,
      }
    }

    const versionUpdates = componentUpdates
      .slice()
      .sort((a, b) => b.dateModified.getTime() - a.dateModified.getTime())
      .reduce<VersionUpdate[]>((prev, curr, index) => {
        const existingUpdate = prev.find((update) =>
          isSameDay(update.date, curr.dateModified),
        )

        const change = componentUpdateToVersionUpdate(
          curr,
          findElement(rootComponent, curr.componentId, curr.childIndex),
          index,
        )
        if (!change) return prev

        if (existingUpdate) {
          existingUpdate.changes.push(change)
        } else {
          prev.push({
            date: curr.dateModified,
            changes: [change],
          })
        }
        return prev
      }, [])

    set({ versionUpdates })
  }
  return {
    state: {
      versionUpdates: [],
    },
    dependencies: {
      componentUpdates(state) {
        updateVersionUpdates(state)
      },
      isReady(state, prevState) {
        if (state && !prevState) {
          updateVersionUpdates(get().componentUpdates)
        }
      },
    },
  }
})
