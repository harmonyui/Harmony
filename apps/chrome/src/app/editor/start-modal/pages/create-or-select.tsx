import { Button } from '@harmony/ui/src/components/core/button'
import type { StartPageComponent } from '../types'

export const CreateOrSelectPage: StartPageComponent = ({
  setPage,
  onOpenProject,
}) => {
  return (
    <div className='flex flex-col gap-2 items-center'>
      <Button onClick={() => setPage('createProject')}>Create Project</Button>
      <span>or</span>
      <div className='flex gap-2'>
        <Button onClick={() => setPage('selectProject')}>Select Project</Button>
        <Button onClick={() => onOpenProject('local')} mode='secondary'>
          Local Project
        </Button>
      </div>
    </div>
  )
}
