'use client';
import { GitBranchIcon } from "../core/icons";
import {Button} from '../core/button';
import { useState } from "react";
import { BranchItem } from "../../types/branch";
import { ModalProvider } from "react-aria";
import { useChangeProperty } from "../../hooks/change-property";
import { api } from "../../../../../utils/api";
import { Input } from "../core/input";
import { ClosableContent } from "../core/closable-content";
import { Header } from "../core/header";
import { Label } from "../core/label";
import { ModalPortal } from "../core/modal";
import { displayDate, displayTime } from "../../../../util/src/index";
import { CreateNewPullRequestModal } from "./pull-request";


export const BranchDisplay: React.FunctionComponent<{branches: BranchItem[]}> = ({branches}) => {
	const [showNewBranch, setShowNewBranch] = useState(false);
	
	const openBranch = (item: BranchItem) => {
		const url = new URL(item.url);
		url.searchParams.append('branch-id', item.id);
		window.open(url.href, '_blank');
	}

	return <ModalProvider>
		<div className="hw-flex hw-flex-col hw-gap-4">
			{branches ? <>
				<Button className="hw-w-fit hw-ml-auto" onClick={() => setShowNewBranch(true)}>Create New Branch</Button>
				{branches.map(item => <BranchLineItem key={item.name} item={item} onOpenHarmony={() => openBranch(item)}/>)}
				<CreateNewBranchModal show={showNewBranch} onClose={() => setShowNewBranch(false)} onSuccessfulCreation={openBranch}/>
			</> : null}
		</div>
	</ModalProvider>
}

interface HarmonyModalProps {
	children: React.ReactNode,
	show: boolean,
	onClose: () => void,
}
export const HarmonyModal: React.FunctionComponent<HarmonyModalProps> = ({children, show, onClose}) => {
	return (
		<ModalPortal show={show}>
			<div className="hw-flex hw-justify-center hw-items-center hw-h-full hw-w-full">
				<ClosableContent className="hw-mx-auto hw-max-w-3xl hw-w-full" onClose={onClose}>
					<div className="hw-bg-white hw-shadow sm:hw-rounded-lg">
						<div className="hw-px-4 hw-py-5 sm:hw-p-6">
							{children}
						</div>
					</div>	
				</ClosableContent>
			</div>
		</ModalPortal>
	)
}

interface CreateNewBranchModalProps {
	show: boolean,
	onClose: () => void,
	onSuccessfulCreation: (item: BranchItem) => void;
}
const CreateNewBranchModal: React.FunctionComponent<CreateNewBranchModalProps> = ({show, onClose, onSuccessfulCreation}) => {
	const {mutate, ...createUtils} = api.branch.createBranch.useMutation()
	const [branch, setBranch] = useState<BranchItem>({id: '', name: '', label: '', url: '', commits: []});
	const changeProperty = useChangeProperty<BranchItem>(setBranch);
	const [loading, setLoading] = useState(false);

	const onNewBranch = () => {
		const name = branch.label.split(' ').map(word => `${word[0].toLowerCase()}${word.substring(1)}`).join('-');
		setLoading(true);
		mutate({branch: {...branch, name}}, {
			onSuccess(data) {
				onSuccessfulCreation(data);
				onClose();
				setLoading(false);
			}
		})
	}
	return (
		<HarmonyModal show={show} onClose={onClose}>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<GitBranchIcon className="hw-w-6 hw-h-6"/>
				<Header level={3}>Create a Branch</Header>
			</div>
			<div className="hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500">
				<p>Fill out the following fields to create a new branch through Harmony</p>
			</div>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2">
				<Label className="sm:hw-col-span-full" label="Branch Label:">
					<Input value={branch.label} onChange={changeProperty.formFunc('label', branch)}/>
				</Label>
				<Label className="sm:hw-col-span-full" label="Url:">
					<Input value={branch.url} onChange={changeProperty.formFunc('url', branch)}/>
				</Label>
				{/* <Label className="sm:hw-col-span-3" label="Default URL:">
					<Input />
				</Label> */}
				{/* <Label className="sm:hw-col-span-full" label="Branch Details:">
					<Input type="textarea"/>
				</Label> */}
			</div>
			<div className="hw-flex">
				<Button className="hw-ml-auto" onClick={onNewBranch} loading={loading}>Open in Harmony</Button>
			</div>
		</HarmonyModal>
	)
}


export interface BranchLineItemProps {
	item: BranchItem;
	onOpenHarmony: () => void;
}
export const BranchLineItem: React.FunctionComponent<BranchLineItemProps> = ({item, onOpenHarmony}) => {
	const {label, commits, pullRequestUrl} = item;
	const [isOpen, setIsOpen] = useState(false);
	const [showPRModal, setShowPRModal] = useState(false);

	return (
		<div className="hw-w-full hw-border hw-rounded-md">
			<button className="hw-flex hw-px-2 hw-py-3 hw-w-full hw-rounded-md hover:hw-bg-gray-50 hover:hw-cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
				<GitBranchIcon className="hw-w-6 hw-h-6"/>
				<span>{label}</span>
			</button>
			{isOpen ? <div className="hw-flex hw-flex-col hw-gap-2 hw-border-t hw-py-2 hw-px-4">
				<div className="hw-flex hw-flex-col hw-border-2 hw-h-32 hw-text-sm hw-divide-y hw-overflow-auto">
					{commits.map(commit => <div key={commit.date.toString()} className="hw-flex hw-justify-between hw-text-sm hw-px-4 hw-py-2">
						<span>{commit.author}</span>
						<span>{displayDate(commit.date)} at {displayTime(commit.date)}</span>
						<span>{commit.message}</span>
					</div>)}
				</div>
				<div className="hw-flex hw-justify-around">
					<Button onClick={() => onOpenHarmony()}>Open with Harmony</Button>
					{pullRequestUrl ? <Button as='a' href={pullRequestUrl} target="_blank">Open Pull Request</Button> : <Button onClick={() => setShowPRModal(true)}>Submit Pull Request</Button>}
				</div>
			</div> : null}
			<CreateNewPullRequestModal show={showPRModal} onClose={() => setShowPRModal(false)} branch={item}/>
		</div>
	)
}