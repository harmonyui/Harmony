"use client";
import { Button } from "@harmony/ui/src/components/core/button";
import { Header } from "@harmony/ui/src/components/core/header";
import { Input } from "@harmony/ui/src/components/core/input";
import { Label } from "@harmony/ui/src/components/core/label";
import { Repository } from "@harmony/ui/src/types/branch";
import CodeSnippet from "@harmony/ui/src/components/core/code-snippet";
import { LoadingScreen } from "@harmony/ui/src/components/features/loading-screen";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { api } from "../../../../../utils/api";
import { useChangeProperty } from "../../hooks/change-property";
import { emailSchema } from "../../types/utils";
import { Account as AccountServer } from "../../../../../src/server/auth";
import { Dropdown, DropdownItem } from "../core/dropdown";
import {GITHUB_APP_CLIENT_ID, WEB_URL} from '@harmony/util/src/constants';

type Account = AccountServer

export const WelcomeDisplay: React.FunctionComponent<{teamId: string | undefined}> = ({teamId}) => {
    const queryAccount = api.setup.getAccount.useQuery();
	const {mutate: createAccount} = api.setup.createAccount.useMutation();
	const [account, setAccount] = useState<Account | undefined>();
	
    if (queryAccount.data && !account) {
        setAccount(queryAccount.data);
    }

	const onWelcomeContinue = (data: Account) => {
		createAccount({account: data, teamId}, {
			onSuccess(account) {
				setAccount(account);
			}
		})
	}

    if (account) {
        return <DesignerSetup teamId={account.teamId}/>
    }

	return (<SetupLayout>
			<WelcomeSetup key={0} data={account || {id: '', firstName: '', lastName: '', role: '', teamId: ''}} onContinue={onWelcomeContinue}/>
		</SetupLayout>)
}

const SetupLayout: React.FunctionComponent<{children: React.ReactNode}> = ({children}) => {
    return <main className="hw-flex hw-min-h-screen hw-flex-col hw-items-center hw-justify-between hw-p-24 hw-bg-[url('/harmony.ai.svg')]">
		<div className="hw-flex hw-flex-col hw-gap-4 hw-bg-white hw-rounded-md hw-py-10 hw-px-20 hw-max-w-[800px]">
			<Header level={1}>Welcome to Harmony</Header>
			{children}
		</div>
	</main>
}

interface WelcomeSetupProps {
	data: Account,
	onContinue: (data: Account) => void;
}
const WelcomeSetup: React.FunctionComponent<WelcomeSetupProps> = ({data, onContinue}) => {
	const [account, setAccount] = useState(data);
	const changeProperty = useChangeProperty<Account>(setAccount);

	const onContinueClick = () => {
		onContinue(account);
	}

	return (
		<>
			<Header level={4}>Please enter your account details:</Header>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-8 sm:hw-grid-cols-6">
				<Label className="sm:hw-col-span-3" label="First Name:">
					<Input className="hw-w-full" value={account.firstName} onChange={changeProperty.formFunc('firstName', account)}/>
				</Label>
				<Label className="sm:hw-col-span-3" label="Last Name:">
					<Input className="hw-w-full" value={account.lastName} onChange={changeProperty.formFunc('lastName', account)}/>
				</Label>
				<Label className="sm:hw-col-span-3" label="What best describes your role?">
					<Input className="hw-w-full" value={account.role} onChange={changeProperty.formFunc('role', account)} />
				</Label>
			</div>
			<Button className="hw-w-fit hw-ml-auto" onClick={onContinueClick}>Create Account</Button>
		</>
	)
}

