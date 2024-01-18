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

type Account = Pick<AccountServer, 'firstName' | 'lastName' | 'role'>

const SetupPage: NextPage = () => {
	const {mutate, ...createAccountUtils} = api.setup.createRoute.useMutation();
	const [account, setAccount] = useState<Account>({firstName: '', lastName: '', role: ''});
	const [page, setPage] = useState(0);
	const router = useRouter();

	if (createAccountUtils.isLoading) {
		return <LoadingScreen>
			Creating account. This could take a few minutes.
		</LoadingScreen>;
	}

	const onFinish = (repository: Repository): void => {
		mutate({account, repository}, {
			onSuccess: () => {
				router.push('/');
		}})
	}

	const onWelcomeContinue = (data: Account) => {
		setAccount(data);
		setPage(1);
	}
	
	return (<main className="hw-flex hw-min-h-screen hw-flex-col hw-items-center hw-justify-between hw-p-24 hw-bg-[url('/harmony.ai.svg')]">
		<div className="hw-flex hw-flex-col hw-gap-4 hw-bg-white hw-rounded-md hw-py-10 hw-px-20">
			<Header level={1}>Welcome to Harmony</Header>
			{page === 0 ? <WelcomeSetup data={account} onContinue={onWelcomeContinue}/> :
				<GitRepositorySetup onContinue={onFinish}/>}
			{createAccountUtils.isError ? <p className="hw-text-sm hw-text-red-400">There was an error, please contact support if this problem persists</p> : null}
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

interface GitImportRepositoryLineItemProps {

}
const GitImportRepositoryLineItem: React.FunctionComponent<GitImportRepositoryLineItemProps> = ({}) => {
	return (
		<div>Hello</div>
	)
}


export default SetupPage;