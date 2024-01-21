'use client';
import { Button } from "../../packages/ui/src/components/core/button";
import { Header } from "../../packages/ui/src/components/core/header";
import { Input } from "../../packages/ui/src/components/core/input";
import { Label } from "../../packages/ui/src/components/core/label";
import { LoadingScreen } from "../../packages/ui/src/components/features/loading-screen";
import { useChangeProperty } from "../../packages/ui/src/hooks/change-property";
import { Account as AccountServer } from "../../src/server/auth";
import { Repository } from "../../packages/ui/src/types/branch";
import { api } from "../../utils/api";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CodeSnippet from "@harmony/ui/src/components/core/code-snippet";
import ReactSyntaxHighlighter from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Account = Pick<AccountServer, 'firstName' | 'lastName' | 'role'>

const SetupPage: NextPage = () => {
	const {mutate} = api.setup.createAccount.useMutation();
	const [account, setAccount] = useState<Account>({firstName: '', lastName: '', role: ''});
	const [repository, setRepository] = useState<Repository>();
	const [page, setPage] = useState(2);
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>();

	if (loading) {
		return <LoadingScreen>
			Importing repository. This could take a few minutes.
		</LoadingScreen>;
	}

	const readData = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
		let done = false;
		const decoder = new TextDecoder();

		while (!done) {
			const { value, done: doneReading } = await reader.read();
			done = doneReading;
			const data = decoder.decode(value);
		}
	}
	
	const onFinish = (): void => {
		setLoading(true);
		fetch('/api/import', {
			method: 'POST',
			body: JSON.stringify({repository})
		}).then(response => {
			if (!response.ok) {
				setLoading(false);
				setError("There was an error, please contact support if this problem persists")
				return;
			}

			const reader = response.body?.getReader();
			if (!reader) {
				setLoading(false);
				setError("There was an error, please contact support if this problem persists")
				return;
			}

			readData(reader).then(() => {
				setLoading(false);
				router.push('/');
			})
		})
	}

	const onWelcomeContinue = (data: Account) => {
		setAccount(data);
		setPage(page+1);
	}

	const onGithubContinue = (repository: Repository): void => {
		setRepository(repository);
		mutate({account, repository}, {
			onSuccess: () => {
				setPage(page+1);
		}})
	}

	const pages = [
		<WelcomeSetup key={0} data={account} onContinue={onWelcomeContinue}/>, 
		<GitRepositorySetup key={1} onContinue={onGithubContinue}/>,
		true ? <InstallEditor key={2} onContinue={onFinish} repositoryId={'asdf'}/> : null
		,
	]
	
	return (<main className="hw-flex hw-min-h-screen hw-flex-col hw-items-center hw-justify-between hw-p-24 hw-bg-[url('/harmony.ai.svg')]">
		<div className="hw-flex hw-flex-col hw-gap-4 hw-bg-white hw-rounded-md hw-py-10 hw-px-20 hw-max-w-[800px]">
			<Header level={1}>Welcome to Harmony</Header>
			{pages[page]}
			{error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
		</div>
	</main>)
}

interface WelcomeSetupProps {
	data: Pick<Account, 'firstName' | 'lastName' | 'role'>,
	onContinue: (data: Account) => void;
}
const WelcomeSetup: React.FunctionComponent<WelcomeSetupProps> = ({data, onContinue}) => {
	const [account, setAccount] = useState(data);
	const changeProperty = useChangeProperty<Account>(setAccount);

	const onChange = <Key extends keyof Account>(key: Key) => (value: Account[Key]) => {
		changeProperty(account, key, value);
	}

	const onContinueClick = () => {
		onContinue(account);
	}

	return (
		<>
			<Header level={4}>Please enter your account details:</Header>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-8 sm:hw-grid-cols-6">
				<Label className="sm:hw-col-span-3" label="First Name:">
					<Input className="hw-w-full" value={account.firstName} onChange={onChange('firstName')}/>
				</Label>
				<Label className="sm:hw-col-span-3" label="Last Name:">
					<Input className="hw-w-full" value={account.lastName} onChange={onChange('lastName')}/>
				</Label>
				<Label className="sm:hw-col-span-full" label="What best describes your role?">
					<Input className="hw-w-full" value={account.role} onChange={onChange('role')}/>
				</Label>
			</div>
			<Button className="hw-w-fit hw-ml-auto" onClick={onContinueClick}>Continue</Button>
		</>
	)
}

interface GitRepositorySetupProps {
	onContinue: (repo: Repository) => void;
}
const GitRepositorySetup: React.FunctionComponent<GitRepositorySetupProps> = ({onContinue}) => {
	return (
		<>
			<GitImportRepository onImport={onContinue}/>
		</>
	)
}

interface GitImportRepositoryProps {
	onImport: (repo: Repository) => void;
}
const GitImportRepository: React.FunctionComponent<GitImportRepositoryProps> = ({onImport}) => {
	const query = api.setup.getRepositories.useQuery();

	const repos = query.data;

	console.log(repos);

	return (<>
		<Header level={4}>Import Git Repository</Header>
		{repos ? repos.length === 0 ? <Button onClick={() => window.open("https://github.com/apps/harmony-ai-app/installations/new", 'MyWindow', 'width=600,height=300')}>Install</Button> : <>
			<div className="hw-flex hw-flex-col">
				{repos.map(repo => <div key={repo.id} className="hw-flex hw-justify-between hw-items-center hw-border hw-rounded-md hw-p-3">
					<span className="hw-text-sm">{repo.name}</span>
					<Button onClick={() => onImport(repo)}>Import</Button>
				</div>)}
			</div>
		</> : null}
	</>)
}

interface InstallEditorProps {
	repositoryId: string;
	onContinue: () => void;
}
const InstallEditor: React.FunctionComponent<InstallEditorProps> = ({onContinue, repositoryId}) => {
	const designSuiteCode = `<script id="harmony-id">
    harmony={load:function(e){const r=document.createElement("script");r.src="https://unpkg.com/harmony-ai-editor";r.addEventListener('load',function(){window.HarmonyProvider({repositoryId:e});});document.body.appendChild(r);}}
    harmony.load('${repositoryId}');
</script>`
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
	return (<>
		<Header level={4}>Install Design Suite</Header>
		<p className="hw-text-sm">Copy and paste the snippet below before your website’s closing <span className="hw-p-0.5" style={{background: "rgb(29, 31, 33)"}}><span style={{color: "rgb(197, 200, 198)"}}>&lt;/</span><span style={{color: "rgb(150, 203, 254)"}}>body</span><span style={{color: "rgb(197, 200, 198)"}}>&gt;</span></span> tag. Once installed, you can begin editing on your site.</p>
		<CodeSnippet language="html" code={designSuiteCode}/>

		<Header level={4}>Configure Data Tagging (NextJS Only)</Header>
		<p className="hw-text-sm">In order for the front-end to communicate with the code base, you need to install the harmony-ai-plugin npm package by running <code style={{background: "rgb(29, 31, 33)"}} className="hw-text-white hw-p-0.5">npm|yarn|pnpm install harmony-ai-plugin</code>.</p>
		<p className="hw-text-sm">Next, create a next.config.js file in the root (if it doesn't exist) and insert the following code:</p>
		<CodeSnippet language="javascript" code={swcPluginCode}/>
		
		<div className="hw-flex">
			<Button className="hw-ml-auto" onClick={onContinue}>Continue</Button>
		</div>
	</>)
}


export default SetupPage;