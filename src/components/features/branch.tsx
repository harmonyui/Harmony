'use client';
import { GitBranchIcon } from "../core/icons";
import {Button} from '../core/button';
import { useState } from "react";

export interface BranchItem {
	name: string;
	label: string;
	commits: string[]
}
export interface BranchLineItemProps {
	item: BranchItem
}
export const BranchLineItem: React.FunctionComponent<BranchLineItemProps> = ({item}) => {
	const {label, commits} = item;
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full border rounded-md">
			<button className="flex px-2 py-3 w-full rounded-md hover:bg-gray-50 hover:cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
				<GitBranchIcon className="w-6 h-6"/>
				<span>{label}</span>
			</button>
			{isOpen ? <div className="flex flex-col gap-2 border-t py-2 px-4">
				<div className="flex flex-col border-2 h-32 px-2 text-sm">
					{commits.map(commit => <div key={commit}>{commit}</div>)}
				</div>
				<div className="flex justify-around">
					<Button>Open with Harmony</Button>
					<Button>Submit Pull Request</Button>
				</div>
			</div> : null}
		</div>
	)
}