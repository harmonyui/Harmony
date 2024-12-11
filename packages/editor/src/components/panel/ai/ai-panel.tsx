import { Input } from '@harmony/ui/src/components/core/input'
import { useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { useHarmonyStore } from '../../../hooks/state'
import { DraggablePanel } from '../_common/panel/draggable-panel'
import { Panels } from '../_common/panel/types'
import { useHarmonyContext } from '../../harmony-context'
import { useComponentAttribute } from '../../attributes/attribute-provider'
import { getComponentIdAndChildIndex } from '../../../utils/element-utils'

export const AIPanel: React.FunctionComponent = () => {
  const isDemo = useHarmonyStore((state) => state.isDemo)
  const { onAttributesChange, setError } = useHarmonyContext()
  const { data } = useComponentAttribute()
  const selectedComponent = useHarmonyStore((state) => state.selectedComponent)

  const createUpdateFromText = useHarmonyStore(
    (state) => state.createUpdateFromText,
  )

  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!text || !data || !selectedComponent) return
    setLoading(true)

    try {
      const { childIndex, componentId } = getComponentIdAndChildIndex(
        selectedComponent.element,
      )
      const updates = await createUpdateFromText({
        text,
        currentAttributes: data.map((d) => ({ name: d.name, value: d.value })),
        childIndex,
        componentId,
      })
      onAttributesChange(updates, true)
    } catch (e) {
      setError(`There was an error generating the updates: ${String(e)}`)
    }

    setLoading(false)
  }

  if (isDemo || isDemo === undefined) return null

  return (
    <DraggablePanel title='AI' id={Panels.AI} defaultActive={false}>
      <div className='hw-max-w-xs hw-flex hw-flex-col hw-gap-2'>
        <p>Select an element and use natural language to make changes to it.</p>
        <Input
          type='textarea'
          className='hw-w-full'
          placeholder='Add a border to this element...'
          value={text}
          onChange={setText}
        />
        <Button
          className='hw-ml-auto'
          disabled={!text || !data}
          loading={loading}
          onClick={() => onSubmit()}
        >
          Submit
        </Button>
      </div>
    </DraggablePanel>
  )
}
