import type { BranchItem } from '@harmony/util/src/types/branch'
import { useState, useEffect, useMemo } from 'react'
import { EDITOR_URL } from '@harmony/util/src/constants'
import type { StartPageComponent } from '../types'
import { useDataLayer } from '../../../../hooks/data-layer'
import { Spinner } from '@harmony/ui/src/components/core/spinner'

export const SelectProjectsPage: StartPageComponent = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<BranchItem[]>([])
  const [loading, setLoading] = useState(false)
  const { client } = useDataLayer()

  useEffect(() => {
    const initialize = async () => {
      if (client) {
        setLoading(true)
        const data = await client.branch.getBranches.query()
        if (data) {
          setProjects(data)
        }
        setLoading(false)
      }
    }

    void initialize()
  }, [client])

  const filteredProjects = useMemo(
    () => projects.filter((item) => item.url.includes(window.location.origin)),
    [projects],
  )

  if (loading) {
    return <Spinner sizeClass='h-5 w-5'></Spinner>
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
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
    <button className='group' onClick={onClick}>
      <div className='relative flex items-center justify-center overflow-hidden rounded-lg h-48'>
        <img
          src={`${EDITOR_URL}/icon-128.png`}
          alt='Harmony Logo'
          className='object-cover h-8 w-8 group-hover:scale-105 transition-transform duration-300'
        />
        <div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
          <div className='text-white text-lg font-semibold'>View Project</div>
        </div>
      </div>
      <div className='mt-3'>
        <h3 className='text-lg font-semibold'>{item.label}</h3>
        {/* <p className='text-[#6e6e77] text-sm'>
          {item.description}
        </p> */}
      </div>
    </button>
  )
}
