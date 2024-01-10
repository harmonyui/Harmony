'use client';
import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { Button } from "@harmony/components/core/button";
import { GitBranchIcon } from "@harmony/components/core/icons";
import { BranchLineItem, type BranchItem } from "@harmony/components/features/branch";
import { ModalPortal, ModalProvider } from "@harmony/components/core/modal";
import { ClosableContent } from "@harmony/components/core/closable-content";
import { useState } from "react";
import { Header } from "@harmony/components/core/header";
import { Label } from "@harmony/components/core/label";
import { Input } from "@harmony/components/core/input";

const BranchPage: NextPage = () => {
	const [showNewBranch, setShowNewBranch] = useState(false);

	const branchItems: BranchItem[] = [
		{
			label: 'Checkout Changes version 1.0',
			name: 'checkout-changes',
			commits: ['Change the text \'Is Open\' to \'Aint she open?\'', 'Update the font color of the checkout form']
		},
		{
			label: 'Landing Page version 2.2',
			name: 'landing-page',
			commits: []
		},
		{
			label: 'Navigator UI version 1.2',
			name: 'naviagor-ui',
			commits: []
		}
	]
	return (
		<ModalProvider>
			<SideNav>
				<div className="flex flex-col gap-4">
					<Button className="w-fit ml-auto" onClick={() => setShowNewBranch(true)}>Create New Branch</Button>
					{branchItems.map(item => <BranchLineItem key={item.name} item={item}/>)}
					<ModalPortal show={showNewBranch}>
						<div className="flex justify-center items-center h-full w-full">
							<ClosableContent className="mx-auto max-w-3xl w-full" onClose={() => setShowNewBranch(false)}>
								<div className="bg-white shadow sm:rounded-lg">
									<div className="px-4 py-5 sm:p-6">
										<div className="flex gap-2 items-center">
											<GitBranchIcon className="w-6 h-6"/>
											<Header level={3}>Create a Branch</Header>
										</div>
										<div className="mt-2 max-w-xl text-sm text-gray-500">
											<p>Fill out the following fields to create a new branch through Harmony</p>
										</div>
										<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 my-2">
											<Label className="sm:col-span-3" label="Branch Name:">
												<Input />
											</Label>
											<Label className="sm:col-span-3" label="Default URL:">
												<Input />
											</Label>
											<Label className="sm:col-span-full" label="Branch Details:">
												<Input type="textarea"/>
											</Label>
										</div>
										<div className="flex">
											<Button className="ml-auto">Open in Harmony</Button>
										</div>
									</div>
								</div>	
							</ClosableContent>
						</div>
					</ModalPortal>
				</div>
			</SideNav>
		</ModalProvider>
	)
}

export default BranchPage;