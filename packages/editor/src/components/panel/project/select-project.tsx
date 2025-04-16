import { Header } from '@harmony/ui/src/components/core/header'
import { useHarmonyStore } from '../../../hooks/state'
import { Label } from '@harmony/ui/src/components/core/label'
import { Input } from '@harmony/ui/src/components/core/input'
import { useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import { ToggleSwitch } from '@harmony/ui/src/components/core/toggle-switch'
import { useBranchId } from '../../../hooks/branch-id'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { cn } from '@harmony/ui/src/libs/utils'

interface SelectProjectProps {}

export const SelectProject: React.FunctionComponent<
  SelectProjectProps
> = () => {
  const { branchId, setBranchId } = useBranchId()
  const branches = useHarmonyStore((state) => state.branches)
  const isInitialized = useHarmonyStore((state) => state.isInitialized)
  const [show, setShow] = useState(false)
  const disabled = !isInitialized || branchId === 'local'
  return (
    <>
      <div className='p-4 bg-background max-h-80'>
        <div className='flex flex-col gap-2'>
          <ToggleSwitch
            label='Local Development'
            value={branchId === 'local'}
            onChange={() =>
              setBranchId(
                branchId === 'local'
                  ? undefined
                  : { name: 'Local', id: 'local', label: 'Local' },
              )
            }
          />
          <Button
            className='disabled:opacity-50'
            mode='secondary'
            onClick={() => setShow(true)}
            disabled={disabled}
          >
            Create Project
          </Button>
          {branches.map((branch) => (
            <button
              key={branch.id}
              className='flex items-center gap-2 p-2 bg-white border border-[#e5e5e5] enabled:hover:bg-gray-100 rounded-md enabled:!cursor-pointer disabled:opacity-50'
              onClick={() => setBranchId(branch)}
              disabled={disabled}
            >
              <div
                className={cn(
                  'size-4 border rounded-full',
                  branchId === branch.id ? 'bg-green-500' : 'bg-gray-400',
                )}
              />
              <div className='flex flex-col'>
                <div className='text-sm font-medium text-black'>
                  {branch.name}
                </div>
                <div className='text-xs text-gray-700'>{branch.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <CreateProjectModal show={show} onClose={() => setShow(false)} />
    </>
  )
}

interface CreateProjectModalProps {
  show: boolean
  onClose: () => void
}
const CreateProjectModal: React.FunctionComponent<CreateProjectModalProps> = ({
  show,
  onClose,
}) => {
  const [name, setName] = useState('')
  const { setBranchId } = useBranchId()
  const createProject = useHarmonyStore((state) => state.createProject)
  const repositoryId = useHarmonyStore((state) => state.repositoryId)

  const onCreate = async () => {
    const url = new URL(`${window.location.origin}${window.location.pathname}`)

    const urlString = url.toString()
    const newProject = await createProject({
      name,
      url: urlString,
      repositoryId: repositoryId ?? '',
    })
    setBranchId(newProject)
    onClose()
  }
  return (
    <HarmonyModal show={show} onClose={onClose} editor>
      <Header level={2}>Create Project</Header>
      <div className='flex flex-col gap-2 mt-2'>
        <Label label='Project Name'>
          <Input value={name} onChange={setName} />
        </Label>
        <Button mode='primary' className='w-fit' onClick={onCreate}>
          Create
        </Button>
      </div>
    </HarmonyModal>
  )
}
