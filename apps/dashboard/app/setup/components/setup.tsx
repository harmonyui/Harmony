/* eslint-disable @typescript-eslint/no-useless-template-literals -- ok*/

'use client'
import { Button } from '@harmony/ui/src/components/core/button'
import { Header } from '@harmony/ui/src/components/core/header'
import { Input } from '@harmony/ui/src/components/core/input'
import { Label } from '@harmony/ui/src/components/core/label'
import type { Repository } from '@harmony/util/src/types/branch'
import CodeSnippet from '@harmony/ui/src/components/core/code-snippet'
import { LoadingScreen } from '@harmony/ui/src/components/features/loading-screen'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useChangeProperty } from '@harmony/ui/src/hooks/change-property'
import type { Account as AccountServer } from '@harmony/server/src/auth'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { WEB_URL } from '@harmony/util/src/constants'
import { CopyText } from '@harmony/ui/src/components/core/copy-text'
import { api } from '../../../utils/api'

type Account = AccountServer

export const WelcomeDisplay: React.FunctionComponent<{
  teamId: string | undefined
  account: Account | undefined
  isNewMockAccount: boolean
}> = ({ teamId, account: _account, isNewMockAccount }) => {
  //const queryAccount = api.setup.getAccount.useQuery();
  const { mutate: createAccount } = api.setup.createAccount.useMutation()
  const [account, setAccount] = useState<Account | undefined>(_account)

  // if (queryAccount.data && !account) {
  //     setAccount(queryAccount.data);
  // }

  const onWelcomeContinue = async (data: Account) => {
    return new Promise<boolean>((resolve) =>
      createAccount(
        {
          account: data,
          teamId,
          userId: isNewMockAccount
            ? `user_${data.role.toLowerCase()}`
            : undefined,
        },
        {
          onSuccess(account) {
            setAccount(account)
            resolve(true)
          },
          onError() {
            resolve(false)
          },
        },
      ),
    )
  }

  if (account) {
    return <DesignerSetup teamId={account.teamId} />
  }

  return (
    <SetupLayout>
      <WelcomeSetup
        key={0}
        data={
          account || {
            id: '',
            firstName: '',
            lastName: '',
            role: '',
            teamId: '',
            contact: 'example@gmail.com',
            seenWelcomeScreen: false,
          }
        }
        onContinue={onWelcomeContinue}
      />
    </SetupLayout>
  )
}

const SetupLayout: React.FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24 dark:bg-gray-900'>
      <div className='flex flex-col gap-4 bg-white dark:bg-gray-800 rounded-md py-10 px-20 max-w-[800px]'>
        <Header level={1}>Welcome to Harmony</Header>
        {children}
      </div>
    </main>
  )
}

interface WelcomeSetupProps {
  data: Account
  onContinue: (data: Account) => Promise<boolean>
}
const WelcomeSetup: React.FunctionComponent<WelcomeSetupProps> = ({
  data,
  onContinue,
}) => {
  const [account, setAccount] = useState(data)
  const changeProperty = useChangeProperty<Account>(setAccount)
  const [error, setError] = useState('')
  const [isOther, setIsOther] = useState(false)
  const [loading, setLoading] = useState(false)

  const onContinueClick = () => {
    if (!account.firstName || !account.lastName || !account.role) {
      setError('Please fill out all fields')
      return
    }
    setLoading(true)
    onContinue(account).then((created) => {
      setLoading(false)
      if (!created) {
        setError('There was an error in creating the account')
      }
    })
  }

  const items: DropdownItem<string>[] = [
    { id: 'developer', name: 'Developer' },
    { id: 'designer', name: 'Designer' },
    { id: 'other', name: 'Other' },
  ]

  return (
    <>
      <Header level={4}>Please enter your account details:</Header>
      <div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
        <Label className='sm:col-span-3' label='First Name:'>
          <Input
            className='w-full'
            value={account.firstName}
            onChange={changeProperty.formFunc('firstName', account)}
          />
        </Label>
        <Label className='sm:col-span-3' label='Last Name:'>
          <Input
            className='w-full'
            value={account.lastName}
            onChange={changeProperty.formFunc('lastName', account)}
          />
        </Label>
        <Label className='sm:col-span-3' label='What best describes your role'>
          <Dropdown
            className='w-full'
            items={items}
            initialValue={isOther ? 'other' : account.role}
            onChange={(item) => {
              changeProperty(account, 'role', item.id)
              setIsOther(item.id === 'other')
            }}
          >
            Select Role
          </Dropdown>
        </Label>
        {isOther ? (
          <Label className='sm:col-span-3' label='Other Role'>
            <Input
              className='w-full'
              onChange={changeProperty.formFunc('role', account)}
            />
          </Label>
        ) : null}
      </div>
      {error ? <p className='text-sm text-red-400'>{error}</p> : null}
      <Button
        className='w-fit ml-auto'
        onClick={onContinueClick}
        loading={loading}
      >
        Create Account
      </Button>
    </>
  )
}

