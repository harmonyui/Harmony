'use client'

import type { BranchItem } from '@harmony/util/src/types/branch'
import {
  displayElapsedTime,
  wordToKebabCase,
} from '@harmony/util/src/utils/common'
import { useEffect, useState } from 'react'
import { WEB_URL } from '@harmony/util/src/constants'
import { useChangeProperty } from '../../../hooks/change-property'
import { ConfirmModal } from '../../core/confirm'
import { DropdownIcon } from '../../core/dropdown'
import { Header } from '../../core/header'
import {
  PlusIcon,
  GitBranchIcon,
  EllipsisHorizontalIcon,
} from '../../core/icons'
import { HarmonyModal, ModalProvider } from '../../core/modal'
import { Button } from '../../core/button'
import { Label } from '../../core/label'
import { Input } from '../../core/input'

export interface ProjectDisplayProps {
  projects: BranchItem[]
  defaultUrl: string
  onDelete: (item: BranchItem) => void
  onCreate: (
    item: BranchItem,
    options: {
      onFinish: (data: BranchItem) => void
      onError: (value: string) => void
    },
  ) => void
  onOpenProject: (item: BranchItem) => void
  getThumbnail: (url: string) => Promise<string>
}
export const ProjectDisplay: React.FunctionComponent<ProjectDisplayProps> = ({
  projects,
  defaultUrl,
  onDelete,
  onCreate,
  onOpenProject,
  getThumbnail,
}) => {
  const [showNewProject, setShowNewProject] = useState(false)

  return (
    <ModalProvider>
      <div className='flex flex-col gap-4 h-full'>
        <div className='flex items-center'>
          <Header>My Projects</Header>
          <Button
            className='w-fit ml-auto'
            onClick={() => {
              setShowNewProject(true)
            }}
          >
            <PlusIcon className='ml-1 h-5 w-5 mr-1' /> Add Project
          </Button>
        </div>
        {projects.length ? (
          <div className='flex gap-16 flex-wrap overflow-auto mt-4'>
            {projects.map((item) => (
              <ProjectLineItem
                key={item.name}
                item={item}
                onOpenHarmony={() => {
                  onOpenProject(item)
                }}
                onDelete={() => {
                  onDelete(item)
                }}
                getThumbnail={getThumbnail}
              />
            ))}
          </div>
        ) : (
          <div className='h-full items-center justify-center flex text-lg mb-48 text-[#88939D]'>
            No Projects Yet!
          </div>
        )}
        <CreateNewProjectModal
          show={showNewProject}
          onClose={() => {
            setShowNewProject(false)
          }}
          defaultUrl={defaultUrl}
          onCreate={onCreate}
        />
      </div>
    </ModalProvider>
  )
}

interface CreateNewProjectModalProps {
  show: boolean
  onClose: () => void
  defaultUrl: string
  onCreate: ProjectDisplayProps['onCreate']
}
const CreateNewProjectModal: React.FunctionComponent<
  CreateNewProjectModalProps
> = ({ show, onClose, onCreate, defaultUrl }) => {
  const [project, setProject] = useState<BranchItem>({
    id: '',
    name: '',
    label: '',
    url: defaultUrl,
    commits: [],
    lastUpdated: new Date(),
  })
  const changeProperty = useChangeProperty<BranchItem>(setProject)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onNewProject = () => {
    if (!project.label || !project.url) {
      setError('Please fill out all fields')
      return
    }
    const name = wordToKebabCase(project.label)
    setLoading(true)
    setError('')
    onCreate(
      { ...project, name },
      {
        onFinish: () => {
          setLoading(false)
          onClose()
        },
        onError: (value) => {
          setError(value)
          setLoading(false)
        },
      },
    )
  }
  return (
    <HarmonyModal show={show} onClose={onClose}>
      <div className='flex gap-2 items-center'>
        <GitBranchIcon className='w-6 h-6 dark:text-white' />
        <Header level={3}>Create a Project</Header>
      </div>
      <div className='mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-300'>
        <p>
          Fill out the following fields to create a new Project through Harmony
        </p>
      </div>
      <div className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 my-2'>
        <Label className='sm:col-span-full' label='Project Label:'>
          <Input
            className='w-full'
            value={project.label}
            onChange={changeProperty.formFunc('label', project)}
          />
        </Label>
        <Label className='sm:col-span-full' label='Url:'>
          <Input
            className='w-full'
            value={project.url}
            onChange={changeProperty.formFunc('url', project)}
          />
        </Label>
      </div>
      {error ? <p className='text-red-400 text-sm'>{error}</p> : null}
      <div className='flex'>
        <Button className='ml-auto' onClick={onNewProject} loading={loading}>
          Open in Harmony
        </Button>
      </div>
    </HarmonyModal>
  )
}

export interface ProjectLineItemProps {
  item: BranchItem
  onOpenHarmony: () => void
  onDelete: () => void
  getThumbnail: (url: string) => Promise<string>
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({
  item,
  onOpenHarmony,
  onDelete: onDeleteProps,
  getThumbnail,
}) => {
  const [thumbnail, setThumbnail] = useState<string>(
    `${WEB_URL}/harmony-project-placeholder.svg`,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const initalize = async () => {
      try {
        const thumbnailUrl = await getThumbnail(item.url)
        setThumbnail(thumbnailUrl)
      } catch (err) {
        console.error(err)
      }
    }

    void initalize()
  }, [])

  const onDeleteDesire = () => {
    setShowDeleteConfirm(true)
  }

  const onDelete = () => {
    setShowDeleteConfirm(false)
    onDeleteProps()
  }

  const moreItems = [
    { id: '0', name: 'Open', onClick: onOpenHarmony },
    { id: '1', name: 'Delete', onClick: onDeleteDesire },
  ]

  return (
    <>
      <div className='w-[250px] border dark:border-gray-700 p-2 rounded-md'>
        {/* <h4 className="mt-10">Hello there</h4>
			<p className="mt-5">Thank you please</p> */}
        <button className='rounded-md overflow-auto block'>
          <img
            className='w-[250px] h-[250px] object-cover'
            src={thumbnail}
            onClick={onOpenHarmony}
          />
        </button>
        <div className='mt-2'>
          <div className='flex justify-between items-center'>
            <span className='dark:text-white'>{item.label}</span>
            <DropdownIcon
              className='hover:bg-gray-200 rounded-full h-5'
              icon={EllipsisHorizontalIcon}
              items={moreItems}
              mode='none'
              onChange={(_item) => {
                ;(_item as (typeof moreItems)[number]).onClick()
              }}
            />
          </div>
          <div className='text-xs text-gray-400 text-start'>
            Last updated {displayElapsedTime(item.lastUpdated)}
          </div>
        </div>
      </div>
      <ConfirmModal
        show={showDeleteConfirm}
        header='Delete Project'
        message={`Are you sure you want to delete the project ${item.label}`}
        onConfirm={onDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
        }}
      />
    </>
  )
}
