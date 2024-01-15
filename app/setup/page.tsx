'use client';
import { Button } from "@harmony/components/core/button";
import { Header } from "@harmony/components/core/header";
import { Input } from "@harmony/components/core/input";
import { Label } from "@harmony/components/core/label";
import { useChangeProperty } from "@harmony/hooks/change-property";
import { Account as AccountServer } from "@harmony/server/auth";
import { Repository } from "@harmony/types/branch";
import { api } from "@harmony/utils/api";
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
		return <>loading</>;
	}

	if (createAccountUtils.isError) {
		return <>{createAccountUtils.error.message}</>
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
	
	return (<main className="flex min-h-screen flex-col items-center justify-between p-24 bg-[url('/harmony.ai.svg')]">
		<div className="flex flex-col gap-4 bg-white rounded-md py-10 px-20">
			<Header level={1}>Welcome to Harmony</Header>
			{page === 0 ? <WelcomeSetup data={account} onContinue={onWelcomeContinue}/> :
				<GitRepositorySetup onContinue={onFinish}/>}
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
			<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
				<Label className="sm:col-span-3" label="First Name:">
					<Input className="w-full" value={account.firstName} onChange={onChange('firstName')}/>
				</Label>
				<Label className="sm:col-span-3" label="Last Name:">
					<Input className="w-full" value={account.lastName} onChange={onChange('lastName')}/>
				</Label>
				<Label className="sm:col-span-full" label="What best describes your role?">
					<Input className="w-full" value={account.role} onChange={onChange('role')}/>
				</Label>
			</div>
			<Button className="w-fit ml-auto" onClick={onContinueClick}>Continue</Button>
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
			<div className="flex flex-col">
				{repos.map(repo => <div key={repo.id} className="flex justify-between items-center border rounded-md p-3">
					<span className="text-sm">{repo.name}</span>
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