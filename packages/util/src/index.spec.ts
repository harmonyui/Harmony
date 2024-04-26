import { beforeEach, describe, it, expect } from "vitest"
import {Change, diffChars, diffLines} from 'diff';
import { getLineAndColumn, getWebUrl, updateLocationFromContent } from ".";

describe("index", () => {
    describe("updateLocationFromDiffs", () => {
        

        it("Should update startLine and endLine when adding near the top of the file", () => {
const target = `<Label className="sm:hw-col-span-full" label="Project Label:">
					<Input className="hw-w-full" value={project.label} onChange={changeProperty.formFunc('label', project)}/>
				</Label>`
            const {location, oldContent, newContent} = setup('add-to-top-file', target);

            const newLocation = updateLocationFromContent(location, oldContent, newContent);
			expect(newLocation).toBeDefined();
			const {startLine, startColumn, endLine, endColumn} = newLocation!;
            expect(startLine).toBe(79);
			expect(startColumn).toBe(4);
            expect(endLine).toBe(81);
			expect(endColumn).toBe(12);
        })

		it("Should update startLine and endLine when deleting after the target", () => {
			const target = `<span>{item.label}</span>`
			const {location, oldContent, newContent} = setup('add-to-top-file', target);

			const newLocation = updateLocationFromContent(location, oldContent, newContent);
			expect(newLocation).toBeDefined();
			const {startLine, startColumn, endLine, endColumn} = newLocation!;
			expect(startLine).toBe(129);
			expect(startColumn).toBe(20);
			expect(endLine).toBe(129);
			expect(endColumn).toBe(45);
		})

		it("Should update startLine and endLine when adding right before to previous start line", () => {
			const target = `<p className="flex text-sm text-slate-600">
			  {label}
			  {percentage && percentage !== "NaN%" && (
				<span className="ml-1 rounded-xl bg-slate-100 px-2 py-1 text-xs">{percentage}</span>
			  )}
			</p>`;
			const {location, oldContent, newContent} = setup('add-right-before-start', target);

			const newLocation = updateLocationFromContent(location, oldContent, newContent);
			expect(newLocation).toBeDefined();
			const {startLine, startColumn, endLine, endColumn} = newLocation!;
			expect(startLine).toBe(26);
			expect(startColumn).toBe(3);
			expect(endLine).toBe(31);
			expect(endColumn).toBe(7);
		})


		it("Should not update startLine and endLine when adding near bottom of the file", () => {
const target = `<Label className="sm:hw-col-span-full" label="Project Label:">
					<Input className="hw-w-full" value={project.label} onChange={changeProperty.formFunc('label', project)}/>
				</Label>`
            const {location, oldContent, newContent} = setup('add-to-bottom-file', target);

            const newLocation = updateLocationFromContent(location, oldContent, newContent);
			expect(newLocation).toBeDefined();
			const {startLine, startColumn, endLine, endColumn} = newLocation!;
            expect(startLine).toBe(77);
			expect(startColumn).toBe(4);
            expect(endLine).toBe(79);
			expect(endColumn).toBe(12);
		})

		it("Should update startColumn when adding on same line before startColumn", () => {
const target = `<Label label="Hello there">
					<div>Thank you</div>
				</Label>`
			const {location, oldContent, newContent} = setup('add-before-start-column', target);

			const newLocation = updateLocationFromContent(location, oldContent, newContent);
			expect(newLocation).not.toBeDefined();

			//TODO: Make this function actually work
			// expect(newLocation).toBeDefined();
			// const {startLine, startColumn, endLine, endColumn} = newLocation!;
			// expect(startLine).toBe(location.startLine);
			// expect(startColumn).toBe(location.startColumn + 27);
			// expect(endLine).toBe(location.endLine + 1);
			// expect(endColumn).toBe(location.endColumn);
		})

// 		it("Should update everything when component is moved", () => {
// const target = `<Label label="Hello there">
// 					<div>Thank you</div>
// 				</Label>`
// 			const {location, oldContent, newContent} = setup('move-component', target);

// 			const newLocation = updateLocationFromContent(location, oldContent, newContent);
// 			//expect(newLocation).not.toBeDefined();
// 			expect(newLocation).toBeDefined();
// 			const {startLine, startColumn, endLine, endColumn} = newLocation!;
// 			expect(startLine).toBe(location.startLine + 4);
// 			expect(startColumn).toBe(location.startColumn + 27);
// 			expect(endLine).toBe(location.endLine + 5);
// 			expect(endColumn).toBe(location.endColumn + 20);
// 		})

// 		it("Should return undefined when component is deleted", () => {
// const target = `<Label label="Hello there">
// 					<div>Thank you</div>
// 				</Label>`
// 			const {location, oldContent, newContent} = setup('delete-component', target);

// 			const newLocation = updateLocationFromContent(location, oldContent, newContent);
// 			expect(newLocation).not.toBeDefined();
// 		})
    })

	describe("getWebUrl", () => {
		it("Should return http://localhost:3000 when in development mode", () => {
			const url = getWebUrl('development');
			expect(url).toBe('http://localhost:3000');
		})

		it("Should return production url when in production mode", () => {
			const url = getWebUrl('production');
			expect(url).toBe('https://dashboard.harmonyui.app');
		})
	})
});

