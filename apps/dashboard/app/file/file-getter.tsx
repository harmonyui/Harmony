'use client'

import { Button } from '@harmony/ui/src/components/core/button'
import CodeSnippet from '@harmony/ui/src/components/core/code-snippet'
import { Input, InputBlur } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import { getLocationsFromComponentId } from '@harmony/util/src/utils/component'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function FileGetter({
  onSubmit: onSubmitProps,
}: {
  onSubmit: (ops: { repositoryId: string; file: string }) => Promise<string>
}) {
  const [repositoryId, setRepositoryId] = useSearchParamState('repositoryId')
  const [harmonyId, setHarmonyId] = useSearchParamState('harmonyId')
  const [code, setCode] = useState<string[]>([])
  const [activeFile, setActiveFile] = useSearchParamState('path')

  useEffect(() => {
    if (activeFile && repositoryId) {
      void onSubmitProps({
        file: activeFile === 'root' ? '' : activeFile,
        repositoryId,
      }).then((codes) => {
        setCode([codes])
      })
    }
  }, [activeFile, repositoryId])

  const onSubmit = () => {
    if (!harmonyId || !repositoryId) return

    const locations = getLocationsFromComponentId(harmonyId)

    const promises: Promise<string>[] = []
    for (const location of locations) {
      promises.push(onSubmitProps({ file: location.file, repositoryId }))
    }

    void Promise.all(promises).then((codes) => {
      setCode(codes)
    })
  }

  const split = useMemo(() => {
    return harmonyId
      ? harmonyId.split('#').map((a) => `${atob(a)}-${a}`)
      : undefined
  }, [harmonyId])

  return (
    <div>
      <Label label='repository id'>
        <Input value={repositoryId} onChange={setRepositoryId} />
      </Label>
      <Label label='harmony id'>
        <InputBlur value={harmonyId} onChange={setHarmonyId} />
      </Label>
      <Label label='file'>
        <InputBlur value={activeFile} onChange={setActiveFile} />
      </Label>
      <Button onClick={onSubmit}>Submit</Button>
      {code.map((c, i) => (
        <div>
          {split ? <p>{split[i]}</p> : null}
          <CodeSnippet language='javascript' code={c} showLineNumbers />
        </div>
      ))}
    </div>
  )
}

const useSearchParamState = <T extends string>(
  name: string,
  initialValue?: T,
): [T, (value: T) => void] => {
  const searchParams = useSearchParams()
  const [state, setState] = useState<T>(
    initialValue || (searchParams.get(name) as T),
  )
  const router = useRouter()

  useEffect(() => {
    if (state) {
      const url = new URL(window.location.href)
      url.searchParams.set(name, state)
      router.push(url.href)
    }
  }, [state])

  return [state, setState]
}
