import { redirect } from 'next/navigation'
import { withAuth } from '../../../../../utils/protected-routes-hoc'
import { NewButton } from '../../../../../utils/new-button'

//TODO: Add admin God auth check in layout
const NewAccount = withAuth(({ ctx }) => {
  if (ctx.session.auth.role !== 'harmony-admin') {
    redirect('/')
  }

  return <NewButton />
})

export default NewAccount
