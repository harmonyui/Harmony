import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import type { Font } from '@harmony/util/src/fonts'
import type {
  ComponentUpdate,
  BehaviorType,
} from '@harmony/util/src/types/component'
import type { UpdateRequest } from '@harmony/util/src/types/network'
import type { Environment } from '@harmony/util/src/utils/component'
import { reverseUpdates } from '@harmony/util/src/utils/component'
import hotkeys from 'hotkeys-js'
import { useState, useEffect } from 'react'
import { findElementsFromId } from '../utils/element-utils'
import { useHarmonyStore } from './state'

interface HarmonyCommandChange {
  name: 'change'
  update: ComponentUpdate[]
}
type HarmonyCommand = HarmonyCommandChange

interface ComponentUpdatorProps {
  onChange?: () => void
  branchId: string
  isSaving: boolean
  setIsSaving: (value: boolean) => void
  isPublished: boolean
  fonts: Font[] | undefined
  onError: (error: string) => void
  environment: Environment
  behaviors: BehaviorType[]
}
export const useComponentUpdator = ({
  onChange,
  branchId,
  isSaving,
  isPublished,
  setIsSaving,
  fonts,
  onError,
}: ComponentUpdatorProps) => {
  const [undoStack, setUndoStack] = useState<HarmonyCommand[]>([])
  const [redoStack, setRedoStack] = useState<HarmonyCommand[]>([])
  const [saveStack, setSaveStack] = useState<HarmonyCommand[]>([])
  const [editTimeout, setEditTimeout] = useState(new Date().getTime())
  const addUpdates = useHarmonyStore((state) => state.addComponentUpdates)
  const makeUpdates = useHarmonyStore((state) => state.makeUpdates)
  const rootElement = useHarmonyStore((state) => state.rootComponent)?.element
  const saveProject = useHarmonyStore((state) => state.saveProject)
  const repositoryId = useHarmonyStore((state) => state.repositoryId)
  const rootComponent = useHarmonyStore((state) => state.rootComponent)
  const updates = useHarmonyStore((state) => state.componentUpdates)

  const save = useEffectEvent(() => {
    return new Promise<void>((resolve) => {
      const copy = saveStack.slice()
      saveCommand(saveStack, { branchId, repositoryId })
        .then((errorUpdates) => {
          if (errorUpdates.length > 0) {
            void change({ name: 'change', update: errorUpdates })
            errorUpdates.forEach((error) => {
              const elements = findElementsFromId(
                error.componentId,
                rootElement,
              )
              elements.forEach((element) => {
                element.dataset.harmonyError = error.errorType
              })
            })
            onError('Some elements are not updateable at the moment')
          }
          resolve()
        })
        .catch(async () => {
          setIsSaving(false)
          for (let i = copy.length - 1; i >= 0; i--) {
            const update = copy[i]
            await change({
              name: update.name,
              update: reverseUpdates(update.update),
            })
          }
          onError('There was an error saving the project')
          resolve()
        })
      setSaveStack([])
      //Force there to be a new change when we are saving
      setEditTimeout(new Date().getTime() - 1000)
    })
  })

  useEffect(() => {
    if (saveStack.length && !isSaving && !isPublished) {
      void save()
    }
  }, [saveStack, isSaving, isPublished])

  const onLeave = useEffectEvent((e: BeforeUnloadEvent) => {
    if ((saveStack.length > 0 || isSaving) && !isPublished) {
      e.preventDefault()
      return 'Are you sure you want to leave?'
    }
  })

  useEffect(() => {
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [])

  const executeCommand = useEffectEvent(
    async (update: ComponentUpdate[], execute = true): Promise<void> => {
      const newCommand: HarmonyCommand = {
        name: 'change',
        update: update.filter((_update) => _update.oldValue !== _update.value),
      }

      //TODO: find a better way to do this
      if (execute) await change(newCommand)

      const newEdits = undoStack.slice()
      const newSaves = saveStack.slice()
      const lastEdits = newEdits[newEdits.length - 1] as
        | HarmonyCommandChange
        | undefined
      const lastEdit =
        lastEdits?.update.length === 1 ? lastEdits.update[0] : undefined
      const newEdit =
        newCommand.update.length === 1 ? newCommand.update[0] : undefined
      const isSameCommandType =
        newEdit &&
        lastEdit &&
        newEdit.type === lastEdit.type &&
        newEdit.name === lastEdit.name &&
        newEdit.componentId === lastEdit.componentId

      const currTime = new Date().getTime()
      if (editTimeout < currTime || !isSameCommandType) {
        newEdits.push(newCommand)
        newSaves.push(newCommand)
        const newTime = currTime + 1000
        setEditTimeout(newTime)
      } else {
        //TODO: Get rid of type = 'component' dependency

        if (
          newEdits.length &&
          newCommand.update.length === 1 &&
          newCommand.update[0] &&
          lastEdits?.update[0] &&
          newCommand.update[0].type !== 'component'
        ) {
          newCommand.update[0].oldValue = lastEdits.update[0].oldValue
          newEdits[newEdits.length - 1] = newCommand
          //TODO: test this to make sure this works
          newSaves[newSaves.length - 1] = newCommand
        } else {
          newEdits.push(newCommand)
          newSaves.push(newCommand)
        }
      }
      addUpdates(newCommand.update)
      setUndoStack(newEdits)
      setSaveStack(newSaves)
      setRedoStack([])
    },
  )

  const clearUpdates = async (): Promise<void> => {
    return change({ name: 'change', update: reverseUpdates(updates) })
  }

  const change = async ({ update }: HarmonyCommandChange): Promise<void> => {
    if (!rootComponent) return
    for (const up of update) {
      await makeUpdates([up], fonts, rootElement)
    }

    onChange && onChange()
  }

  const changeStack = async (
    from: [
      HarmonyCommandChange[],
      React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>,
    ],
    to: [
      HarmonyCommandChange[],
      React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>,
    ],
  ) => {
    const [fromValue, fromSet] = from
    const [toValue, toSet] = to

    if (fromValue.length === 0) return
    const lastEdit = fromValue[fromValue.length - 1]
    //if (!lastEdit) throw new Error("We shouldn't get here");

    const newUpdates = lastEdit.update.map((up) => ({
      ...up,
      value: up.oldValue,
      oldValue: up.value,
    }))
    const newEdit: HarmonyCommand = { name: 'change', update: newUpdates }
    await change(newEdit)
    const newFrom = fromValue.slice()
    newFrom.splice(newFrom.length - 1)

    const newTo = toValue.slice()
    newTo.push(newEdit)
    fromSet(newFrom)
    toSet(newTo)

    //TODO: Test this
    const newSaves = saveStack.slice()
    newSaves.push(newEdit)
    setSaveStack(newSaves)

    addUpdates(newEdit.update)
  }

  const onUndo = useEffectEvent(() => {
    changeStack([undoStack, setUndoStack], [redoStack, setRedoStack])
  })

  const onRedo = useEffectEvent(() => {
    changeStack([redoStack, setRedoStack], [undoStack, setUndoStack])
  })

  const saveCommand = async (
    commands: HarmonyCommand[],
    _save: { branchId: string; repositoryId: string | undefined },
  ) => {
    setIsSaving(true)
    const cmds = commands.map((cmd) => ({ update: cmd.update }))
    const data: UpdateRequest = {
      values: cmds,
      repositoryId: _save.repositoryId,
      branchId,
    }
    const resultData = await saveProject(data)
    setIsSaving(false)

    return resultData.errorUpdates
  }

  useEffect(() => {
    hotkeys('ctrl+z, command+z', onUndo)
    hotkeys('ctrl+shift+z, command+shift+z', onRedo)

    return () => {
      hotkeys.unbind('ctrl+z, command+z', onUndo)
      hotkeys.unbind('ctrl+shift+z, command+shift+z', onRedo)
    }
  }, [])

  return { executeCommand, onUndo, clearUpdates }
}