interface DesignerSetupProps {
  teamId: string
}
export const DesignerSetup: React.FunctionComponent<DesignerSetupProps> = ({
  teamId,
}) => {
  //const [email] = useState('');
  const [error] = useState('')
  const router = useRouter()

  // const onContinue = (email: string) => {

  // }

  // const onContinueClick = () => {
  //     if (!email) {
  //         setError("Please fill out all fields");
  //         return;
  //     }
  //     const result = emailSchema.safeParse(email)
  //     if (!result.success) {
  //         setError("Invalid email address");
  //         return;
  //     }

  //     onContinue(result.data);
  // }

  const onFinish = () => {
    router.push('/')
  }

  const setupUrl = `${WEB_URL}/setup/developer/${teamId}`
  return (
    <>
      <SetupLayout>
        <Header level={4}>
          To set up Harmony, we need to connect to your Github repositories.
        </Header>
        <HarmonyToGithubThing />
        <p className='dark:text-white'>
          Invite a developer to your Harmony team to initiate the process.
        </p>
        <CopyText text={setupUrl} />
        {/*<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <Label className="sm:col-span-full" label="Developer Email:">
                        <Input className="w-full" value={email} onChange={setEmail}/>
                    </Label>
                </div> */}
        {error ? <p className='text-sm text-red-400'>{error}</p> : null}
        <Button className='w-fit ml-auto' onClick={onFinish}>
          Continue
        </Button>
      </SetupLayout>
    </>
  )
}

const HarmonyToGithubThing = () => {
  return (
    <div className='flex justify-evenly'>
      <img className='w-20 h-20 dark:hidden' src='/icon-128.png' />
      <img className='w-20 h-20 hidden dark:block' src='/icon-dark-128.png' />
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1}
        stroke='currentColor'
        className='w-24 h-20 dark:text-white'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3'
        />
      </svg>
      <svg
        className='dark:fill-white w-20 h-20'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 16 16'
        fill='black'
        aria-hidden='true'
      >
        <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'></path>
      </svg>
    </div>
  )
}

interface DeveloperSetupProps {
  repository: Repository | undefined
  teamId: string
  clientId: string
}
export const DeveloperSetup: React.FunctionComponent<DeveloperSetupProps> = ({
  repository: repositoryProp,
  teamId,
  clientId,
}) => {
  const { mutate } = api.setup.connectRepository.useMutation()
  const [repository, setRepository] = useState<Repository | undefined>()
  const [page, setPage] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading] = useState(false)
  const [error] = useState<string>()
  const [accessToken, setAccessToken] = useState<string>()

  if (searchParams.has('access_token') && !accessToken) {
    const access_token = searchParams.get('access_token') as string
    setAccessToken(access_token)
  }

  useEffect(() => {
    const access_token = sessionStorage.getItem('access_token')
    if (access_token) {
      setAccessToken(access_token)
    }
  }, [])

  useEffect(() => {
    if (accessToken) {
      setPage(1)
      if (!sessionStorage.getItem('access_token')) {
        sessionStorage.setItem('access_token', accessToken)
      }
    }
  }, [accessToken])

  if (loading) {
    return (
      <LoadingScreen>
        Importing repository. This could take a few minutes.
      </LoadingScreen>
    )
  }

  if (repositoryProp && !repository) {
    setRepository(repositoryProp)
    setPage(2)
  }

  // const readData = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
  // 	let done = false;
  // 	const decoder = new TextDecoder();

  // 	while (!done) {
  // 		const { value, done: doneReading } = await reader.read();
  // 		done = doneReading;
  // 		const data = decoder.decode(value);
  // 	}
  // }

  const onFinish = (): void => {
    router.push('/')
  }

  const onGithubContinue = (repository: Repository): void => {
    setRepository(repository)
    setPage(page + 1)
  }

  const onAdditionalContinue = () => {
    if (!repository) throw new Error('Repository should be defined')

    mutate(
      { repository },
      {
        onSuccess: () => {
          setPage(page + 1)
        },
      },
    )
  }

  const pages = [
    <StartPage key={0} clientId={clientId} />,
    accessToken ? (
      <GitRepositorySetup
        key={1}
        onContinue={onGithubContinue}
        accessToken={accessToken}
      />
    ) : null,
    repository ? (
      <AdditionalRepositoryInfo
        key={3}
        onContinue={onAdditionalContinue}
        repository={repository}
        onChange={setRepository}
      />
    ) : null,
    repository ? (
      <InstallEditor
        key={2}
        onContinue={onFinish}
        repositoryId={repository.id}
      />
    ) : null,
  ]

  return (
    <SetupLayout>
      {pages[page]}
      {error ? <p className='text-sm text-red-400'>{error}</p> : null}
    </SetupLayout>
  )
}