interface DesignerSetupProps {
	teamId: string
}
const DesignerSetup: React.FunctionComponent<DesignerSetupProps> = ({teamId}) => {
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
    const router = useRouter();

    const onContinue = (email: string) => {
        
    }

	const onContinueClick = () => {
		if (!email) {
			setError("Please fill out all fields");
			return;
		}
		const result = emailSchema.safeParse(email)
		if (!result.success) {
			setError("Invalid email address");
			return;
		}

		onContinue(result.data);
	}

    const onFinish = () => {
        router.push('/');
    }

    const url = `${WEB_URL}/setup/developer/${teamId}`
	return (
		<>
            <SetupLayout>
                <Header level={4}>To set up Harmony, we need to connect to your Github repositories.</Header>
                <HarmonyToGithubThing/>
                <p>Invite a developer to your Harmony team to initiate the process.</p>
                <CopyText text={url}/>
                {/*<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-8 sm:hw-grid-cols-6">
                    <Label className="sm:hw-col-span-full" label="Developer Email:">
                        <Input className="hw-w-full" value={email} onChange={setEmail}/>
                    </Label>
                </div> */}
                {error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
                <Button className="hw-w-fit hw-ml-auto" onClick={onFinish}>Continue</Button>
            </SetupLayout>
		</>
	)
}

const CopyText: React.FunctionComponent<{text: string}> = ({text}) => {
    const [copied, setCopied] = useState(false);
    const [copiedText, setCopiedText] = useState('');
    useEffect(() => {
        if (text !== copiedText) {
            setCopied(false);
        }
    }, [text, copiedText]);
    return (
        <div>
            <div
                className={`hw-rounded hw-h-6 hw-leading-6 hw-cursor-pointer hw-px-1 hw-inline-block hw-transition ${
                    copied
                        ? 'hw-text-white hw-bg-primary'
                        : 'hw-text-teal-900 hw-bg-gray-200 hover:hw-bg-gray-300'
                }`}
                onClick={() => {
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setCopiedText(text);
                }}
            >
                <div className="hw-flex hw-items-center">
                    <svg
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                        className="hw-w-5 hw-h-5 hw-mr-1"
                    >
                        <path
                            d={`${
                                copied
                                    ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                                    : 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
                            }`}
                        ></path>
                    </svg>
                    {text}
                </div>
            </div>
        </div>
    );
}

const HarmonyToGithubThing = () => {
    return (
        <div className="hw-flex hw-justify-evenly">
            <svg className="hw-w-20 hw-h-20" viewBox="0 0 177 179" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_368_506)">
                <mask id="mask0_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="61" width="175" height="118">
                <path d="M2.15717 178.073L176.611 178.073L176.611 61.2086L2.15718 61.2086L2.15717 178.073Z" fill="white"/>
                </mask>
                <g mask="url(#mask0_368_506)">
                <mask id="mask1_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="3" y="1" width="173" height="198">
                <path d="M175.59 198.34L3.26874 198.34L3.26876 1.06975L175.59 1.06976L175.59 198.34Z" fill="white"/>
                </mask>
                <g mask="url(#mask1_368_506)">
                <path d="M111.231 197.839L133.159 197.839L133.159 187.555L111.231 187.555L111.231 197.839ZM103.872 174.552L175.283 174.552L175.283 164.266L103.872 164.266L103.872 174.552ZM6.52411 151.265L40.9676 151.265L40.9676 140.975L6.52411 140.975L6.52411 151.265ZM129.609 127.971L175.283 127.971L175.283 117.688L129.609 117.688L129.609 127.971ZM76.2573 104.682L175.283 104.682L175.283 94.4045L76.2573 94.4045L76.2573 104.682ZM12.4104 94.4045L-86.6097 94.4045L-86.6097 104.682L12.4104 104.682L12.4104 94.4045ZM-60.5896 34.8204L-60.5896 24.5366L-125.451 24.5366L-125.451 34.8204L-60.5896 34.8204ZM101.804 24.5366L-51.9701 24.5366L-51.9701 34.8204L101.804 34.8205L101.804 24.5366ZM175.283 1.24702L111.826 1.24702L111.826 11.5309L175.283 11.5309L175.283 1.24702Z" fill="#AFE1E3" fill-opacity="0.5"/>
                </g>
                <mask id="mask2_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="3" y="-23" width="173" height="198">
                <path d="M175.59 174.753L3.26874 174.753L3.26876 -22.5168L175.59 -22.5168L175.59 174.753Z" fill="white"/>
                </mask>
                <g mask="url(#mask2_368_506)">
                <path d="M-23.4324 174.552L47.9755 174.552L47.9755 164.266L-23.4324 164.266L-23.4324 174.552ZM49.587 151.265L175.283 151.265L175.283 140.975L49.587 140.975L49.587 151.265ZM69.0455 71.1133L-17.342 71.1133L-17.342 81.3947L69.0455 81.3947L69.0455 71.1133ZM110.427 34.8204L175.283 34.8204L175.283 24.5366L110.427 24.5366L110.427 34.8204ZM-10.9878 11.5308L-10.9878 1.24696L-29.5182 1.24696L-29.5182 11.5308L-10.9878 11.5308ZM135.499 -22.0391L-11.7299 -22.0391L-11.7299 -11.7565L135.499 -11.7564L135.499 -22.0391Z" fill="#65D0E7" fill-opacity="0.5"/>
                </g>
                <mask id="mask3_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="3" y="-73" width="219" height="303">
                <path d="M221.012 229.967L3.27026 229.967L3.27029 -72.9066L221.012 -72.9066L221.012 229.967Z" fill="white"/>
                </mask>
                <g mask="url(#mask3_368_506)">
                <path d="M221.012 210.84L212.392 210.84L212.392 221.126L221.012 221.126L221.012 210.84ZM221.012 187.555L212.392 187.555L212.392 197.839L221.012 197.839L221.012 187.555ZM56.5997 174.551L95.2528 174.551L95.2528 164.266L56.5997 164.266L56.5997 174.551ZM221.012 164.266L212.392 164.266L212.392 174.551L221.012 174.551L221.012 164.266ZM221.012 140.974L212.392 140.974L212.392 151.264L221.012 151.264L221.012 140.974ZM26.1821 127.971L120.994 127.971L120.994 117.687L26.1821 117.687L26.1821 127.971ZM221.012 117.687L212.392 117.687L212.392 127.971L221.012 127.971L221.012 117.687ZM221.012 94.4042L212.392 94.4042L212.392 104.681L221.012 104.681L221.012 94.4042ZM77.6642 81.3943L175.284 81.3943L175.284 71.1129L77.6642 71.1129L77.6642 81.3943ZM221.012 71.1129L212.392 71.1129L212.392 81.3943L221.012 81.3943L221.012 71.1129ZM221.012 47.8305L212.392 47.8305L212.392 58.1074L221.012 58.1074L221.012 47.8305ZM221.012 24.5363L212.392 24.5363L212.392 34.8201L221.012 34.8201L221.012 24.5363ZM103.209 11.5306L103.209 1.24672L-2.37049 1.24672L-2.37049 11.5305L103.209 11.5306ZM221.012 1.24673L212.392 1.24673L212.392 11.5306L221.012 11.5306L221.012 1.24673ZM175.284 -22.0406L144.123 -22.0406L144.123 -11.7567L175.284 -11.7567L175.284 -22.0406ZM221.012 -22.0406L212.392 -22.0406L212.392 -11.7567L221.012 -11.7567L221.012 -22.0406ZM221.012 -45.3267L212.392 -45.3267L212.392 -35.0439L221.012 -35.0439L221.012 -45.3267ZM197.47 -72.6783L193.257 -72.6783L193.257 229.868L197.47 229.868L197.47 -72.6783Z" fill="#143C3C" fill-opacity="0.5"/>
                </g>
                <mask id="mask4_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="3" y="-74" width="184" height="301">
                <path d="M186.041 226.215L3.38268 226.215L3.3827 -73.5134L186.041 -73.5133L186.041 226.215Z" fill="white"/>
                </mask>
                <g mask="url(#mask4_368_506)">
                <path d="M141.893 197.84L185.747 197.84L185.747 187.556L141.893 187.556L141.893 197.84ZM-1.98014 151.265L-1.98014 140.976L-55.6101 140.976L-55.6101 151.265L-1.98014 151.265ZM67.7566 94.4054L21.1439 94.4054L21.1439 104.683L67.7566 104.683L67.7566 94.4054ZM185.747 47.8305L137.681 47.8305L137.681 58.1086L185.747 58.1086L185.747 47.8305ZM154.994 -35.0428L185.747 -35.0428L185.747 -45.3255L154.994 -45.3255L154.994 -35.0428ZM158.463 206.121C158.101 206.121 157.743 206.281 157.471 206.607L144.573 221.99C144.027 222.641 144.027 223.707 144.573 224.356C145.121 225.013 146.011 225.013 146.562 224.356L159.455 208.978C160.003 208.322 160.003 207.263 159.455 206.607C159.179 206.281 158.821 206.121 158.463 206.121ZM169.174 205.694C168.901 205.363 168.542 205.2 168.18 205.2C167.825 205.2 167.464 205.363 167.188 205.694C166.637 206.345 166.637 207.405 167.186 208.06L173.411 215.484L167.188 222.907C166.642 223.564 166.642 224.622 167.188 225.275C167.736 225.93 168.626 225.93 169.174 225.275L176.394 216.669C176.94 216.016 176.94 214.958 176.394 214.301L169.174 205.694ZM134.472 225.275C135.02 225.93 135.91 225.93 136.456 225.275C137.002 224.622 137.002 223.558 136.456 222.903L136.456 222.913L130.232 215.49L136.456 208.06C137.002 207.409 137.002 206.345 136.456 205.688C136.18 205.359 135.82 205.2 135.464 205.2C135.104 205.2 134.744 205.359 134.472 205.688L127.253 214.301C126.986 214.617 126.842 215.036 126.842 215.484C126.842 215.936 126.986 216.355 127.253 216.673L134.472 225.275ZM134.467 -53.4381C135.02 -52.7789 135.91 -52.7789 136.456 -53.4381C137.002 -54.0868 137.002 -55.1534 136.456 -55.8044L130.232 -63.2278L136.456 -70.6501C137.007 -71.3023 137.007 -72.3655 136.456 -73.0211C136.18 -73.3478 135.826 -73.5129 135.464 -73.5129C135.104 -73.5129 134.744 -73.3478 134.467 -73.0211L127.253 -64.411C126.986 -64.0947 126.842 -63.6711 126.842 -63.2278C126.842 -62.7811 126.986 -62.3517 127.253 -62.0424L134.467 -53.4381ZM167.186 -53.4381C167.737 -52.7801 168.626 -52.7801 169.174 -53.4381L169.174 -53.4323L176.394 -62.0424C176.94 -62.6957 176.94 -63.7577 176.394 -64.411L169.174 -73.0211C168.901 -73.3455 168.54 -73.5071 168.18 -73.5071C167.82 -73.5071 167.464 -73.3478 167.186 -73.0234C166.637 -72.3654 166.637 -71.3023 167.186 -70.6501L173.415 -63.2278L167.186 -55.8044C166.637 -55.151 166.637 -54.0868 167.186 -53.4381ZM146.562 -54.3534L159.455 -69.7336C160.003 -70.3846 160.003 -71.4489 159.455 -72.1034C159.179 -72.4301 158.821 -72.594 158.463 -72.594C158.101 -72.594 157.743 -72.4301 157.468 -72.1034L144.573 -56.7209C144.027 -56.0641 144.027 -55.0091 144.573 -54.3534C145.119 -53.6978 146.013 -53.6978 146.562 -54.3534Z" fill="#4D9DB8" fill-opacity="0.5"/>
                </g>
                <mask id="mask5_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="3" y="112" width="22" height="19">
                <path d="M3.35284 130.93L24.2506 130.93L24.2506 112.838L3.35284 112.838L3.35284 130.93Z" fill="white"/>
                </mask>
                <g mask="url(#mask5_368_506)">
                <mask id="mask6_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="-127" y="-23" width="150" height="199">
                <path d="M22.2194 175.021L-126.169 175.02L-126.169 -22.2497L22.2194 -22.2497L22.2194 175.021Z" fill="white"/>
                </mask>
                <g mask="url(#mask6_368_506)">
                <path d="M-33.201 174.52L-14.3184 174.52L-14.3184 164.236L-33.201 164.236L-33.201 174.52ZM-39.538 151.232L21.9545 151.232L21.9545 140.947L-39.538 140.947L-39.538 151.232ZM-123.365 127.945L-93.7059 127.945L-93.7059 117.655L-123.365 117.655L-123.365 127.945ZM-17.3751 104.652L21.9545 104.652L21.9545 94.3682L-17.3751 94.3682L-17.3751 104.652ZM-63.3181 81.3625L21.9545 81.3625L21.9545 71.0852L-63.3181 71.0852L-63.3181 81.3625ZM-118.297 71.0852L-203.565 71.0852L-203.565 81.3625L-118.297 81.3625L-118.297 71.0852ZM-181.158 11.501L-181.158 1.21716L-237.012 1.21716L-237.012 11.501L-181.158 11.501ZM-41.3192 1.21717L-173.736 1.21716L-173.736 11.501L-41.3192 11.501L-41.3192 1.21717ZM21.9545 -22.0724L-32.6894 -22.0724L-32.6894 -11.7885L21.9545 -11.7885L21.9545 -22.0724Z" fill="#AFE1E3" fill-opacity="0.5"/>
                </g>
                <mask id="mask7_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="-127" y="-46" width="150" height="198">
                <path d="M22.2194 151.435L-126.169 151.435L-126.169 -45.8353L22.2194 -45.8353L22.2194 151.435Z" fill="white"/>
                </mask>
                <g mask="url(#mask7_368_506)">
                <path d="M-149.162 151.233L-87.6716 151.233L-87.6716 140.948L-149.162 140.948L-149.162 151.233ZM-86.2838 127.946L21.9545 127.946L21.9545 117.656L-86.2838 117.656L-86.2838 127.946ZM-69.5277 47.7949L-143.917 47.7949L-143.917 58.0764L-69.5277 58.0765L-69.5277 47.7949ZM-33.8937 11.5019L21.9545 11.5019L21.9545 1.21808L-33.8937 1.21807L-33.8937 11.5019ZM-138.444 -11.7877L-138.444 -22.0704L-154.402 -22.0704L-154.402 -11.7877L-138.444 -11.7877ZM-12.3032 -45.3576L-139.085 -45.3576L-139.085 -35.0749L-12.3032 -35.0749L-12.3032 -45.3576Z" fill="#65D0E7" fill-opacity="0.5"/>
                </g>
                <mask id="mask8_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="-127" y="-97" width="189" height="304">
                <path d="M61.3309 206.648L-126.169 206.648L-126.169 -96.225L61.331 -96.225L61.3309 206.648Z" fill="white"/>
                </mask>
                <g mask="url(#mask8_368_506)">
                <path d="M61.3309 187.522L53.9089 187.522L53.9089 197.807L61.3309 197.807L61.3309 187.522ZM61.3309 164.237L53.9089 164.237L53.9089 174.52L61.3309 174.52L61.3309 164.237ZM-80.2463 151.233L-46.9612 151.233L-46.9612 140.947L-80.2463 140.947L-80.2463 151.233ZM61.3309 140.947L53.9089 140.947L53.9089 151.233L61.3309 151.233L61.3309 140.947ZM61.3309 117.656L53.9089 117.656L53.9089 127.946L61.3309 127.946L61.3309 117.656ZM-106.44 104.652L-24.7949 104.652L-24.7949 94.3688L-106.44 94.3688L-106.44 104.652ZM61.3309 94.3689L53.9089 94.3689L53.9089 104.652L61.3309 104.652L61.3309 94.3689ZM61.3309 71.0858L53.9089 71.0858L53.9089 81.3631L61.3309 81.3631L61.3309 71.0858ZM-62.107 58.0762L21.9544 58.0762L21.9544 47.7946L-62.107 47.7946L-62.107 58.0762ZM61.3309 47.7946L53.9089 47.7946L53.9089 58.0762L61.3309 58.0762L61.3309 47.7946ZM61.3309 24.512L53.9089 24.512L53.9089 34.7889L61.3309 34.7889L61.3309 24.512ZM61.331 1.21782L53.9089 1.21782L53.9089 11.5016L61.3309 11.5016L61.331 1.21782ZM-40.1104 -11.7879L-40.1104 -22.0718L-131.026 -22.0718L-131.026 -11.7879L-40.1104 -11.7879ZM61.331 -22.0718L53.9089 -22.0718L53.9089 -11.7879L61.331 -11.7879L61.331 -22.0718ZM21.9544 -45.3579L-4.87895 -45.3579L-4.87895 -35.0752L21.9544 -35.0752L21.9544 -45.3579ZM61.331 -45.3579L53.9089 -45.3579L53.9089 -35.0752L61.331 -35.0752L61.331 -45.3579ZM61.331 -68.6451L53.9089 -68.6451L53.9089 -58.3625L61.331 -58.3625L61.331 -68.6451ZM41.0594 -95.9968L37.4316 -95.9968L37.4316 206.55L41.0594 206.55L41.0594 -95.9968Z" fill="#143C3C" fill-opacity="0.5"/>
                </g>
                </g>
                </g>
                <mask id="mask9_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="-3" y="0" width="179" height="63">
                <path d="M-2.41534 62.6416L175.35 62.6416L175.35 0.308277L-2.41534 0.308262L-2.41534 62.6416Z" fill="white"/>
                </mask>
                <g mask="url(#mask9_368_506)">
                <mask id="mask10_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="27" width="173" height="198">
                <path d="M174.666 224.271L2.81453 224.271L2.81455 27.3893L174.666 27.3894L174.666 224.271Z" fill="white"/>
                </mask>
                <g mask="url(#mask10_368_506)">
                <path d="M110.483 223.772L132.351 223.772L132.351 213.509L110.483 213.509L110.483 223.772ZM103.143 200.531L174.36 200.531L174.36 190.266L103.143 190.266L103.143 200.531ZM6.06185 177.29L40.4113 177.29L40.4113 167.02L6.06185 167.02L6.06185 177.29ZM128.811 154.042L174.36 154.042L174.36 143.779L128.811 143.779L128.811 154.042ZM75.6044 130.799L174.36 130.799L174.36 120.542L75.6044 120.542L75.6044 130.799ZM11.932 120.542L-86.8185 120.542L-86.8185 130.799L11.932 130.799L11.932 120.542ZM-60.8695 61.0739L-60.8695 50.8108L-125.554 50.8108L-125.554 61.0739L-60.8695 61.0739ZM101.081 50.8108L-52.273 50.8108L-52.273 61.0739L101.081 61.0739L101.081 50.8108ZM174.36 27.5675L111.076 27.5675L111.076 37.8305L174.36 37.8305L174.36 27.5675Z" fill="#AFE1E3" fill-opacity="0.5"/>
                </g>
                <mask id="mask11_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="3" width="173" height="198">
                <path d="M174.666 200.731L2.81453 200.731L2.81455 3.84966L174.666 3.84967L174.666 200.731Z" fill="white"/>
                </mask>
                <g mask="url(#mask11_368_506)">
                <path d="M-23.8133 200.531L47.3997 200.531L47.3997 190.266L-23.8133 190.266L-23.8133 200.531ZM49.0066 177.29L174.36 177.29L174.36 167.02L49.0066 167.02L49.0066 177.29ZM68.4123 97.2963L-17.7401 97.2963L-17.7401 107.558L68.4123 107.558L68.4123 97.2963ZM109.681 61.0745L174.36 61.0745L174.36 50.8115L109.681 50.8115L109.681 61.0745ZM-11.4019 37.8311L-11.4019 27.568L-29.883 27.568L-29.883 37.8311L-11.4019 37.8311ZM134.685 4.32695L-12.1428 4.32693L-12.1428 14.59L134.685 14.59L134.685 4.32695Z" fill="#65D0E7" fill-opacity="0.5"/>
                </g>
                <mask id="mask12_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="-47" width="218" height="303">
                <path d="M219.961 255.837L2.81401 255.837L2.81404 -46.4407L219.961 -46.4407L219.961 255.837Z" fill="white"/>
                </mask>
                <g mask="url(#mask12_368_506)">
                <path d="M219.961 236.748L211.365 236.748L211.365 247.013L219.961 247.013L219.961 236.748ZM219.961 213.508L211.365 213.508L211.365 223.772L219.961 223.772L219.961 213.508ZM55.9978 200.53L94.5455 200.53L94.5455 190.265L55.9978 190.265L55.9978 200.53ZM219.961 190.265L211.365 190.265L211.365 200.53L219.961 200.53L219.961 190.265ZM219.961 167.019L211.365 167.019L211.365 177.289L219.961 177.289L219.961 167.019ZM25.6628 154.041L120.217 154.041L120.217 143.778L25.6628 143.778L25.6628 154.041ZM219.961 143.778L211.365 143.778L211.365 154.041L219.961 154.041L219.961 143.778ZM219.961 120.541L211.365 120.541L211.365 130.798L219.961 130.798L219.961 120.541ZM77.0048 107.556L174.358 107.556L174.358 97.2953L77.0048 97.2953L77.0048 107.556ZM219.961 97.2953L211.365 97.2953L211.365 107.557L219.961 107.557L219.961 97.2953ZM219.961 74.0581L211.365 74.0581L211.365 84.3152L219.961 84.3152L219.961 74.0581ZM219.961 50.8105L211.365 50.8105L211.365 61.0736L219.961 61.0736L219.961 50.8105ZM102.48 37.8302L102.48 27.5671L-2.81187 27.5671L-2.81187 37.8302L102.48 37.8302ZM219.961 27.5672L211.365 27.5672L211.365 37.8302L219.961 37.8302L219.961 27.5672ZM174.358 4.32605L143.283 4.32604L143.283 14.5891L174.358 14.5891L174.358 4.32605ZM219.961 4.32605L211.365 4.32605L211.365 14.5891L219.961 14.5891L219.961 4.32605ZM219.961 -18.9162L211.365 -18.9162L211.365 -8.65198L219.961 -8.65198L219.961 -18.9162ZM196.484 -46.2136L192.282 -46.2136L192.282 255.738L196.484 255.738L196.484 -46.2136Z" fill="#143C3C" fill-opacity="0.5"/>
                </g>
                <mask id="mask13_368_506" style={{maskType:'luminance'}} maskUnits="userSpaceOnUse" x="2" y="-48" width="183" height="301">
                <path d="M184.973 252.092L2.814 252.092L2.81402 -47.0467L184.973 -47.0467L184.973 252.092Z" fill="white"/>
                </mask>
                <g mask="url(#mask13_368_506)">
                <path d="M140.946 223.772L184.681 223.772L184.681 213.508L140.946 213.508L140.946 223.772ZM-2.53399 177.289L-2.53399 167.019L-56.0171 167.019L-56.0171 177.289L-2.53399 177.289ZM67.0122 120.541L20.527 120.541L20.527 130.798L67.0122 130.798L67.0122 120.541ZM184.681 74.0579L136.746 74.0579L136.746 84.315L184.681 84.315L184.681 74.0579ZM154.012 -8.65216L184.681 -8.65216L184.681 -18.9164L154.012 -18.9164L154.012 -8.65216ZM157.471 232.037C157.111 232.037 156.753 232.196 156.482 232.522L143.619 247.874C143.075 248.524 143.075 249.588 143.619 250.236C144.166 250.892 145.053 250.892 145.603 250.236L158.46 234.888C159.007 234.233 159.007 233.176 158.46 232.522C158.186 232.196 157.828 232.037 157.471 232.037ZM168.153 231.611C167.881 231.28 167.522 231.117 167.162 231.117C166.808 231.117 166.447 231.28 166.172 231.611C165.623 232.261 165.623 233.318 166.171 233.972L172.379 241.381L166.172 248.789C165.628 249.446 165.628 250.501 166.172 251.153C166.719 251.807 167.606 251.807 168.153 251.153L175.353 242.564C175.898 241.912 175.898 240.856 175.353 240.2L168.153 231.611ZM133.546 251.153C134.092 251.807 134.98 251.807 135.524 251.153C136.068 250.501 136.068 249.439 135.524 248.785L135.524 248.796L129.318 241.387L135.524 233.972C136.068 233.322 136.068 232.261 135.524 231.604C135.249 231.276 134.89 231.117 134.535 231.117C134.176 231.117 133.817 231.276 133.546 231.604L126.347 240.2C126.081 240.516 125.937 240.934 125.937 241.381C125.937 241.832 126.081 242.25 126.347 242.568L133.546 251.153ZM133.54 -27.0116C134.092 -26.3537 134.98 -26.3537 135.524 -27.0116C136.068 -27.6604 136.068 -28.7235 135.524 -29.3734L129.318 -36.7818L135.524 -44.1902C136.074 -44.8401 136.074 -45.9021 135.524 -46.5566C135.249 -46.8821 134.895 -47.0472 134.535 -47.0472C134.176 -47.0472 133.817 -46.8821 133.54 -46.5566L126.347 -37.9627C126.081 -37.6476 125.937 -37.2251 125.937 -36.7818C125.937 -36.3374 126.081 -35.908 126.347 -35.5998L133.54 -27.0116ZM166.171 -27.0116C166.72 -26.356 167.606 -26.356 168.153 -27.0116L168.153 -27.0059L175.353 -35.5998C175.898 -36.2508 175.898 -37.3105 175.353 -37.9627L168.153 -46.5566C167.881 -46.8798 167.521 -47.0414 167.162 -47.0414C166.803 -47.0414 166.447 -46.8821 166.171 -46.5589C165.623 -45.9021 165.623 -44.8401 166.171 -44.1902L172.382 -36.7818L166.171 -29.3734C165.623 -28.7212 165.623 -27.6604 166.171 -27.0116ZM145.603 -27.9247L158.46 -43.2748C159.007 -43.9247 159.007 -44.9867 158.46 -45.6412C158.186 -45.9667 157.828 -46.1295 157.471 -46.1295C157.111 -46.1295 156.753 -45.9667 156.479 -45.6412L143.619 -30.2887C143.075 -29.6331 143.075 -28.5792 143.619 -27.9247C144.164 -27.2713 145.055 -27.2713 145.603 -27.9247Z" fill="#4D9DB8" fill-opacity="0.5"/>
                </g>
                </g>
                <path d="M93.351 88.6371C98.4714 88.6371 102.331 88.535 104.929 88.3335C107.523 88.1307 109.223 87.7885 110.024 87.3083C110.389 87.0495 110.646 86.5518 110.794 85.8153C110.939 85.0787 111.011 83.7127 111.011 81.7195L111.011 75.857C111.011 67.2237 110.865 61.7805 110.572 59.5285C110.279 57.2791 109.75 55.9155 108.983 55.4377C108.399 55.1055 107.484 54.7174 106.241 54.2732C103.939 53.5366 102.788 52.6321 102.788 51.5609C102.788 50.1973 103.803 49.202 105.831 48.5749C107.861 47.9478 111.197 47.6343 115.84 47.6343C120.447 47.6343 123.757 47.9379 125.77 48.545C127.78 49.1547 128.784 50.16 128.784 51.5609C128.784 52.6321 127.733 53.518 125.632 54.2184C123.528 54.9177 122.329 55.4726 122.036 55.8807C121.451 56.6172 121.039 59.3096 120.803 63.9578C120.566 68.606 120.447 77.1086 120.447 89.4682C120.447 101.713 120.566 110.142 120.803 114.755C121.039 119.365 121.451 122.04 122.036 122.777C122.329 123.181 123.528 123.734 125.632 124.434C127.733 125.137 128.784 126.004 128.784 127.037C128.784 128.477 127.76 129.518 125.711 130.162C123.662 130.809 120.372 131.133 115.84 131.133C111.305 131.133 107.997 130.809 105.915 130.162C103.831 129.518 102.788 128.477 102.788 127.037C102.788 126.042 103.902 125.176 106.132 124.439C107.448 124.031 108.399 123.66 108.983 123.329C109.75 122.888 110.279 121.421 110.572 118.93C110.865 116.442 111.011 111.028 111.011 102.691L111.011 100.865C111.011 99.2784 110.939 98.1724 110.794 97.5453C110.646 96.9182 110.389 96.4753 110.024 96.2165C109.183 95.7748 107.4 95.4613 104.677 95.2759C101.954 95.093 96.8077 95.0022 89.237 95.0022C82.6565 95.0022 77.9234 95.093 75.0352 95.2759C72.1445 95.4613 70.2972 95.7748 69.4906 96.2165C69.0898 96.438 68.8173 96.8535 68.6718 97.4607C68.5238 98.0703 68.4498 99.205 68.4498 100.865L68.4498 104.408C68.4498 112.005 68.5966 116.947 68.8888 119.234C69.1823 121.523 69.7126 122.888 70.4822 123.329C71.0285 123.66 71.9608 124.031 73.2791 124.439C75.5088 125.176 76.6236 126.042 76.6236 127.037C76.6236 128.477 75.6099 129.518 73.58 130.162C71.5514 130.809 68.2698 131.133 63.734 131.133C59.1994 131.133 55.9092 130.809 53.8633 130.162C51.8149 129.518 50.7901 128.477 50.7901 127.037C50.7901 126.004 51.8235 125.137 53.8879 124.434C55.9536 123.734 57.1325 123.181 57.4248 122.777C58.0463 122.003 58.4854 119.154 58.7419 114.227C58.9984 109.303 59.1267 101.05 59.1267 89.4682C59.1267 77.9584 58.9984 69.676 58.7419 64.6197C58.4854 59.5659 58.0846 56.6533 57.5383 55.8806C57.2102 55.4726 56.0029 54.9177 53.9175 54.2184C51.8334 53.518 50.7901 52.6321 50.7901 51.5609C50.7901 50.16 51.7964 49.1547 53.809 48.545C55.8192 47.9379 59.1267 47.6343 63.734 47.6343C68.3413 47.6343 71.6414 47.9379 73.6343 48.545C75.6272 49.1547 76.6236 50.16 76.6236 51.5609C76.6236 52.6321 75.4915 53.5366 73.2248 54.2732C71.9423 54.7173 71.0285 55.1055 70.4822 55.4377C69.7496 55.9155 69.2465 57.3152 68.9727 59.638C68.6965 61.9634 68.5583 66.3366 68.5583 72.7565L68.5583 83.6554C68.5583 85.2405 68.6964 86.2545 68.9727 86.6962C69.2465 87.1403 69.7496 87.4924 70.4822 87.7512C71.285 88.0461 73.6429 88.2663 77.5559 88.4131C81.4702 88.5624 86.7348 88.6371 93.351 88.6371Z" fill="#11283B"/>
                </g>
                <defs>
                <clipPath id="clip0_368_506">
                <rect x="176.611" y="178.073" width="176.611" height="177.765" rx="40" transform="rotate(-180 176.611 178.073)" fill="white"/>
                </clipPath>
                </defs>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="hw-w-24 hw-h-20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
            <svg className="dark:hw-fill-white hw-w-20 hw-h-20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="black" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
        </div>
    )
}

