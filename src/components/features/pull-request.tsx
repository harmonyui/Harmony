'use client';
import { GitBranchIcon, GitPullRequestIcon } from "../core/icons";
import {Button} from '../core/button';
import { useState } from "react";
import { BranchItem, PullRequest } from "../../../src/types/branch";
import { ModalProvider } from "react-aria";
import { useChangeProperty } from "../../../src/hooks/change-property";
import { api } from "../../../utils/api";
import { Input } from "../../../src/components/core/input";
import { ClosableContent } from "../core/closable-content";
import { Header } from "../core/header";
import { Label } from "../core/label";
import { ModalPortal } from "../core/modal";
import { displayDate, displayTime } from "../../../src/utils/util";
import { HarmonyModal } from "./branch";
import { Dropdown, DropdownItem } from "../core/dropdown";


export const PullRequestDisplay: React.FunctionComponent<{items: PullRequest[]}> = ({items}) => {
	const [showNewPullRequest, setShowNewPullRequest] = useState(false);

	return <ModalProvider>
		<div className="flex flex-col gap-4">
			{items ? <>
				<Button className="w-fit ml-auto" onClick={() => setShowNewPullRequest(true)}>Create New Pull Request</Button>
				{items.map(item => <PullRequestLineItem key={item.title} item={item}/>)}
				<CreateNewPullRequestModal show={showNewPullRequest} onClose={() => setShowNewPullRequest(false)}/>
			</> : null}
		</div>
	</ModalProvider>
}

interface CreateNewBranchModalProps {
	show: boolean,
	onClose: () => void,
	branch?: BranchItem
}
export const CreateNewPullRequestModal: React.FunctionComponent<CreateNewBranchModalProps> = ({show, branch, onClose}) => {
	const {mutate, ...createUtils} = api.pullRequest.createPullRequest.useMutation();
    const query = api.branch.getBranches.useQuery();
	const [pullRequest, setPullRequest] = useState<PullRequest>({id: '', title: '', body: '', url: ''});
	const changeProperty = useChangeProperty<PullRequest>(setPullRequest);
    const [branchItem, setBranchItem] = useState<BranchItem | undefined>(branch);
	const [loading, setLoading] = useState(false);

    const branches = query.data || [];

	const onNewPullRequest = () => {
        if (branchItem === undefined) return;
		setLoading(true);

		mutate({pullRequest: {...pullRequest}, branch: branchItem}, {
			onSuccess(data) {
				onClose();
				setLoading(false);
			}
		})
	}

    const branchItems: DropdownItem<number>[] = branches.map<DropdownItem<number>>((branch, i) => ({id: i, name: branch.label}));
	const branchId = branchItem ? branches.indexOf(branchItem) : undefined;
    
    return (
		<HarmonyModal show={show} onClose={onClose}>
			<div className="flex gap-2 items-center">
				<GitBranchIcon className="w-6 h-6"/>
				<Header level={3}>Create a Pull Request</Header>
			</div>
			<div className="mt-2 max-w-xl text-sm text-gray-500">
				<p>Fill out the following fields to create a new pull request through Harmony</p>
			</div>
			<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 my-2">
				<Label className="sm:col-span-full" label="Title:">
					<Input value={pullRequest.title} onChange={changeProperty.formFunc('title', pullRequest)}/>
				</Label>
                <Label className="sm:col-span-full" label="Body:">
					<Input type="textarea" value={pullRequest.body} onChange={changeProperty.formFunc('body', pullRequest)}/>
				</Label>
                {branch === undefined ? <Label className="sm:col-span-3" label="Branch:">
                    <Dropdown items={branchItems} initialValue={branchId} onChange={({id}) => setBranchItem(branches[id])}>
                        Select
                    </Dropdown>
                </Label> : null}
			</div>
			<div className="flex">
				{branchItem !== undefined ? <Button className="ml-auto" onClick={onNewPullRequest} loading={loading}>Create Pull Request</Button> : null}
			</div>
		</HarmonyModal>
	)
}


export interface PullRequestLineItemProps {
	item: PullRequest;
}
export const PullRequestLineItem: React.FunctionComponent<PullRequestLineItemProps> = ({item,}) => {
	const {title, body, url} = item;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full border rounded-md">
			<a className="flex px-2 py-3 w-full rounded-md hover:bg-gray-50 hover:cursor-pointer" href={url} target="_blank">
				<GitPullRequestIcon className="w-6 h-6"/>
				<span>{title}</span>
			</a>
			{/* {isOpen ? <div className="flex flex-col gap-2 border-t py-2 px-4">
				<div className="flex flex-col border-2 h-32 text-sm divide-y overflow-auto">
				</div>
				<div className="flex">
					<Button as='a' className="ml-auto" target="_blank" href={url}>Open Pull Request</Button>
				</div>
			</div> : null} */}
		</div>
	)
}