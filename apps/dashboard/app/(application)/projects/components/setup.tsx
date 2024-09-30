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
      <div> No Repositories. Please finish setting up here:</div>

      <Button className='hw-w-fit hw-ml-auto hw-mt-2' onClick={onClick}>
        Continue
      </Button>
    </>
  )
}