interface StartPageProps {
  //onContinue: () => void;
  clientId: string
}
const StartPage: React.FunctionComponent<StartPageProps> = ({ clientId }) => {
  const [href, setHref] = useState<string>()

  useEffect(() => {
    const callbackUrl = `${window.location.href}`
    const redirectUri = new URL('/api/github/callback', WEB_URL)
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
    authorizeUrl.searchParams.append('client_id', clientId)
    authorizeUrl.searchParams.append('redirect_uri', redirectUri.href)
    authorizeUrl.searchParams.append('state', callbackUrl)

    setHref(authorizeUrl.href)
  }, [])

  return (
    <>
      <Header level={4}>
        To set up Harmony, we need to connect to your Github repositories.
      </Header>
      <HarmonyToGithubThing />
      {href ? (
        <Button as='a' href={href} className='w-fit ml-auto'>
          Continue
        </Button>
      ) : (
        href
      )}
    </>
  )
}

interface GitRepositorySetupProps {
  onContinue: (repo: Repository) => void
  accessToken: string
}
const GitRepositorySetup: React.FunctionComponent<GitRepositorySetupProps> = ({
  onContinue,
  accessToken,
}) => {
  return (
    <>
      <GitImportRepository onImport={onContinue} accessToken={accessToken} />
    </>
  )
}

interface GitImportRepositoryProps {
  onImport: (repo: Repository) => void
  accessToken: string
}
const GitImportRepository: React.FunctionComponent<
  GitImportRepositoryProps
> = ({ onImport, accessToken }) => {
  const query = api.setup.getRepositories.useQuery({ accessToken })
  const [error, setError] = useState('')

  if (query.isError && !error) {
    setError('There was an error getting repositories')
  }

  const repos = query.data

  const githubInstallLink =
    'https://github.com/apps/harmony-ui-app/installations/new'

  return (
    <>
      <Header level={4}>Step 1: Import Git Repository</Header>
      <p className='text-sm dark:text-white'>
        In order to make changes to the UI, we will need to access to your
        project on Github
      </p>
      <p className='text-sm dark:text-white'>
        Please select which project you would like to intergrate with Harmony
      </p>
      <p className='text-sm dark:text-white'>
        To install the Harmony App in a new repo, visit{' '}
        <a className='text-blue-500' href={githubInstallLink} target='_blank'>
          this
        </a>{' '}
        link
      </p>
      {error ? <p className='text-red-400 text-sm'>{error}</p> : null}
      {repos ? (
        repos.length === 0 ? (
          <Button
            onClick={() =>
              window.open(githubInstallLink, 'MyWindow', 'width=600,height=300')
            }
          >
            Install
          </Button>
        ) : (
          <>
            <div className='flex flex-col gap-2'>
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className='flex justify-between items-center border dark:border-gray-700 rounded-md p-3'
                >
                  <span className='text-sm dark:text-white'>{repo.name}</span>
                  <Button onClick={() => onImport(repo)}>Import</Button>
                </div>
              ))}
            </div>
          </>
        )
      ) : null}
    </>
  )
}

