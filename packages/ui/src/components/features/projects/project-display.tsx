'use client'

import type { BranchItem } from '@harmony/util/src/types/branch'
import {
  displayElapsedTime,
  wordToKebabCase,
} from '@harmony/util/src/utils/common'
import { useState } from 'react'
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
}
export const ProjectDisplay: React.FunctionComponent<ProjectDisplayProps> = ({
  projects,
  defaultUrl,
  onDelete,
  onCreate,
  onOpenProject,
}) => {
  const [showNewProject, setShowNewProject] = useState(false)

  return (
    <ModalProvider>
      <div className='hw-flex hw-flex-col hw-gap-4 hw-h-full'>
        <Button
          className='hw-w-fit hw-ml-auto'
          onClick={() => {
            setShowNewProject(true)
          }}
        >
          Create Project <PlusIcon className='hw-ml-1 hw-h-5 hw-w-5' />
        </Button>
        {projects.length ? (
          <div className='hw-flex hw-gap-16 hw-flex-wrap hw-overflow-auto'>
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
              />
            ))}
          </div>
        ) : (
          <div className='hw-h-full hw-items-center hw-justify-center hw-flex hw-text-lg hw-mb-48 hw-text-[#88939D]'>
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
      <div className='hw-flex hw-gap-2 hw-items-center'>
        <GitBranchIcon className='hw-w-6 hw-h-6' />
        <Header level={3}>Create a Project</Header>
      </div>
      <div className='hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500'>
        <p>
          Fill out the following fields to create a new Project through Harmony
        </p>
      </div>
      <div className='hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2'>
        <Label className='sm:hw-col-span-full' label='Project Label:'>
          <Input
            className='hw-w-full'
            value={project.label}
            onChange={changeProperty.formFunc('label', project)}
          />
        </Label>
        <Label className='sm:hw-col-span-full' label='Url:'>
          <Input
            className='hw-w-full'
            value={project.url}
            onChange={changeProperty.formFunc('url', project)}
          />
        </Label>
      </div>
      {error ? <p className='hw-text-red-400 hw-text-sm'>{error}</p> : null}
      <div className='hw-flex'>
        <Button className='hw-ml-auto' onClick={onNewProject} loading={loading}>
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
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({
  item,
  onOpenHarmony,
  onDelete: onDeleteProps,
}) => {
  const [thumbnail] = useState<string>(
    `${WEB_URL}/harmony-project-placeholder.svg`,
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      <div className='hw-w-[250px]'>
        {/* <h4 className="hw-mt-10">Hello there</h4>
			<p className="hw-mt-5">Thank you please</p> */}
        <button className='hw-rounded-md hw-overflow-auto hw-block'>
          <img
            className='hw-w-[250px]'
            src={thumbnail}
            onClick={onOpenHarmony}
          />
        </button>
        <div className='hw-mt-2'>
          <div className='hw-flex hw-justify-between'>
            <span>{item.label}</span>
            <DropdownIcon
              className='hover:hw-bg-gray-200 hw-rounded-full '
              icon={EllipsisHorizontalIcon}
              items={moreItems}
              mode='none'
              onChange={(_item) => {
                ;(_item as (typeof moreItems)[number]).onClick()
              }}
            />
          </div>
          <div className='hw-text-xs hw-text-gray-400 hw-text-start'>
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