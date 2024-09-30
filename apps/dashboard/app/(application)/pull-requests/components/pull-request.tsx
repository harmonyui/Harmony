/* eslint-disable @typescript-eslint/no-unused-vars -- ok*/

/* eslint-disable @typescript-eslint/no-shadow -- ok*/
'use client'
import {
  GitBranchIcon,
  GitPullRequestIcon,
} from '@harmony/ui/src/components/core/icons'
import { Button } from '@harmony/ui/src/components/core/button'
import { useState } from 'react'
import type { BranchItem, PullRequest } from '@harmony/util/src/types/branch'
import { ModalProvider } from 'react-aria'
import { useChangeProperty } from '@harmony/ui/src/hooks/change-property'
import { Input } from '@harmony/ui/src/components/core/input'
import { Header } from '@harmony/ui/src/components/core/header'
import { Label } from '@harmony/ui/src/components/core/label'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { api } from '../../../../utils/api'

export const PullRequestDisplay: React.FunctionComponent<{
  items: PullRequest[]
}> = ({ items }) => {
  const [showNewPullRequest, setShowNewPullRequest] = useState(false)

  return (
    <ModalProvider>
      <div className='hw-flex hw-flex-col hw-gap-4'>
        {items.length ? (
          <>
            {items.map((item) => (
              <PullRequestLineItem key={item.title} item={item} />
            ))}
            <CreateNewPullRequestModal
              show={showNewPullRequest}
              onClose={() => setShowNewPullRequest(false)}
            />
          </>
        ) : null}
      </div>
    </ModalProvider>
  )
}

interface CreateNewBranchModalProps {
  show: boolean
  onClose: () => void
  branch?: BranchItem
}
export const CreateNewPullRequestModal: React.FunctionComponent<
  CreateNewBranchModalProps
> = ({ show, branch, onClose }) => {
  const { mutate } = api.pullRequest.createPullRequest.useMutation()
  const query = api.branch.getBranches.useQuery()
  const [pullRequest, setPullRequest] = useState<PullRequest>({
    id: '',
    title: '',
    body: '',
    url: '',
  })
  const changeProperty = useChangeProperty<PullRequest>(setPullRequest)
  const [branchItem, setBranchItem] = useState<BranchItem | undefined>(branch)
  const [loading, setLoading] = useState(false)

  const branches = query.data || []

  const onNewPullRequest = () => {
    if (branchItem === undefined) return
    setLoading(true)

    mutate(
      { pullRequest: { ...pullRequest }, branch: branchItem },
      {
        onSuccess() {
          onClose()
          setLoading(false)
        },
      },
    )
  }

  const branchItems: DropdownItem<number>[] = branches.map<
    DropdownItem<number>
  >((branch, i) => ({ id: i, name: branch.label }))
  const branchId = branchItem ? branches.indexOf(branchItem) : undefined

  return (
    <HarmonyModal show={show} onClose={onClose}>
      <div className='hw-flex hw-gap-2 hw-items-center'>
        <GitBranchIcon className='hw-w-6 hw-h-6' />
        <Header level={3}>Create a Pull Request</Header>
      </div>
      <div className='hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500'>
        <p>
          Fill out the following fields to create a new pull request through
          Harmony
        </p>
      </div>
      <div className='hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2'>
        <Label className='sm:hw-col-span-full' label='Title:'>
          <Input
            className='hw-w-full'
            value={pullRequest.title}
            onChange={changeProperty.formFunc('title', pullRequest)}
          />
        </Label>
        <Label className='sm:hw-col-span-full' label='Body:'>
          <Input
            className='hw-w-full'
            type='textarea'
            value={pullRequest.body}
            onChange={changeProperty.formFunc('body', pullRequest)}
          />
        </Label>
        {branch === undefined ? (
          <Label className='sm:hw-col-span-3' label='Branch:'>
            <Dropdown
              items={branchItems}
              initialValue={branchId}
              onChange={({ id }) => setBranchItem(branches[id])}
            >
              Select
            </Dropdown>
          </Label>
        ) : null}
      </div>
      <div className='hw-flex'>
        {branchItem !== undefined ? (
          <Button
            className='hw-ml-auto'
            onClick={onNewPullRequest}
            loading={loading}
          >
            Create Pull Request
          </Button>
        ) : null}
      </div>
    </HarmonyModal>
  )
}

export interface PullRequestLineItemProps {
  item: PullRequest
}
export const PullRequestLineItem: React.FunctionComponent<
  PullRequestLineItemProps
> = ({ item }) => {
  const { title, body, url } = item
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='hw-w-full hw-border hw-rounded-md'>
      <a
        className='hw-flex hw-px-2 hw-justify-between hw-py-3 hw-w-full hw-rounded-md hw-bg-white hover:hw-bg-gray-50 hover:hw-cursor-pointer'
        href={url}
        target='_blank'
      >
        <div className='hw-flex hw-gap-4'>
          <GitPullRequestIcon className='hw-w-6 hw-h-6' />
          <span>{title}</span>
        </div>
        <span>Created by Jacob Hansen</span>
      </a>

      {/* {isOpen ? <div className="hw-flex hw-flex-col hw-gap-2 hw-border-t hw-py-2 hw-px-4">
				<div className="hw-flex hw-flex-col hw-border-2 hw-h-32 hw-text-sm hw-divide-y hw-overflow-auto">
				</div>
				<div className="hw-flex">
					<Button as='a' className="hw-ml-auto" target="_blank" href={url}>Open Pull Request</Button>
				</div>
			</div> : null} */}
    </div>
  )
}
