/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok */
import React from 'react'
import { getBranches } from '@harmony/server/src/api/repository/database/branch'
import { withAuth } from '../../../utils/protected-routes-hoc'
import { getThumbnail } from '../actions'
import { ProjectSetUp } from './components/setup'
import { ProjectDisplay } from './components/project'

const ProjectsPage = withAuth(async ({ ctx }) => {
  const branches = ctx.session.account.repository
    ? await getBranches({
        prisma: ctx.prisma,
        repositoryId: ctx.session.account.repository.id,
        accountId: ctx.session.account.id,
      })
    : undefined
  // const onClick = (): void => {
  // 	redirect('/setup');
  // }

  return (
    <>
      {branches ? (
        <ProjectDisplay
          projects={branches}
          defaultUrl={ctx.session.account.repository!.defaultUrl}
          getThumbnail={getThumbnail}
        />
      ) : (
        <ProjectSetUp />
      )}
    </>
  )
})

export default ProjectsPage