export const setup = (name: keyof (typeof testCases), target: string) => {
	const {oldContent, newContent} = testCases[name];
	const location = getLocationFromContent(oldContent, target);
	return {location, oldContent, newContent};
}

export const getLocationFromContent = (content: string, target: string) => {
	const targetIndex = content.indexOf(target);
	expect(targetIndex).toBeGreaterThan(-1);
	const {line: startLine, column: startColumn} = getLineAndColumn(content, targetIndex);
	const {line: endLine, column: endColumn} = getLineAndColumn(content, targetIndex + target.length);

	return {file: '', startLine, startColumn, endLine, endColumn}
}

export const testCases = {
    'add-to-top-file': {
        oldContent: `'use client';
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
		const name = project.label.split(' ').map(word => ''{word[0].toLowerCase()}'{word.substring(1)}').join('-');
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
                <div className="hw-text-xs hw-text-gray-400 hw-text-start">Last updated {displayElapsedTime(item.lastUpdated)}</div>
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
}`,

newContent: `'use client';
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
import {load} from 'cheerio';
import domtoimage from 'dom-to-image';


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
		const name = project.label.split(' ').map(word => ''{word[0].toLowerCase()}'{word.substring(1)}').join('-');
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
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({item, onOpenHarmony}) => {
	const thumbnailQuery = api.branch.getURLThumbnail.useQuery({url: item.url});
    const [thumbnail, setThumbnail] = useState<string>('');

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
                <div className="hw-text-xs hw-text-gray-400 hw-text-start">Last updated {displayElapsedTime(item.lastUpdated)}</div>
            </div>
		</div>
	)
}`
    },
	'add-to-bottom-file': {
        oldContent: `'use client';
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
		const name = project.label.split(' ').map(word => ''{word[0].toLowerCase()}'{word.substring(1)}').join('-');
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
                <div className="hw-text-xs hw-text-gray-400 hw-text-start">Last updated {displayElapsedTime(item.lastUpdated)}</div>
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
}`,

newContent: `'use client';
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
		const name = project.label.split(' ').map(word => ''{word[0].toLowerCase()}'{word.substring(1)}').join('-');
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
}
export const ProjectLineItem: React.FunctionComponent<ProjectLineItemProps> = ({item, onOpenHarmony}) => {
	const thumbnailQuery = api.branch.getURLThumbnail.useQuery({url: item.url});
    const [thumbnail, setThumbnail] = useState<string>('');

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
                <div className="hw-text-xs hw-text-gray-400 hw-text-start">Last updated {displayElapsedTime(item.lastUpdated)}</div>
            </div>
		</div>
	)
}`
    },
	'add-before-start-column': {
		oldContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				<Label label="Hello there">
					<div>Thank you</div>
				</Label>
				<div>
					Another something
				</div>
			</>)
		}`,
		newContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				/** This is a bugger -> */ <Label label="Hello there" sameLine>
					<div>Thank you</div>
					<p>Well look at you</p>
				</Label> /** Thank you */
			</>)
		}`
	},
	'add-right-before-start': {
		oldContent: `import React from "react";

		import { TSurveySummary } from "@formbricks/types/responses";
		import { TSurvey } from "@formbricks/types/surveys";
		
		interface SummaryMetadataProps {
		  survey: TSurvey;
		  setShowDropOffs: React.Dispatch<React.SetStateAction<boolean>>;
		  showDropOffs: boolean;
		  surveySummary: TSurveySummary["meta"];
		}
		
		const StatCard: React.FunctionComponent<{
		  label: string;
		  percentage: string;
		  value: React.ReactNode;
		  tooltipText: string;
		}> = ({ label, percentage, value }) => (
		  <div className="flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
			<p className="flex text-sm text-slate-600">
			  {label}
			  {percentage && percentage !== "NaN%" && (
				<span className="ml-1 rounded-xl bg-slate-100 px-2 py-1 text-xs">{percentage}</span>
			  )}
			</p>
			<p className="px-0.5 text-2xl font-bold text-slate-800">{value}</p>
		  </div>
		);
		
		export default function SummaryMetadata({ surveySummary }: SummaryMetadataProps) {
		  const { completedPercentage, completedResponses, displayCount, startsPercentage, totalResponses } =
			surveySummary;
		
		  return (
			<div className="flex flex-col-reverse gap-y-2 py-4 lg:flex-row lg:gap-x-2">
			  <StatCard
				label="Displays"
				percentage="100%"
				value={displayCount === 0 ? <span>-</span> : displayCount}
				tooltipText="Number of times the survey has been viewed."
			  />
			  <StatCard
				label="Starts"
				percentage={''{Math.round(startsPercentage)}%'}
				value={totalResponses === 0 ? <span>-</span> : totalResponses}
				tooltipText="Number of times the survey has been started."
			  />
			  <StatCard
				label="Responses"
				percentage={''{Math.round(completedPercentage)}%'}
				value={completedResponses === 0 ? <span>-</span> : completedResponses}
				tooltipText="Number of times the survey has been completed."
			  />
			</div>
		  );
		}
		`,
		newContent: `import React from "react";

		import { cn } from "@formbricks/lib/cn";
		import { TSurveySummary } from "@formbricks/types/responses";
		import { TSurvey } from "@formbricks/types/surveys";
		
		interface SummaryMetadataProps {
		  survey: TSurvey;
		  setShowDropOffs: React.Dispatch<React.SetStateAction<boolean>>;
		  showDropOffs: boolean;
		  surveySummary: TSurveySummary["meta"];
		}
		
		const StatCard: React.FunctionComponent<{
		  label: string;
		  percentage: string;
		  value: React.ReactNode;
		  tooltipText: string;
		  className?: string;
		}> = ({ label, percentage, value, className }) => (
		  <div
			className={cn(
			  "flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm",
			  className
			)}>
			<p className="flex text-sm text-slate-600">
			  {label}
			  {percentage && percentage !== "NaN%" && (
				<span className="ml-1 rounded-xl bg-slate-100 px-2 py-1 text-xs">{percentage}</span>
			  )}
			</p>
			<p className="px-0.5 text-2xl font-bold text-slate-800">{value}</p>
		  </div>
		);
		
		export default function SummaryMetadata({ surveySummary }: SummaryMetadataProps) {
		  const { completedPercentage, completedResponses, displayCount, startsPercentage, totalResponses } =
			surveySummary;
		
		  return (
			<div className="flex flex-col-reverse gap-y-2 py-4 lg:flex-row lg:gap-x-2">
			  <StatCard
				label="Displays"
				percentage="100%"
				value={displayCount === 0 ? <span>-</span> : displayCount}
				tooltipText="Number of times the survey has been viewed."
			  />
			  <StatCard
				label="Starts"
				percentage={''{Math.round(startsPercentage)}%'}
				value={totalResponses === 0 ? <span>-</span> : totalResponses}
				tooltipText="Number of times the survey has been started."
			  />
			  <StatCard
				label="Responses"
				percentage={''{Math.round(completedPercentage)}%'}
				value={completedResponses === 0 ? <span>-</span> : completedResponses}
				tooltipText="Number of times the survey has been completed."
			  />
			</div>
		  );
		}
		`
	},
	'move-component': {
		oldContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				<Label label="Hello there">
					<div>Thank you</div>
				</Label>
				<div>
					Another something
				</div>
			</>)
		}`,
		newContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				<p>Thank you again</p>
				<div>
					Another something
				</div>
				/** This is a bugger -> */ <Label label="Hello there" sameLine>
					<div>Thank you</div>
					<p>Well look at you</p>
				/** more buggers */ </Label> /** Thank you */
			</>)
		}`
	},
	'delete-component': {
		oldContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				<Label label="Hello there">
					<div>Thank you</div>
				</Label>
				<div>
					Another one
				</div>
			</>)
		}`,
		newContent: `'use client';
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

		const ReactComponent = () => {
			return (<>
				<div>
					Another one
				</div>
			</>)
		}`
	},
}