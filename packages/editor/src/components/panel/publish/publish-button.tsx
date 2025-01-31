import { Button } from '@harmony/ui/src/components/core/button'
import { Header } from '@harmony/ui/src/components/core/header'
import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { PreviewIcon } from '@harmony/ui/src/components/core/icons'
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
import { CopyText } from '@harmony/ui/src/components/core/copy-text'
import { WEB_URL } from '@harmony/util/src/constants'
import { useHarmonyContext } from '../../harmony-context'
import { useHarmonyStore } from '../../../hooks/state'

interface PublishState {
  show: boolean
  setShow: (show: boolean) => void
  onPublish: () => void
  error: string
  setError: (error: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  sendPullRequest: (
    request: PullRequest,
    setError?: (error: string) => void,
  ) => Promise<void>
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
  const isLocal = useHarmonyStore((state) => state.isLocal)
  const clearUpdates = useHarmonyStore((state) => state.clearComponentUpdates)

  const isPublished = useMemo(
    () => Boolean(pullRequestProps),
    [pullRequestProps],
  )

  const sendPullRequest = useCallback(
    async (
      pullRequest: PullRequest,
      _setError: (error: string) => void = setError,
    ) => {
      setLoading(true)
      const request: PublishRequest = {
        branchId,
        pullRequest,
      }
      try {
        const published = await publish(request)
        if (!published) {
          _setError('There was an error when publishing')
          return
        }
        setShow(false)

        if (published.pullRequest) {
          window.open(published.pullRequest.url, '_blank')?.focus()
        }
      } catch {
        _setError('There was an error when publishing')
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setShow, publish, branchId],
  )

  const onViewCode = useCallback(async () => {
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
      await sendPullRequest(pullRequest, setErrorProps)
    } else {
      window.open(pullRequestProps.url, '_blank')?.focus()
    }
  }, [
    currentBranch,
    isSaving,
    setErrorProps,
    pullRequestProps,
    sendPullRequest,
    setErrorProps,
  ])

  const onPublish = useCallback(() => {
    if (isDemo || isPublished || isLocal) {
      void onViewCode()
      if (isLocal) {
        clearUpdates()
      }
      return
    }

    if (isSaving) {
      setErrorProps('Please wait to finish saving before publishing')
      return
    }
    setShow(true)
  }, [
    setShow,
    setErrorProps,
    isSaving,
    onViewCode,
    isDemo,
    isPublished,
    isLocal,
  ])

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
      className='h-7'
      onClick={onPublish}
      loading={loading}
      disabled={disabled}
    >
      <Icon className='h-5 w-5' />
    </Button>
  )
}

const PublishModal: React.FunctionComponent<{ preview?: boolean }> = () => {
  const isRepositoryConnected = useHarmonyStore(
    (state) => state.isRepositoryConnected,
  )

  const publishContext = useContext(PublishContext)
  if (!publishContext)
    throw new Error('Must wrap the publish button in a PublishProvider')
  const { show, setShow, setError } = publishContext

  const onClose = () => {
    setShow(false)
    setError('')
  }

  return (
    <>
      <HarmonyModal
        show={show}
        onClose={onClose}
        maxWidthClassName='max-w-lg'
        editor
      >
        <div className='flex flex-col justify-between items-center mb-4 gap-6 text-base'>
          <Header level={3}>Publish Project</Header>
          {isRepositoryConnected ? <Connected /> : <NotConnected />}
        </div>
      </HarmonyModal>
    </>
  )
}

const NotConnected: React.FunctionComponent = () => {
  const branch = useHarmonyStore((state) => state.currentBranch)

  const text = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('branch-id', branch.id)

    return url.href
  }, [branch])

  return (
    <div className='flex flex-col gap-2 items-center'>
      <Button as='a' href={`${WEB_URL}/setup`} target='_blank'>
        Connect Github
      </Button>
      <span>or</span>
      <CopyText widthClass='w-80' text={text} />
    </div>
  )
}

const Connected: React.FunctionComponent = () => {
  const updatePublishState = useHarmonyStore(
    (state) => state.updatePublishState,
  )
  const publishState = useHarmonyStore((state) => state.publishState)
  const branch = useHarmonyStore((state) => state.currentBranch)

  const changeProperty = useChangeProperty<PullRequest>(updatePublishState)
  const publishContext = useContext(PublishContext)
  if (!publishContext)
    throw new Error('Must wrap the publish button in a PublishProvider')
  const { loading, sendPullRequest, setError, error } = publishContext

  const pullRequest: PullRequest = useMemo(
    () =>
      publishState || {
        id: '',
        title: branch.name,
        body: '',
        url: '',
      },
    [publishState],
  )

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
    <div className='w-full flex flex-col gap-4'>
      <Label label='Description'>
        <Input
          className='w-full min-h-[100px]'
          type='textarea'
          value={publishState?.body}
          onChange={changeProperty.formFunc('body', pullRequest)}
          placeholder='Description'
        />
      </Label>
      <div>
        {error ? (
          <div className='text-sm text-red-400 mb-2'>{error}</div>
        ) : null}
        <Button
          className='w-full'
          onClick={() => onNewPullRequest()}
          loading={loading}
        >
          Publish to Github
        </Button>
      </div>
    </div>
  )
}
