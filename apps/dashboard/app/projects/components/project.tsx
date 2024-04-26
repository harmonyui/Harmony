'use client';
import { EllipsisHorizontalIcon, GitBranchIcon, PlusIcon } from "@harmony/ui/src/components/core/icons";
import {Button} from '@harmony/ui/src/components/core/button';
import { useState } from "react";
import type { BranchItem } from "@harmony/util/src/types/branch";
import { ModalProvider } from "react-aria";
import { useChangeProperty } from "@harmony/ui/src/hooks/change-property";
import { Input } from "@harmony/ui/src/components/core/input";
import { Header } from "@harmony/ui/src/components/core/header";
import { Label } from "@harmony/ui/src/components/core/label";
import { HarmonyModal } from "@harmony/ui/src/components/core/modal";
import { displayElapsedTime } from "@harmony/util/src/utils/common";
import { DropdownIcon } from "@harmony/ui/src/components/core/dropdown";
import { ConfirmModal } from "@harmony/ui/src/components/core/confirm";
import { useRouter } from "next/navigation";
import { api } from "../../../utils/api";


export const ProjectDisplay: React.FunctionComponent<{Projectes: BranchItem[], defaultUrl: string}> = ({Projectes, defaultUrl}) => {
	const [showNewProject, setShowNewProject] = useState(false);
	const {mutate: deleteItem} = api.branch.deleteBranch.useMutation();
	const router = useRouter();
	
	const openProject = (item: BranchItem) => {
		const url = new URL(item.url);
		url.searchParams.append('branch-id', item.id);
		window.location.replace(url.href);
	}

	const onDelete = (item: BranchItem) => {
		deleteItem({branchId: item.id}, {
			onSuccess() {
				router.refresh();
			}
		});
	}

	return <ModalProvider>
		<div className="hw-flex hw-flex-col hw-gap-4 hw-h-full">
			{Projectes.length ? <>
				<Button className="hw-w-fit hw-ml-auto" onClick={() => { setShowNewProject(true); }}>Create Project <PlusIcon className="hw-ml-1 hw-h-5 hw-w-5"/></Button>
				{Projectes.length ? <div className="hw-flex hw-gap-16 hw-flex-wrap hw-overflow-auto">
					{Projectes.map(item => <ProjectLineItem key={item.name} item={item} onOpenHarmony={() => { openProject(item); }} onDelete={() => { onDelete(item); }}/>)}
				</div> : <div className="hw-h-full hw-items-center hw-justify-center hw-flex hw-text-lg hw-mb-48 hw-text-[#88939D]">No Projects Yet!</div>}
				<CreateNewProjectModal show={showNewProject} onClose={() => { setShowNewProject(false); }} onSuccessfulCreation={openProject} defaultUrl={defaultUrl}/>
			</> : null}
		</div>
	</ModalProvider>
}

interface CreateNewProjectModalProps {
	show: boolean,
	onClose: () => void,
	onSuccessfulCreation: (item: BranchItem) => void;
	defaultUrl: string;
}
const CreateNewProjectModal: React.FunctionComponent<CreateNewProjectModalProps> = ({show, onClose, onSuccessfulCreation, defaultUrl}) => {
	const {mutate} = api.branch.createBranch.useMutation()
	const [project, setProject] = useState<BranchItem>({id: '', name: '', label: '', url: defaultUrl, commits: [], lastUpdated: new Date()});
	const changeProperty = useChangeProperty<BranchItem>(setProject);
	const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

	const onNewProject = () => {
        if (!project.label || !project.url) {
            setError('Please fill out all fields');
            return;
        }
		const name = project.label.split(' ').map(word => `${word[0].toLowerCase()}${word.substring(1)}`).join('-');
		setLoading(true);
        setError('');
		mutate({branch: {...project, name}}, {
			onSuccess(data) {
				onSuccessfulCreation(data);
				onClose();
				setLoading(false);
			},
			onError() {
				setLoading(false);
				setError('There was an error creating the project');
			}
		})
	}
	return (
		<HarmonyModal show={show} onClose={onClose}>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<GitBranchIcon className="hw-w-6 hw-h-6"/>
				<Header level={3}>Create a Project</Header>
			</div>
			<div className="hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500">
				<p>Fill out the following fields to create a new Project through Harmony</p>
			</div>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2">
				<Label className="sm:hw-col-span-full" label="Project Label:">
					<Input className="hw-w-full" value={project.label} onChange={changeProperty.formFunc('label', project)}/>
				</Label>
				<Label className="sm:hw-col-span-full" label="Url:">
					<Input className="hw-w-full" value={project.url} onChange={changeProperty.formFunc('url', project)}/>
				</Label>
			</div>
            {error ? <p className="hw-text-red-400 hw-text-sm">{error}</p> : null}
			<div className="hw-flex">
				<Button className="hw-ml-auto" onClick={onNewProject} loading={loading}>Open in Harmony</Button>
			</div>
		</HarmonyModal>
	)
}


export interface ProjectLineItemProps {
	item: BranchItem;
	onOpenHarmony: () => void;
	onDelete: () => void;
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({item, onOpenHarmony, onDelete: onDeleteProps}) => {
	const thumbnailQuery = api.branch.getURLThumbnail.useQuery({url: item.url});
    const [thumbnail, setThumbnail] = useState<string>('/harmony-project-placeholder.svg');
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	if (thumbnailQuery.data && !thumbnail) {
		setThumbnail(thumbnailQuery.data);
	}
	// useEffect(() => {
	// 	const fetch = async () => {
	// 		if (thumbnailQuery.data) {
	// 			const url = await createWebpageThumbnail(thumbnailQuery.data);
	// 			setThumbnail(url);
	// 		}
	// 	}

	// 	fetch();
	// }, [thumbnailQuery])

	const onDeleteDesire = () => {
		setShowDeleteConfirm(true);
	}

	const onDelete = () => {
		setShowDeleteConfirm(false);
		onDeleteProps();
	}


    const moreItems = [
        {id: '0', name: 'Open', onClick: onOpenHarmony},
		{id: '1', name: 'Delete', onClick: onDeleteDesire}
    ]

	return (<>
		<div className="hw-w-[250px]" >
			{/* <h4 className="hw-mt-10">Hello there</h4>
			<p className="hw-mt-5">Thank you please</p> */}
			<button className="hw-rounded-md hw-overflow-auto hw-block">
                <img className="hw-w-[250px]" src={thumbnail} onClick={onOpenHarmony}/>
            </button>
            <div className="hw-mt-2">
                <div className="hw-flex hw-justify-between">
                    <span>{item.label}</span>
                    <DropdownIcon className="hover:hw-bg-gray-200 hw-rounded-full " icon={EllipsisHorizontalIcon} items={moreItems} mode='none' onChange={(item) => { (item as typeof moreItems[number]).onClick(); }}/>
                </div>
                <div className="hw-text-xs hw-text-gray-400 hw-text-start">Last updated {displayElapsedTime(item.lastUpdated)}</div>
            </div>
		</div>
		<ConfirmModal show={showDeleteConfirm} header="Delete Project" message={`Are you sure you want to delete the project ${item.label}`} onConfirm={onDelete} onCancel={() => { setShowDeleteConfirm(false); }}/>
	</>
	)
}