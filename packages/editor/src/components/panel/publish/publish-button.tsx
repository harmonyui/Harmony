import { Button } from '@harmony/ui/src/components/core/button'
import { Header } from '@harmony/ui/src/components/core/header'
import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import {
  GitBranchIcon,
  PreviewIcon,
  SendIcon,
} from '@harmony/ui/src/components/core/icons'
import { Input } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import { HarmonyModal } from '@harmony/ui/src/components/core/modal'
import { useChangeProperty } from '@harmony/ui/src/hooks/change-property'
import type { PullRequest } from '@harmony/util/src/types/branch'
import type { PublishRequest } from '@harmony/util/src/types/network'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useHarmonyContext } from '../../harmony-context'
import { useHarmonyStore } from '../../hooks/state'

interface PublishState {
  show: boolean
  setShow: (show: boolean) => void
  onPublish: () => void
  error: string
  setError: (error: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  sendPullRequest: (request: PullRequest) => Promise<void>
  currentBranch:
    | {
        name: string
        id: string
      }
    | undefined
}
type PublishButtonState = Pick<PublishState, 'onPublish' | 'loading'> & {
  icon: IconComponent
  disabled: boolean
}
const PublishContext = createContext<PublishState | undefined>(undefined)

export const PublishProvider: React.FunctionComponent<{
  children: React.ReactNode
  preview?: boolean
}> = ({ children, preview }) => {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { isSaving, setError: setErrorProps } = useHarmonyContext()
  const publish = useHarmonyStore((state) => state.publishChanges)
  const branchId = useHarmonyStore((state) => state.currentBranch.id)
  const currentBranch = useHarmonyStore((state) => state.currentBranch)
  const pullRequestProps = useHarmonyStore((state) => state.pullRequest)
  const isDemo = useHarmonyStore((state) => state.isDemo)

  const isPublished = useMemo(
    () => Boolean(pullRequestProps),
    [pullRequestProps],
  )

  const sendPullRequest = useCallback(
    async (pullRequest: PullRequest) => {
      setLoading(true)
      const request: PublishRequest = {
        branchId,
        pullRequest,
      }
      const published = await publish(request)
      setLoading(false)
      setShow(false)
      if (!published) {
        setError('There was an error when publishing')
        return
      }

      window.open(published.pullRequest.url, '_blank')?.focus()
    },
    [setLoading, setError, setShow, publish, branchId],
  )

  const onViewCode = useCallback(() => {
    if (!currentBranch.id) return

    if (isSaving) {
      setErrorProps('Please wait to finish saving before publishing')
      return
    }

    const pullRequest: PullRequest = {
      id: '',
      title: currentBranch.name,
      body: '',
      url: '',
    }
    if (!pullRequestProps) {
      void sendPullRequest(pullRequest)
    } else {
      window.open(pullRequestProps.url, '_blank')?.focus()
    }
  }, [
    currentBranch,
    isSaving,
    setErrorProps,
    pullRequestProps,
    sendPullRequest,
  ])

  const onPublish = useCallback(() => {
    if (isDemo || isPublished) {
      onViewCode()
      return
    }

    if (isSaving) {
      setErrorProps('Please wait to finish saving before publishing')
      return
    }
    setShow(true)
  }, [setShow, setErrorProps, isSaving, onViewCode, isDemo, isPublished])

  return (
    <PublishContext.Provider
      value={{
        show,
        setShow,
        onPublish,
        loading,
        setLoading,
        error,
        setError,
        sendPullRequest,
        currentBranch,
      }}
    >
      {children}
      <PublishModal preview={preview} />
    </PublishContext.Provider>
  )
}

export const usePublishButton = (): PublishButtonState => {
  const context = useContext(PublishContext)
  if (!context)
    throw new Error('Must wrap the publish button in a PublishProvider')

  const { onPublish, loading, currentBranch } = context
  return { onPublish, loading, icon: PreviewIcon, disabled: !currentBranch }
}

export const PublishButton: React.FunctionComponent = () => {
  const { onPublish, loading, disabled, icon: Icon } = usePublishButton()

  return (
    <Button
      mode='dark'
      className='hw-h-7'
      onClick={onPublish}
      loading={loading}
      disabled={disabled}
    >
      <Icon className='hw-h-5 hw-w-5' />
    </Button>
  )
}

const PublishModal: React.FunctionComponent<{ preview?: boolean }> = ({
  preview = false,
}) => {
  const { changeMode } = useHarmonyContext()
  const publishState = useHarmonyStore((state) => state.publishState)
  const updatePublishState = useHarmonyStore(
    (state) => state.updatePublishState,
  )
  const pullRequest: PullRequest = useMemo(
    () =>
      publishState || {
        id: '',
        title: '',
        body: '',
        url: '',
      },
    [publishState],
  )

  const publishContext = useContext(PublishContext)
  if (!publishContext)
    throw new Error('Must wrap the publish button in a PublishProvider')
  const { show, setShow, error, setError, loading, sendPullRequest } =
    publishContext

  const changeProperty = useChangeProperty<PullRequest>(updatePublishState)

  const onPreview = () => {
    if (!validate()) return
    changeMode('preview')
  }

  const onClose = () => {
    setShow(false)
    setError('')
  }

  const validate = (): boolean => {
    if (!pullRequest.body || !pullRequest.title) {
      setError('Please fill out all fields')
      return false
    }

    return true
  }

  const onNewPullRequest = useCallback(() => {
    if (!validate()) return

    void sendPullRequest(pullRequest)
  }, [pullRequest, sendPullRequest])

  return (
    <>
      <HarmonyModal show={show} onClose={onClose} editor>
        <div className='hw-flex hw-gap-2 hw-items-center'>
          <GitBranchIcon className='hw-w-6 hw-h-6' />
          <Header level={3}>Create a Publish Request</Header>
        </div>
        <div className='hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500'>
          <p>
            Fill out the following fields to create a new request to publish
            your changes
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
          <Label className='sm:hw-col-span-full' label='Publish Details:'>
            <Input
              className='hw-w-full'
              type='textarea'
              value={pullRequest.body}
              onChange={changeProperty.formFunc('body', pullRequest)}
            />
          </Label>
        </div>
        {error ? <p className='hw-text-red-400 hw-text-sm'>{error}</p> : null}
        <div className='hw-flex hw-justify-between'>
          {preview ? (
            <Button onClick={onPreview}>
              Preview Changes <PreviewIcon className='hw-ml-1 hw-h-4 hw-w-4' />
            </Button>
          ) : null}
          <Button onClick={onNewPullRequest} loading={loading}>
            Send Request <SendIcon className='hw-ml-1 hw-h-5 hw-w-5' />
          </Button>
        </div>
      </HarmonyModal>
    </>
  )
}
