'use client'

import { Button } from '@harmony/ui/src/components/core/button'
import { useRouter } from 'next/navigation'

export const ProjectSetUp: React.FunctionComponent = () => {
  const route = useRouter()
  const onClick = (): void => {
    route.push('/setup')
  }
  return (
    <>
      <div className='dark:text-white'>
        {' '}
        No Repositories. Please finish setting up here:
      </div>

      <Button className='w-fit ml-auto mt-2' onClick={onClick}>
        Continue
      </Button>
    </>
  )
}
