'use client'
import { useState } from 'react'
import { Button } from '@harmony/ui/src/components/core/button'
import type { TableGridColumn } from '@harmony/ui/src/components/core/table-grid'
import { TableGrid } from '@harmony/ui/src/components/core/table-grid'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { Header } from '@harmony/ui/src/components/core/header'
import { Label } from '@harmony/ui/src/components/core/label'
import { Input } from '@harmony/ui/src/components/core/input'
import { useChangeProperty } from '@harmony/ui/src/hooks/change-property'
import { emailSchema } from '@harmony/util/src/types/utils'
import type { TeamMember as TeamMemberServer } from '@harmony/util/src/types/branch'
import { PlusIcon } from '@harmony/ui/src/components/core/icons'
import { api } from '../../../../../utils/api'

type TeamMember = Omit<TeamMemberServer, 'contact'> & { contact: string }

interface TeamDisplayProps {
  members: TeamMember[]
}
export const TeamDisplay: React.FunctionComponent<TeamDisplayProps> = ({
  members,
}) => {
  const [show, setShow] = useState(false)
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center mb-4'>
        <Header>My Team</Header>
        <Button className='w-fit ml-auto' onClick={() => setShow(true)}>
          <PlusIcon className='h-4 w-4 mr-1' /> Invite Team Member
        </Button>
      </div>
      <TeamGrid members={members} />
      <CreateNewProjectModal show={show} onClose={() => setShow(false)} />
    </div>
  )
}
interface TeamGridProps {
  members: TeamMember[]
}
export const TeamGrid: React.FunctionComponent<TeamGridProps> = ({
  members,
}) => {
  const columns: TableGridColumn<keyof TeamMember>[] = [
    {
      id: 'name',
      label: 'Name',
    },
    {
      id: 'role',
      label: 'Role',
    },
    {
      id: 'contact',
      label: 'Contact',
    },
  ]
  return (
    <TableGrid data={members} columns={columns}>
      {(item) => ({
        id: item.id,
        gridItem: {
          contact: item.contact,
          id: item.id,
          name: item.name,
          role: item.role,
        },
      })}
    </TableGrid>
  )
}

interface AccountMirror {
  firstName: string
  lastName: string
  role: string
  link: string
}
export const TeamMirrorDisplay: React.FunctionComponent<{
  accounts: AccountMirror[]
}> = ({ accounts }) => {
  const columns: TableGridColumn<keyof AccountMirror>[] = [
    {
      id: 'firstName',
      label: 'First Name',
    },
    {
      id: 'lastName',
      label: 'Last Name',
    },
    {
      id: 'role',
      label: 'Role',
    },
    {
      id: 'link',
      label: 'Link',
    },
  ]
  return (
    <div>
      <TableGrid data={accounts} columns={columns}>
        {(item) => ({
          id: item.link,
          gridItem: {
            firstName: item.firstName,
            lastName: item.lastName,
            role: item.role,
            link: {
              compareKey: item.link,
              label: (
                <a className='text-blue-400' href={item.link} target='_blank'>
                  Mirror
                </a>
              ),
            },
          },
        })}
      </TableGrid>
    </div>
  )
}

interface CreateNewProjectModalProps {
  show: boolean
  onClose: () => void
  //onSuccessfulCreation: (item: TeamMember) => void;
}
const CreateNewProjectModal: React.FunctionComponent<
  CreateNewProjectModalProps
> = ({ show, onClose }) => {
  const { mutate } = api.team.sendNewMemberInvite.useMutation()
  const [teamMember, setTeamMember] = useState<TeamMember>({
    id: '',
    name: '',
    role: '',
    contact: 'example@gmail.com',
  })
  const changeProperty = useChangeProperty<TeamMember>(setTeamMember)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onNewTeamMember = () => {
    if (!teamMember.name || !teamMember.role || !teamMember.contact) {
      setError('Please fill out all fields')
      return
    }
    const email = emailSchema.safeParse(teamMember.contact)
    if (!email.success) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    mutate(
      { teamMember: { ...teamMember, contact: email.data } },
      {
        onSuccess() {
          //onSuccessfulCreation(data);
          onClose()
          setLoading(false)
        },
      },
    )
  }
  return (
    <HarmonyModal show={show} onClose={onClose}>
      <div className='flex gap-2 items-center'>
        <Header level={3}>Invite a Team Member</Header>
      </div>
      <div className='mt-2 max-w-xl text-sm text-gray-500'>
        <p>Fill out the following fields to invite someone to your team</p>
      </div>
      <div className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 my-2'>
        <Label className='sm:col-span-3' label='Name:'>
          <Input
            className='w-full'
            value={teamMember.name}
            onChange={changeProperty.formFunc('name', teamMember)}
          />
        </Label>
        <Label className='sm:col-span-3' label='Role:'>
          <Input
            className='w-full'
            value={teamMember.role}
            onChange={changeProperty.formFunc('role', teamMember)}
          />
        </Label>
        <Label className='sm:col-span-full' label='Email:'>
          <Input
            className='w-full'
            value={teamMember.contact}
            onChange={changeProperty.formFunc('contact', teamMember)}
          />
        </Label>
      </div>
      {error ? <p className='text-red-400 text-sm'>{error}</p> : null}
      <div className='flex'>
        <Button className='ml-auto' onClick={onNewTeamMember} loading={loading}>
          Send Invite
        </Button>
      </div>
    </HarmonyModal>
  )
}
