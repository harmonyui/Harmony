'use client'

import { Button } from '@harmony/ui/src/components/core/button'
import { Header } from '@harmony/ui/src/components/core/header'
import { Input } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WorkspaceCreationModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
}

export const WorkspaceCreationModal: React.FunctionComponent<
  WorkspaceCreationModalProps
> = ({ isOpen, onClose, teamId }) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const onNext = () => {
    if (!name) {
      setError('Please enter a workspace name')
      return
    }
    router.push(`/setup/developer/${teamId}?workspaceName=${name}`)
  }

  return (
    <HarmonyModal show={isOpen} onClose={onClose}>
      <Header level={2}>Create New Workspace</Header>
      <div className='flex flex-col gap-4 mt-2'>
        <>
          <div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
            <Label className='sm:col-span-full' label='Workspace Name:'>
              <Input
                className='w-full'
                value={name}
                onChange={(value: string) => setName(value)}
                placeholder='Enter workspace name'
              />
            </Label>
          </div>

          <div className='flex flex-col gap-2'>
            <Header level={4}>
              To complete setup, you'll need to connect a GitHub repository.
            </Header>
          </div>

          {error ? <p className='text-sm text-red-400'>{error}</p> : null}

          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onNext}>Next</Button>
          </div>
        </>
      </div>
    </HarmonyModal>
  )
}
