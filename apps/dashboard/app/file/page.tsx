import { redirect } from 'next/navigation'
import { withAuth } from '../../utils/protected-routes-hoc'
import FileGetter from './file-getter'
import { onSubmit } from './get-file'

export default withAuth(function FilePage({ ctx }) {
  if (ctx.session.auth.role !== 'harmony-admin') {
    redirect('/')
  }

  return <FileGetter onSubmit={onSubmit} />
})
