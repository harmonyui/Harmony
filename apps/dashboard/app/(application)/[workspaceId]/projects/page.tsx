import React from 'react'
import { getBranches } from '@harmony/server/src/api/repository/database/branch'
import { withWorkspace } from '../../../../utils/protected-routes-hoc'
import { getThumbnail } from '../../actions'
import { ProjectSetUp } from './components/setup'
import { ProjectDisplay } from './components/project'

const ProjectsPage = withWorkspace(async ({ ctx, workspace }) => {
  const branches = await getBranches({
    prisma: ctx.prisma,
    repositoryId: workspace.repository.id,
    accountId: ctx.session.account.id,
  })

  return (
    <>
      {branches ? (
        <ProjectDisplay
          projects={branches}
          defaultUrl={workspace.repository.defaultUrl}
          getThumbnail={getThumbnail}
          repositoryId={workspace.repository.id}
        />
      ) : (
        <ProjectSetUp />
      )}
    </>
  )
})

export default ProjectsPage