interface AdditionalRepositoryInfoProps {
  repository: Repository
  onChange: (repo: Repository) => void
  onContinue: () => void
}
const AdditionalRepositoryInfo: React.FunctionComponent<
  AdditionalRepositoryInfoProps
> = ({ repository, onChange, onContinue }) => {
  const changeProperty = useChangeProperty<Repository>(onChange)
  const [error, setError] = useState('')

  const items: DropdownItem<string>[] = [
    {
      id: 'tailwind',
      name: 'Tailwind',
    },
    {
      id: 'other',
      name: 'Other',
    },
  ]
  const onContinueClick = () => {
    if (!repository.cssFramework || !repository.branch) {
      setError('Please fill out all fields')
      return
    }

    onContinue()
  }
  return (
    <>
      <Header level={4}>Additional Repository Information</Header>
      <div className='grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
        {/* TODO: Should make a dropdown that pulls the available branches */}
        <Label className='sm:col-span-full' label='Branch'>
          <p className='text-sm text-gray-400'>
            Enter the name of the branch that pull requests will be merged into
            (probably a staging branch).
          </p>
          <Input
            className='w-full'
            value={repository.branch}
            onChange={changeProperty.formFunc('branch', repository)}
          />
        </Label>
        <Label className='sm:col-span-full' label='Default Url'>
          <p className='text-sm text-gray-400 dark:text-gray-200'>
            Enter the url of your staging app url.
          </p>
          <Input
            className='w-full'
            value={repository.defaultUrl}
            onChange={changeProperty.formFunc('defaultUrl', repository)}
          />
        </Label>
        <Label className='sm:col-span-3' label='CSS Framework:'>
          <Dropdown
            className='w-full'
            items={items}
            initialValue={repository.cssFramework}
            onChange={(item) => {
              changeProperty(repository, 'cssFramework', item.id)
            }}
          >
            Select Framework
          </Dropdown>
        </Label>
        {repository.cssFramework === 'tailwind' ? (
          <Label
            className='sm:col-span-full'
            label='Tailwind Prefix (if applicable):'
          >
            <p className='text-sm text-gray-400 dark:text-gray-200'>
              Enter the{' '}
              <a
                className='text-blue-600'
                href='https://tailwindcss.com/docs/configuration#prefix'
                target='_blank'
              >
                prefix
              </a>{' '}
              that is used for the tailwind classes
            </p>
            <Input
              className='w-full'
              value={repository.tailwindPrefix}
              onChange={changeProperty.formFunc('tailwindPrefix', repository)}
            />
          </Label>
        ) : null}
      </div>
      {error ? <p className='text-sm text-red-400'>{error}</p> : null}
      <Button className='w-fit ml-auto' onClick={onContinueClick}>
        Continue
      </Button>
    </>
  )
}

