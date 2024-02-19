'use client';
import { EllipsisHorizontalIcon, GitBranchIcon } from "../core/icons";
import {Button} from '../core/button';
import { useEffect, useState } from "react";
import { BranchItem } from "../../types/branch";
import { ModalProvider } from "react-aria";
import { useChangeProperty } from "../../hooks/change-property";
import { api } from "../../../../../utils/api";
import { Input } from "../core/input";
import { ClosableContent } from "../core/closable-content";
import { Header } from "../core/header";
import { Label } from "../core/label";
import { HarmonyModal, ModalPortal } from "../core/modal";
import { displayDate, displayElapsedTime, displayTime } from "../../../../util/src/index";
import { CreateNewPullRequestModal } from "./pull-request";
import { DropdownIcon } from "../core/dropdown";


export const ProjectDisplay: React.FunctionComponent<{Projectes: BranchItem[]}> = ({Projectes}) => {
	const [showNewProject, setShowNewProject] = useState(false);
	
	const openProject = (item: BranchItem) => {
		const url = new URL(item.url);
		url.searchParams.append('branch-id', item.id);
		window.open(url.href, '_blank');
	}

	return <ModalProvider>
		<div className="hw-flex hw-flex-col hw-gap-4">
			{Projectes ? <>
				<Button className="hw-w-fit hw-ml-auto" onClick={() => setShowNewProject(true)}>Create New Project</Button>
				{Projectes.map(item => <ProjectLineItem key={item.name} item={item} onOpenHarmony={() => openProject(item)}/>)}
				<CreateNewProjectModal show={showNewProject} onClose={() => setShowNewProject(false)} onSuccessfulCreation={openProject}/>
			</> : null}
		</div>
	</ModalProvider>
}

interface CreateNewProjectModalProps {
	show: boolean,
	onClose: () => void,
	onSuccessfulCreation: (item: BranchItem) => void;
}
const CreateNewProjectModal: React.FunctionComponent<CreateNewProjectModalProps> = ({show, onClose, onSuccessfulCreation}) => {
	const {mutate, ...createUtils} = api.branch.createBranch.useMutation()
	const [project, setProject] = useState<BranchItem>({id: '', name: '', label: '', url: '', commits: [], lastUpdated: new Date()});
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
				<p>Fill out the following fields to create a new project through Harmony</p>
			</div>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2">
				<Label className="sm:hw-col-span-full" label="Project:">
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
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({item, onOpenHarmony}) => {

    const [thumbnail, setThumbnail] = useState<string>('');

	useEffect(() => {
        const fetch = async () => {
            const url = await createWebpageThumbnail(item.url);
            setThumbnail(url);
        }
        fetch();
    }, []);

    const moreItems = [
        {id: '0', name: 'Open', onClick: onOpenHarmony}
    ]

	return (
		<div className="hw-w-[400px]" >
			<button className="hw-rounded-md hw-overflow-auto">
                <img className="w-full" src={thumbnail} onClick={onOpenHarmony}/>
            </button>
            <div className="hw-mt-2">
                <div className="hw-flex hw-justify-between">
                    <span>{item.label}</span>
                    <DropdownIcon className="hover:hw-bg-gray-200 hw-rounded-full " icon={EllipsisHorizontalIcon} items={moreItems} mode='none' onChange={(item) => (item as typeof moreItems[number]).onClick()}/>
                </div>
                <div className="text-start text-[#145BDBFF] text-lg">Last updated {displayElapsedTime(item.lastUpdated)}</div>
            </div>
		</div>
	)
}

async function createWebpageThumbnail(url: string): Promise<string> {
    return 'https://assets-global.website-files.com/61c1c0b4e368108c5ab02f30/62385d67c46d9a32873c39aa_canopy_dark.png'
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract title
    const title = doc.querySelector('title')?.textContent;

    // Extract thumbnail image (you may need to adjust this based on webpage structure)
    const thumbnailImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');

    return thumbnailImage || '';
}