/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok */
import { ModalProvider } from '@harmony/ui/src/components/core/modal'
import React from 'react'
import { getBranches } from '@harmony/server/src/api/routers/branch'
import { withAuth } from '../../utils/protected-routes-hoc'
import { SideNav } from '../../utils/side-nav'
import { ProjectSetUp } from './components/setup'
import { ProjectDisplay } from './components/project'

const ProjectsPage = withAuth(async ({ ctx }) => {
  const branches = ctx.session.account.repository
    ? await getBranches({
        prisma: ctx.prisma,
        repositoryId: ctx.session.account.repository.id,
      })
    : undefined
  // const onClick = (): void => {
  // 	redirect('/setup');
  // }

  return (
    <ModalProvider>
      <SideNav>
        {branches ? (
          <ProjectDisplay
            Projectes={branches}
            defaultUrl={ctx.session.account.repository!.defaultUrl}
          />
        ) : (
          <ProjectSetUp />
        )}
        {/* <SnappingDemo/> */}
      </SideNav>
    </ModalProvider>
  )
})

export default ProjectsPage
