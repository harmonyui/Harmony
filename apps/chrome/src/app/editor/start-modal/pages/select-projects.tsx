import type { BranchItem } from '@harmony/util/src/types/branch'
import { useState, useEffect, useMemo } from 'react'
import { EDITOR_URL } from '@harmony/util/src/constants'
import type { StartPageComponent } from '../types'
import { useDataLayer } from '../../../../hooks/data-layer'

export const SelectProjectsPage: StartPageComponent = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<BranchItem[]>([])
  const { client } = useDataLayer()

  useEffect(() => {
    const initialize = async () => {
      if (client) {
        const data = await client.branch.getBranches.query()
        data && setProjects(data)
      }
    }

    void initialize()
  }, [client])

  const filteredProjects = useMemo(
    () => projects.filter((item) => item.url.includes(window.location.origin)),
    [projects],
  )

  return (
    <div className='hw-grid hw-grid-cols-1 sm:hw-grid-cols-2 lg:hw-grid-cols-3 hw-gap-6 hw-mt-6'>
      {filteredProjects.length > 0 ? (
        projects.map((item) => (
          <ProjectCard
            key={item.id}
            item={item}
            onClick={() => onOpenProject(item.id)}
          />
        ))
      ) : (
        <div>No Projects</div>
      )}
    </div>
  )
}

const ProjectCard: React.FunctionComponent<{
  item: BranchItem
  onClick: () => void
}> = ({ item, onClick }) => {
  return (
    <button className='hw-group' onClick={onClick}>
      <div className='hw-relative hw-flex hw-items-center hw-justify-center hw-overflow-hidden hw-rounded-lg hw-h-48'>
        <img
          src={`${EDITOR_URL}/icon-128.png`}
          alt='Harmony Logo'
          className='hw-object-cover hw-h-8 hw-w-8 group-hover:hw-scale-105 hw-transition-transform hw-duration-300'
        />
        <div className='hw-absolute hw-inset-0 hw-bg-black/50 hw-flex hw-items-center hw-justify-center hw-opacity-0 group-hover:hw-opacity-100 hw-transition-opacity hw-duration-300'>
          <div className='hw-text-white hw-text-lg hw-font-semibold'>
            View Project
          </div>
        </div>
      </div>
      <div className='hw-mt-3'>
        <h3 className='hw-text-lg hw-font-semibold'>{item.label}</h3>
        {/* <p className='hw-text-[#6e6e77] hw-text-sm'>
          {item.description}
        </p> */}
      </div>
    </button>
  )
}
