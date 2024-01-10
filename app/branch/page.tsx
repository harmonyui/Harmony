import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import { Button } from "@harmony/components/core/button";
import { GitBranchIcon } from "@harmony/components/core/icons";
import { BranchLineItem } from "@harmony/components/features/branch";

const BranchPage: NextPage = () => {
	const branchItems: BranchItem[] = [
		{
			label: 'Checkout Changes version 1.0',
			name: 'checkout-changes',
			commits: []
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
		<SideNav>
			<div className="flex flex-col gap-4">
				<Button className="w-fit ml-auto">Create New Branch +</Button>
				{branchItems.map(item => <BranchLineItem key={item.name} item={item}/>)}
			</div>
		</SideNav>
	)
}

export default BranchPage;