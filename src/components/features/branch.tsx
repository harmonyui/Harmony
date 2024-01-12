'use client';
import { GitBranchIcon } from "../core/icons";
import {Button} from '../core/button';
import { useState } from "react";
import { BranchItem } from "@harmony/types/branch";
import { ModalProvider } from "react-aria";
import { useChangeProperty } from "@harmony/hooks/change-property";
import { api } from "@harmony/utils/api";
import { Input } from "@harmony/components/core/input";
import { ClosableContent } from "../core/closable-content";
import { Header } from "../core/header";
import { Label } from "../core/label";
import { ModalPortal } from "../core/modal";


export const BranchDisplay: React.FunctionComponent<{branches: BranchItem[]}> = ({branches}) => {
	const [showNewBranch, setShowNewBranch] = useState(false);
	
	const openBranch = (item: BranchItem) => {
		window.open(`http://localhost:3000/branch?branch-id=${item.id}`, '_blank');
	}

	return <ModalProvider>
		<div className="flex flex-col gap-4">
			{branches ? <>
				<Button className="w-fit ml-auto" onClick={() => setShowNewBranch(true)}>Create New Branch</Button>
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
const HarmonyModal: React.FunctionComponent<HarmonyModalProps> = ({children, show, onClose}) => {
	return (
		<ModalPortal show={show}>
			<div className="flex justify-center items-center h-full w-full">
				<ClosableContent className="mx-auto max-w-3xl w-full" onClose={onClose}>
					<div className="bg-white shadow sm:rounded-lg">
						<div className="px-4 py-5 sm:p-6">
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
	const [branch, setBranch] = useState<BranchItem>({id: '', name: '', label: ''});
	const changeProperty = useChangeProperty<BranchItem>(setBranch);

	const onNewBranch = () => {
		mutate({branch}, {
			onSuccess(data) {
				onSuccessfulCreation(data);
				onClose();
			}
		})
	}
	return (
		<HarmonyModal show={show} onClose={onClose}>
			<div className="flex gap-2 items-center">
				<GitBranchIcon className="w-6 h-6"/>
				<Header level={3}>Create a Branch</Header>
			</div>
			<div className="mt-2 max-w-xl text-sm text-gray-500">
				<p>Fill out the following fields to create a new branch through Harmony</p>
			</div>
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 my-2">
				<Label className="sm:col-span-3" label="Branch:">
					<Input value={branch.label} onChange={changeProperty.formFunc('label', branch)}/>
				</Label>
				<Label className="sm:col-span-3" label="Branch Name:">
					<Input value={branch.name} onChange={changeProperty.formFunc('name', branch)}/>
				</Label>
				{/* <Label className="sm:col-span-3" label="Default URL:">
					<Input />
				</Label> */}
				{/* <Label className="sm:col-span-full" label="Branch Details:">
					<Input type="textarea"/>
				</Label> */}
			</div>
			<div className="flex">
				<Button className="ml-auto" onClick={onNewBranch}>Open in Harmony</Button>
			</div>
		</HarmonyModal>
	)
}


export interface BranchLineItemProps {
	item: BranchItem;
	onOpenHarmony: () => void;
}
export const BranchLineItem: React.FunctionComponent<BranchLineItemProps> = ({item, onOpenHarmony}) => {
	const {label} = item;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full border rounded-md">
			<button className="flex px-2 py-3 w-full rounded-md hover:bg-gray-50 hover:cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
				<GitBranchIcon className="w-6 h-6"/>
				<span>{label}</span>
			</button>
			{isOpen ? <div className="flex flex-col gap-2 border-t py-2 px-4">
				<div className="flex flex-col border-2 h-32 px-2 text-sm">
					{/* {commits.map(commit => <div key={commit}>{commit}</div>)} */}
				</div>
				<div className="flex justify-around">
					<Button onClick={() => onOpenHarmony()}>Open with Harmony</Button>
					<Button>Submit Pull Request</Button>
				</div>
			</div> : null}
		</div>
	)
}