interface InstallEditorProps {
  repositoryId: string
  onContinue: () => void
}
const InstallEditor: React.FunctionComponent<InstallEditorProps> = ({
  onContinue,
  repositoryId,
}) => {
  const designSuiteCode = `{process.env.NODE_ENV !== 'production' ? <HarmonySetup repositoryId="${repositoryId}"/> : null }`
  const designSuiteCodeWithFonts = `import fonts from "path/to/fonts/file";
//... other code
<HarmonySetup repositoryId="${repositoryId}" fonts={fonts}/>`
  const swcPluginCode = `/** @type {import('next').NextConfig} */
const nextConfig = {
	//...Other config properties
	experimental: {
		// Only run the plugin in development mode
		swcPlugins: process.env.NODE_ENV !== 'production' ? [
			['harmony-ai-plugin', {rootDir: __dirname}]
		] : []
	},
}
	
module.exports = nextConfig`

  const swcPluginCodeMjs = `
swcPlugins: process.env.NODE_ENV !== 'production' ? [
    ['harmony-ai-plugin', {rootDir: new URL('.', import.meta.url).pathname}]
  ] : []
`
  const fontsFile = `import { NextFont } from 'next/dist/compiled/@next/font';
import {Inter, Roboto, Open_Sans, Alegreya, Montserrat, Lato, Poppins, Mulish, Corben, Nobile} from 'next/font/google';

interface Font {
	id: string;
	name: string;
	font: NextFont
}

const inter = Inter({
    subsets: ['latin']
});
const roboto = Roboto({
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900']
});

const openSans = Open_Sans({
    subsets: ['latin']
});

const alegreya = Alegreya({
    subsets: ['latin']
});

const montserrat = Montserrat({
    subsets: ['latin']
});

const lato = Lato({
    subsets: ['latin'],
    weight: ['100', '300', '400', '700', '900']
});

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

const mulish = Mulish({
    subsets: ['latin']
});

const corben = Corben({
    subsets: ['latin'],
    weight: ['400', '700']
})

const nobile = Nobile({
    subsets: ['latin'],
    weight: ['400', '500', '700']
})

export const fonts: Font[] = [
    {
        id: inter.className,
        name: 'Inter',
        font: inter
    },
    {
        id: roboto.className,
        name: 'Roboto',
        font: roboto
    },
    {
        id: openSans.className,
        name: 'Open Sans',
        font: openSans
    },
    {
        id: alegreya.className,
        name: 'Alegreya',
        font: alegreya
    },
    {
        id: montserrat.className,
        name: 'Montserrat',
        font: montserrat
    },
    {
        id: lato.className,
        name: 'Lato',
        font: lato
    },
    {
        id: poppins.className,
        name: 'Poppins',
        font: poppins
    },
    {
        id: mulish.className,
        name: 'Mulish',
        font: mulish
    },
]`
  return (
    <>
      <Header level={4}>Step 2: Install Design Suite</Header>
      <p className='text-sm dark:text-white'>
        In the repository you selected, checkout a new branch to make these
        changes, eventually you will merge these changes back to master.
      </p>
      <p className='text-sm dark:text-white'>
        Install the harmony packages using your package manager
      </p>
      <CodeSnippet
        language='terminal'
        code='npm install harmony-ai-plugin harmony-ai-editor'
      />
      <p className='text-sm dark:text-white'>
        Then, import from <SmallCode>harmony-ai-editor</SmallCode> and add the
        following component before your closing <SmallCode>body</SmallCode> tag
      </p>
      <CodeSnippet language='javascript' code={designSuiteCode} />

      <p className='text-sm dark:text-white'>
        Noted that we marked NODE_ENV as the environment variable. You can
        change NODE_ENV to whatever make sense to your project.
      </p>

      <Header level={4}>Configure Data Tagging (NextJS Only)</Header>
      <p className='text-sm dark:text-white'>
        In order for the front-end to communicate with the code base, you need
        to use the Harmony SWC plugin. Create a next.config.js file in the root
        (if it doesn&#39;t exist) and insert the following code:
      </p>
      <CodeSnippet language='javascript' code={swcPluginCode} />

      <p className='text-sm dark:text-white'>
        Alternatively, if you are using .mjs for your Next.js config file.
        Insert the following code.
      </p>
      <CodeSnippet language='javascript' code={swcPluginCodeMjs} />

      <Header level={4}>Using Fonts (Optional)</Header>
      <p className='text-sm dark:text-white'>
        If you want to be able to pick between fonts in your editor, then you
        need to install the fonts on your own machine. To do that, add the
        following file somewhere in your code base (ex. in a utils folder). Feel
        free to add or remove any fonts you want from google fonts and add it to
        the fonts array
      </p>
      <p className='text-sm dark:text-white'>
        Note: This only works with NextJS Fonts
      </p>
      <CodeSnippet language='typescript' code={fontsFile} />
      <p className='text-sm dark:text-white'>
        Then where you added the HarmonySetup component, pass in the fonts array
        you just created.
      </p>
      <CodeSnippet language='javascript' code={designSuiteCodeWithFonts} />

      <div className='flex'>
        <Button className='ml-auto' onClick={onContinue}>
          Continue
        </Button>
      </div>
    </>
  )
}

const SmallCode: React.FunctionComponent<{ children: string }> = ({
  children,
}) => {
  return (
    <code
      style={{ background: 'rgb(29, 31, 33)' }}
      className='text-white p-0.5'
    >
      {children}
    </code>
  )
}