interface DeveloperSetupProps {
   repository: Repository | undefined;
   teamId: string;
   clientId: string;
}
export const DeveloperSetup: React.FunctionComponent<DeveloperSetupProps> = ({repository: repositoryProp, teamId, clientId}) => {
    const {mutate} = api.setup.connectRepository.useMutation();
	const [repository, setRepository] = useState<Repository | undefined>();
	const [page, setPage] = useState(0);
	const router = useRouter();
    const searchParams = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>();
    const [accessToken, setAccessToken] = useState<string>();

    if (searchParams.has('access_token') && !accessToken) {
        const access_token = searchParams.get('access_token') as string;
        setAccessToken(access_token);
    }  

    useEffect(() => {
        const access_token = localStorage.getItem("access_token");
        if (access_token) {
            setAccessToken(access_token);
        }
    }, []);

    useEffect(() => {
        if (accessToken) {
            setPage(1);
            if (!localStorage.getItem('access_token')) {
                localStorage.setItem('access_token', accessToken);
            }
        }
    }, [accessToken])


	if (loading) {
		return <LoadingScreen>
			Importing repository. This could take a few minutes.
		</LoadingScreen>;
	}

    if (repositoryProp && !repository) {
        setRepository(repositoryProp);
        setPage(2);
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
		// setLoading(true);
		// fetch('/api/import', {
		// 	method: 'POST',
		// 	body: JSON.stringify({repository})
		// }).then(response => {
		// 	if (!response.ok) {
		// 		setLoading(false);
		// 		setError("There was an error, please contact support if this problem persists")
		// 		return;
		// 	}

		// 	const reader = response.body?.getReader();
		// 	if (!reader) {
		// 		setLoading(false);
		// 		setError("There was an error, please contact support if this problem persists")
		// 		return;
		// 	}

		// 	readData(reader).then(() => {
		// 		setLoading(false);
		// 		router.push('/');
		// 	})
		// })
        router.push('/');
	}

	const onGithubContinue = (repository: Repository): void => {
		setRepository(repository);
        setPage(page + 1);
	}
    
    const onAdditionalContinue = () => {
        if (!repository) throw new Error("Repository should be defined");

        mutate({repository, teamId}, {
			onSuccess: () => {
				setPage(page+1);
		}})
    }

	const pages = [
		<StartPage clientId={clientId}/>,
		accessToken ? <GitRepositorySetup key={1} onContinue={onGithubContinue} accessToken={accessToken}/> : null,
        repository ? <AdditionalRepositoryInfo key={3} onContinue={onAdditionalContinue} repository={repository} onChange={setRepository}/> : null,
		repository ? <InstallEditor key={2} onContinue={onFinish} repositoryId={repository.id}/> : null
		,
	]
	
	return (<SetupLayout>
			{pages[page]}
			{error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
        </SetupLayout>)
}

interface StartPageProps {
    //onContinue: () => void;
    clientId: string;
}
const StartPage: React.FunctionComponent<StartPageProps> = ({clientId}) => {
    const [href, setHref] = useState<string>();

    useEffect(() => {
        //const clientId = GITHUB_APP_CLIENT_ID;//'Iv1.cea4bda0db4286a5';
        const callbackUrl = `${window.location.href}`;
        const redirectUri = new URL('/api/github/callback', WEB_URL);
        redirectUri.searchParams.append('callback', callbackUrl);
        const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
        authorizeUrl.searchParams.append('client_id', clientId);
        authorizeUrl.searchParams.append('redirect_uri', redirectUri.href);

        setHref(authorizeUrl.href);
    }, []);
    

    return (
        <>
            <Header level={4}>To set up Harmony, we need to connect to your Github repositories.</Header>
            <HarmonyToGithubThing/>
            {href ? <Button as='a' href={href} className="hw-w-fit hw-ml-auto" >Continue</Button> : href}
        </>
    )
}

interface GitRepositorySetupProps {
	onContinue: (repo: Repository) => void;
    accessToken: string;
}
const GitRepositorySetup: React.FunctionComponent<GitRepositorySetupProps> = ({onContinue, accessToken}) => {
    return (
		<>
            <GitImportRepository onImport={onContinue} accessToken={accessToken}/>
		</>
	)
}

interface GitImportRepositoryProps {
	onImport: (repo: Repository) => void;
    accessToken: string;
}
const GitImportRepository: React.FunctionComponent<GitImportRepositoryProps> = ({onImport, accessToken}) => {
	const query = api.setup.getRepositories.useQuery({accessToken});

	const repos = query.data;

	console.log(repos);

	return (<>
		<Header level={4}>Import Git Repository</Header>
        <p className="hw-text-gray-400 hw-text-sm">Note: while in beta, this cannot be changed later.</p>
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

interface AdditionalRepositoryInfoProps {
    repository: Repository,
    onChange: (repo: Repository) => void;
    onContinue: () => void;
}
const AdditionalRepositoryInfo: React.FunctionComponent<AdditionalRepositoryInfoProps> = ({repository, onChange, onContinue}) => {
    const changeProperty = useChangeProperty<Repository>(onChange);
    const [error, setError] = useState('');

    const items: DropdownItem<string>[] = [
        {
            id: 'tailwind',
            name: 'Tailwind'
        },
        {
            id: 'other',
            name: 'Other'
        }
    ];
    const onContinueClick = () => {
        if (!repository.cssFramework || !repository.branch) {
            setError("Please fill out all fields");
            return;
        }

        onContinue();
    }
    return (
        <>
            <Header level={4}>Additional Repository Information</Header>
            <div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-8 sm:hw-grid-cols-6">
                {/* TODO: Should make a dropdown that pulls the available branches */}
                <Label className="sm:hw-col-span-full" label="Branch">
                    <p className="hw-text-sm hw-text-gray-400">Enter the name of the branch that pull requests will be merged into (probably a staging branch).</p>
                    <Input className="hw-w-full" value={repository.branch} onChange={changeProperty.formFunc('branch', repository)}/>
                </Label>
                <Label className="sm:hw-col-span-3" label="CSS Framework:">
                    <Dropdown className="hw-w-full" items={items} initialValue={repository.cssFramework} onChange={(item) => {changeProperty(repository, 'cssFramework', item.id)}}>
                        Select Framework
                    </Dropdown>
                </Label>
                {repository.cssFramework === 'tailwind' ? <Label className="sm:hw-col-span-full" label="Tailwind Prefix (if applicable):">
                    <p className="hw-text-sm hw-text-gray-400">Enter the <a className="hw-text-blue-600" href="https://tailwindcss.com/docs/configuration#prefix" target="_blank">prefix</a> that is used for the tailwind classes</p>
                    <Input className="hw-w-full" value={repository.tailwindPrefix} onChange={changeProperty.formFunc('tailwindPrefix', repository)}/>
                </Label> : null}
            </div>
            {error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
            <Button className="hw-w-fit hw-ml-auto" onClick={onContinueClick}>Continue</Button>
        </>
    )
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
		<p className="hw-text-sm">Copy and paste the snippet below before your website&#39;s closing <span className="hw-p-0.5" style={{background: "rgb(29, 31, 33)"}}><span style={{color: "rgb(197, 200, 198)"}}>&lt;/</span><span style={{color: "rgb(150, 203, 254)"}}>body</span><span style={{color: "rgb(197, 200, 198)"}}>&gt;</span></span> tag. Once installed, you can begin editing on your site.</p>
		<CodeSnippet language="html" code={designSuiteCode}/>

		<Header level={4}>Configure Data Tagging (NextJS Only)</Header>
		<p className="hw-text-sm">In order for the front-end to communicate with the code base, you need to install the harmony-ai-plugin npm package by running <code style={{background: "rgb(29, 31, 33)"}} className="hw-text-white hw-p-0.5">npm|yarn|pnpm install harmony-ai-plugin</code>.</p>
		<p className="hw-text-sm">Next, create a next.config.js file in the root (if it doesn&#39;t exist) and insert the following code:</p>
		<CodeSnippet language="javascript" code={swcPluginCode}/>
		
		<div className="hw-flex">
			<Button className="hw-ml-auto" onClick={onContinue}>Continue</Button>
		</div>
	</>)
}