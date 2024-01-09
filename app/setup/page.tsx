'use client';
import { Button } from "@harmony/components/core/button";
import { Header } from "@harmony/components/core/header";
import { Input } from "@harmony/components/core/input";
import { Label } from "@harmony/components/core/label";
import { useChangeProperty } from "@harmony/hooks/change-property";
import { Account } from "@harmony/server/auth";
import { api } from "@harmony/utils/api";
import { NextPage } from "next";
import { redirect } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";

const SetupPage: NextPage = () => {
	const {mutate, ...createAccountUtils} = api.setup.createRoute.useMutation();

	if (createAccountUtils.isLoading) {
		return <>loading</>;
	}

	if (createAccountUtils.isError) {
		return <>{createAccountUtils.error.message}</>
	}

	const onContinue = (account: Account): void => {
		mutate({account}, {
			onSuccess: () => {
				redirect('/')
		}})
	}
	
	return (<main className="flex min-h-screen flex-col items-center justify-between p-24 bg-[url('/harmony.ai.svg')]">
		<WelcomeCard data={{firstName: '', lastName: '', role: ''}} onContinue={onContinue}/>
	</main>)
}

interface WelcomeCardProps {
	data: Account,
	onContinue: (data: Account) => void;
}
const WelcomeCard: React.FunctionComponent<WelcomeCardProps> = ({data, onContinue}) => {
	const [account, setAccount] = useState(data);
	const changeProperty = useChangeProperty<Account>(setAccount);

	const onChange = <Key extends keyof Account>(key: Key) => (value: Account[Key]) => {
		changeProperty(account, key, value);
	}

	const onContinueClick = () => {
		onContinue(account);
	}

	return (
		<div className="flex flex-col gap-4 bg-white rounded-md py-10 px-20">
			<Header level={1}>Welcome to Harmony</Header>
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
		</div>
	)
}



export default SetupPage;