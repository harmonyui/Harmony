import { Button } from '@harmony/ui/src/components/core/button'
import { Input } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import type { BranchItem } from '@harmony/util/src/types/branch'
import { wordToKebabCase } from '@harmony/util/src/utils/common'
import { useState } from 'react'
import type { StartPageComponent } from '../types'
import { useDataLayer } from '../../../../hooks/data-layer'

export const CreateProjectPage: StartPageComponent = ({ onOpenProject }) => {
  const [projectName, setProjectName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { client } = useDataLayer()

  const onCreate = (): void => {
    const branch: BranchItem = {
      id: '',
      label: projectName,
      name: wordToKebabCase(projectName),
      url: window.location.origin,
      commits: [],
      lastUpdated: new Date(),
    }
    setLoading(true)
    client?.branch.createBranch
      .mutate({ branch, repositoryId: undefined })
      .then((data) => {
        onOpenProject(data.id)
        setLoading(false)
      })
      .catch(() => {
        setError('There was an error creating the project')
        setLoading(false)
      })
  }

  return (
    <div className='flex flex-col gap-4'>
      <Label label='Project Name'>
        <Input
          className='w-full'
          value={projectName}
          onChange={setProjectName}
        />
      </Label>
      <div>
        {error ? <p className='text-red-400 text-sm mb-1'>{error}</p> : null}
        <Button
          className='w-full'
          disabled={!projectName}
          onClick={onCreate}
          loading={loading}
        >
          Create Project
        </Button>
      </div>
    </div>
  )
}
