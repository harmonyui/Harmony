import { Attribute, ComponentElement, ComponentUpdate } from "@harmony/ui/src/types/component"
import { Header } from "@harmony/ui/src/components/core/header";
import { Label } from "@harmony/ui/src/components/core/label";
import { Input, InputBlur } from "@harmony/ui/src/components/core/input";
import { TabButton, TabItem } from "@harmony/ui/src/components/core/tab";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, Bars3, Bars3BottomLeft, Bars3BottomRight, Bars3CenterLeft, Bars4Icon, BarsArrowDownIcon, CursorArrowRaysIcon, DocumentTextIcon, EditDocumentIcon, EditIcon, MaximizeIcon, EyeDropperIcon, GitBranchIcon, IconComponent, PlayIcon, ShareArrowIcon, LinkIcon } from "@harmony/ui/src/components/core/icons";
import { arrayOfAll, convertRgbToHex, getClass, groupBy } from "@harmony/util/src/index";
import { Fragment, useState } from "react";
import { Button } from "@harmony/ui/src/components/core/button";
import { componentIdentifier } from "../inspector/inspector";
import { Slider } from "@harmony/ui/src/components/core/slider";
import {Dropdown, DropdownIcon, DropdownItem} from "@harmony/ui/src/components/core/dropdown";
import ColorPicker from '@harmony/ui/src/components/core/color-picker';
import { HexColorSchema } from "@harmony/ui/src/types/colors";
import {useChangeArray, useChangeProperty} from '@harmony/ui/src/hooks/change-property';
import { Popover } from "@harmony/ui/src/components/core/popover";
import { Transition } from "@headlessui/react";
import {ToggleSwitch} from '@harmony/ui/src/components/core/toggle-switch';
import {HarmonyModal} from '@harmony/ui/src/components/core/modal';
import {PullRequest} from '@harmony/ui/src/types/branch';
import { useHarmonyContext, usePinchGesture } from "../harmony-provider";
import { PublishRequest } from "@harmony/ui/src/types/network";
import { Font } from "@harmony/util/src/fonts";
import { WEB_URL } from "@harmony/util/src/constants";

export type SelectMode = 'scope' | 'tweezer';

export interface HarmonyPanelProps {
	root: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onAttributesChange: (component: ComponentElement, updates: ComponentUpdate[], oldValue: string[]) => void;
	onComponentSelect: (component: HTMLElement) => void;
	onComponentHover: (component: HTMLElement) => void;
	mode: SelectMode;
	onModeChange: (mode: SelectMode) => void;
	scale: number;
	onScaleChange: (scale: number) => void;
	children: React.ReactNode;
	toggle: boolean;
	onToggleChange: (toggle: boolean) => void;
	isDirty: boolean;
	setIsDirty: (value: boolean) => void;
	branchId: string | undefined;
	branches: {id: string, name: string}[];
	onBranchChange: (id: string) => void;
}
export const HarmonyPanel: React.FunctionComponent<HarmonyPanelProps> = (props) => {
	const {displayMode} = useHarmonyContext();
	const {onTouch} = usePinchGesture({scale: props.scale, onTouching(newScale) {
		props.onScaleChange(newScale);
	}})
	const {children, scale, onScaleChange} = props;

	//TODO: Fix bug where getting rid of these parameters gives a "cannot read 'data-harmony-id' of undefined"
	const getPanel = (_?: string, _2?: string) => {
		if (displayMode === 'designer') {
			return <EditorPanel {...props}/>
		}

		return <PreviewPanel/>
	}
	return (
		<div className="hw-flex hw-h-full">
			{/* <div className="hw-flex hw-flex-col">
				<img src="/harmony.ai.svg"/>
				<SidePanelToolbar/>
			</div> */}
			<div className="hw-flex hw-flex-col hw-divide-y hw-divide-gray-200 hw-w-full hw-h-full hw-overflow-hidden hw-rounded-lg hw-bg-white hw-shadow">
				{getPanel()}
				<div ref={(ref) => {
					ref?.addEventListener('wheel', onTouch);
				}} className="hw-flex hw-w-full hw-overflow-auto hw-flex-1 hw-px-4 hw-py-5 sm:hw-p-6 hw-bg-gray-200" >
					{children}
				</div>
				<div className="hw-px-4 hw-py-4 sm:hw-px-6">
					<Slider value={scale * 100} onChange={(value) => onScaleChange(value/100)} max={500}/>
				</div>
			</div>
		
			{/* <ToolbarPanel mode={mode} onModeChange={onModeChange}/>
			<div className="hw-text-center">
				
			</div>
			<AttributePanel root={root} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onComponentHover={(component) => component.element && onComponentHover(component.element)} onComponentSelect={(component) => component.element && onComponentSelect(component.element)} onAttributesSave={onAttributesSave} onAttributesCancel={onAttributesCancel}/> */}

		</div>
	) 
}

const EditorPanel: React.FunctionComponent<HarmonyPanelProps> = ({root: rootElement, selectedComponent: selectedElement, onAttributesChange, onComponentHover, onComponentSelect, mode, onModeChange, scale, onScaleChange, toggle, onToggleChange, children, isDirty, setIsDirty, branchId, branches, onBranchChange}) => {
	const selectedComponent = selectedElement ? componentIdentifier.getComponentFromElement(selectedElement) : undefined;
	//const root = rootElement ? componentIdentifier.getComponentFromElement(rootElement) : undefined;

	
	return (
		<div className="hw-flex hw-w-full">
			<div className="hw-h-20">
				<img className="hw-h-full" src={`${WEB_URL}/harmonylogo.svg`}/>
			</div>
			<div className="hw-px-4 hw-py-5 sm:hw-px-6 hw-w-full">
				<ToolbarPanel mode={mode} onModeChange={onModeChange} toggle={toggle} onToggleChange={onToggleChange} selectedComponent={selectedComponent} onChange={onAttributesChange} isDirty={isDirty} branchId={branchId} branches={branches} onBranchChange={onBranchChange}/>
			</div>
		</div>
	)
}

const PreviewPanel: React.FunctionComponent = () => {
	const {changeMode, publishState, setPublishState, publish, branchId} = useHarmonyContext();
	const [loading, setLoading] = useState(false);
	const onMaximize = () => {
		changeMode('preview-full')
	}

	const onBack = () => {
		changeMode('designer');
		setPublishState(undefined);
	}

	const onSendRequest = () => {
		if (!publishState) throw new Error("There should be a publish state");

		const request: PublishRequest = {
			branchId,
			pullRequest: publishState
		}

		setLoading(true);
		publish(request).then(() => {
			setLoading(false);
		})
	}

	const url = new URL(window.location.href);
	url.searchParams.set('mode', 'preview-full');

	return (
		<div className="hw-flex hw-justify-between hw-px-4 hw-py-5 sm:hw-px-6 hw-w-full">
			<div>
				<div className="hw-flex hw-gap-4">
					<button className="hw-p-2 hw-bg-primary hover:hw-bg-primary/80 hw-rounded-md" onClick={onBack}>
						<ArrowLeftIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-white hw-stroke-[2.5]"/>
					</button>
					<button className="hw-bg-primary hw-rounded-md hw-p-2 hover:hw-bg-primary/80">
						<MaximizeIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none" onClick={onMaximize}/>
					</button>
				</div>
			</div>
			<div>
				<div className="hw-flex hw-gap-4">
					<ShareButton />
					{!publishState ? <PublishButton/> : <Button onClick={onSendRequest} loading={loading}>Send Request</Button>}
				</div>
			</div>
		</div>
	)
}

interface SidePanelToolbarItem {
	id: string,
	label: string,
	icon: IconComponent,
	panel: React.ReactNode
}
const SidePanelToolbar: React.FunctionComponent = () => {
	const [show, setShow] = useState<SidePanelToolbarItem | undefined>();
	const items: SidePanelToolbarItem[] = [
		{
			id: 'component',
			label: 'Components',
			icon: DocumentTextIcon,
			panel: 'Components coming soon!'
		},
		{
			id: 'element',
			label: 'Elements',
			icon: DocumentTextIcon,
			panel: 'Elements coming soon!'
		},
		{
			id: 'text',
			label: 'Text',
			icon: DocumentTextIcon,
			panel: 'Text coming soon!'
		},
	]
	return (
		<div className="hw-relative hw-flex hw-flex-col hw-h-full hw-text-sm hw-bg-slate-800 hw-text-white/75">
			{items.map(item => 
				<button key={item.id} className="hw-flex hw-flex-col hw-items-center hw-gap-1 hw-p-4 hover:hw-bg-slate-700 hover:hw-text-white" onClick={() => setShow(show?.id !== item.id ? item : undefined)}>
					<item.icon className="hw-h-8 hw-w-8"/>
					<span>{item.label}</span>
				</button>
			)}
			<Transition
				as={Fragment}
				enter="hw-transition hw-ease-out hw-duration-200"
				enterFrom="hw-opacity-0 -hw-translate-x-1"
				enterTo="hw-opacity-100 hw-translate-x-0"
				leave="hw-transition hw-ease-in hw-duration-150"
				leaveFrom="hw-opacity-100 hw-translate-x-0"
				leaveTo="hw-opacity-0 -hw-translate-x-1"
				show={show !== undefined}
			>
				<div className="hw-absolute hw-left-[116px] hw-right-0 hw-z-10 hw-bg-slate-800 hw-min-w-[400px] hw-h-full hw-top-0 hw-shadow-lg hw-ring-1 hw-ring-gray-900/5">
					<div className="hw-p-4">
						{show?.panel}
					</div>
				</div>
			</Transition>
		</div>
	)
}

const getTextToolsFromAttributes = (element: ComponentElement, fonts: Font[] | undefined) => {
	if (!element.element) {
		throw new Error("Component must have an element");
	}

	const computed = getComputedStyle(element.element);
	const getAttr = (name: keyof CSSStyleDeclaration) => {
		if (name === 'font') {
			const computedFont = computed[name];
			if (!fonts) {
				console.log("No fonts");
				return '';
			}
			const font = fonts.find(f => element.element!.className.includes(f.id) || computedFont.includes(f.name));

			if (font) return font.id;

			return computedFont;
		}
		return computed[name] as string;
	}
	const all = arrayOfAll<ComponentToolData<typeof textTools>>()([
		{
			name: 'font',
			value: getAttr('font'),
		},
		{
			name: 'fontSize',
			value: getAttr('fontSize'),
		},
		{
			name: 'color',
			value: convertRgbToHex(getAttr('color')),
		},
		{
			name: 'textAlign',
			value: getAttr('textAlign'),
		},
		{
			name: 'spacing',
			value: `${getAttr('lineHeight')}-${getAttr('letterSpacing')}`
		}
	]);

	return all;
}

interface ToolbarPanelProps {
	mode: SelectMode;
	onModeChange: (mode: SelectMode) => void;
	toggle: boolean;
	onToggleChange: (toggle: boolean) => void;
	selectedComponent: ComponentElement | undefined;
	onChange: (component: ComponentElement, update: ComponentUpdate[], oldValue: string[]) => void;
	isDirty: boolean;
	branchId: string | undefined;
	branches: {id: string, name: string}[];
	onBranchChange: (id: string) => void;
}
const ToolbarPanel: React.FunctionComponent<ToolbarPanelProps> = ({toggle, onToggleChange, selectedComponent, onChange, isDirty, branchId, branches, onBranchChange}) => {
	const {isSaving, isPublished, changeMode, fonts} = useHarmonyContext();
	const data = selectedComponent ? getTextToolsFromAttributes(selectedComponent, fonts) : undefined;
	const currBranch = branches.find(b => b.id === branchId);
	const changeData = (values: ComponentToolData<typeof textTools>) => {
		if (selectedComponent === undefined || data === undefined) return;
		const componentId = selectedComponent.id;
		const parentId = selectedComponent.parentId;

		const update: ComponentUpdate = {componentId, parentId, type: 'className', action: 'add', name: values.name, value: values.value};
		const old = data.find(t => t.name === values.name);
		if (!old) throw new Error("Cannot find old property");
		
		onChange(selectedComponent, [update], [old.value]);
	}

	const onPreview = () => {
		changeMode('preview')
	}

	const savingText = isSaving ? 'Saving...' : isPublished ? 'Published (No saved changes)' : null;

	const textToolsComponents: Record<TextTools, ComponentTool | undefined> = {
		'font': fonts ? ({data, onChange}) => {
			const items: DropdownItem<string>[] = fonts;
			return (
				<Dropdown className="hw-w-[170px]" items={items} initialValue={data} onChange={(item) => onChange(item.id)} container={document.getElementById("harmony-container") || undefined}/>
			)
		} : undefined,
		'fontSize': ({data, onChange}) => {
			return (
				<Input className="hw-w-fit" value={data} onChange={onChange}/>
			)
		},
		'color': ({data, onChange}) => {
			return (
				<ColorPicker value={HexColorSchema.parse(data)} onChange={onChange} container={document.getElementById("harmony-container") || undefined}/>
			)
		},
		'textAlign': ({data, onChange}) => {
			const icons: Record<string, React.ReactNode> = {
				'left': <Bars3CenterLeft className="hw-h-5 hw-w-5"/>,
				'center': <Bars3 className="hw-h-5 hw-w-5"/>,
				'right': <Bars3CenterLeft className="hw-h-5 hw-w-5 hw-rotate-180"/>,
				'justify': <Bars4Icon className="hw-h-5 hw-w-5"/>,
			};
			const options = Object.keys(icons);
	
			const onClick = () => {
				const index = options.indexOf(data);
				if (index < 0) throw new Error("Invalid alignment");
				const nextIndex = index < options.length - 1 ? index + 1 : 0;
				onChange(options[nextIndex]);
			}
			const icon = icons[data];
			if (!icon) {
				<></>
			}
	
			return (
				<Button mode='none' onClick={onClick}>{icon}</Button>
			)
		},
		'spacing': ({data, onChange}) => {
			const split = data.split('-');
			const lineStr = split[0].replace('px', '');
			const letterStr = split[1].replace('px', '');
			const line = Number(lineStr);
			let letter = Number(letterStr);
			if (isNaN(letter)) {
				letter = 0;
			}
			
			return (
				<Popover buttonClass="hw-h-5" button={<Button mode='none'><BarsArrowDownIcon className="hw-h-5 hw-w-5"/></Button>} container={document.getElementById("harmony-container") || undefined}>
					<div className="hw-grid hw-grid-cols-6 hw-gap-2 hw-text-sm hw-items-center hw-font-normal">
						<span className="hw-col-span-2">Line Height</span>
						<Slider className="hw-col-span-3" value={line} max={50} onChange={(value) => onChange(`${value}px-${letter}px`)}/>
						<span className="hw-col-span-1">{line}</span>
						<span className="hw-col-span-2">Letter Spacing</span>
						<Slider className="hw-col-span-3" value={letter} max={50} onChange={(value) => onChange(`${line}px-${value}px`)}/>
						<span className="hw-col-span-1">{letter}</span>
					</div>
				</Popover>
			)
		}
	}

	return (
		<div className="hw-inline-flex hw-gap-2 hw-items-center hw-h-full hw-w-full hw-bg-white hw-pointer-events-auto hw-overflow-auto hw-divide-x">
			{branchId ? <div className="hw-flex hw-items-center hw-text-nowrap hw-gap-2">
				<Header level={4}>{currBranch ? currBranch.name : 'Invalid Branch'}</Header>
				<DropdownIcon className="hw-border-none !hw-px-2" icon={EditIcon} items={branches} onChange={(item) => onBranchChange(item.id)} container={document.getElementById("harmony-container") || undefined}/>
			</div> : <Dropdown items={branches} onChange={(item) => onBranchChange(item.id)} container={document.getElementById("harmony-container") || undefined}>Select Branch</Dropdown>}
			{data ? <>
				<div className="hw-px-4">
					<ComponentTools tools={textTools} components={textToolsComponents} data={data} onChange={changeData}/>
				</div>
				<div className="hw-px-4">
					<Button mode="secondary">Behavior</Button>
				</div>
			</> : null}
			{savingText ? <div className="hw-px-4">{savingText}</div> : null}
			{/* {isDirty ? <div className="hw-flex hw-gap-2 hw-px-4">
				<Button onClick={onCancel} mode="secondary">Cancel</Button>
				<Button onClick={onSave}>Save</Button>
			</div> : null} */}
			<div className="hw-ml-auto" style={{borderLeft: '0px'}}>
				<ToggleSwitch value={toggle} onChange={onToggleChange} label="Designer Mode"/>
			</div>
			<div className="hw-px-4 hw-flex hw-gap-4">
				<PublishButton preview/>
				<button className="hw-bg-primary hw-rounded-full hw-p-2 hover:hw-bg-primary/80" onClick={onPreview}>
					<PlayIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none"/>
				</button>
			</div>
			
			{/* <Button className="hw-p-1" mode={mode === 'scope' ? 'primary' : 'secondary'} onClick={() => onModeChange('scope')}>
				<CursorArrowRaysIcon className="hw-w-5 hw-h-5"/>
			</Button>
			<Button className="hw-p-1" mode={mode === 'tweezer' ? 'primary' : 'secondary'} onClick={() => onModeChange('tweezer')}>
				<EyeDropperIcon className="hw-w-5 hw-h-5"/>
			</Button> */}
		</div>
	)
}

const PublishButton: React.FunctionComponent<{preview?: boolean}> = ({preview=false}) => {
	const {publishState, setPublishState, changeMode} = useHarmonyContext();
	const [show, setShow] = useState(false);
	const changeProperty = useChangeProperty<PullRequest>(setPublishState);
	const [loading, setLoading] = useState(false);
	const {branchId, publish, setIsPublished} = useHarmonyContext();
	const [error, setError] = useState('');

	const pullRequest: PullRequest = publishState || {id: '', title: '', body: '', url: ''}

	const onNewPullRequest = () => {
		if (!validate()) return;

        setLoading(true);

		const request: PublishRequest = {
			branchId,
			pullRequest
		}
		publish(request).then(() => {
			setLoading(false);
			setIsPublished(true);
		})
	}

	const onPreview = () => {
		if (!validate()) return;
		changeMode('preview')
	}

	const validate = (): boolean => {
		if (!pullRequest.body || !pullRequest.title) {
			setError('Please fill out all fields');
			return false;
		}

		return true;
	}

	const onClose = () => {
		setShow(false);
		setError('');
	}

	return <>
		<Button onClick={() => setShow(true)}>Publish</Button>
		<HarmonyModal show={show} onClose={onClose} editor>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<GitBranchIcon className="hw-w-6 hw-h-6"/>
				<Header level={3}>Create a Publish Request</Header>
			</div>
			<div className="hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500">
				<p>Fill out the following fields to create a new request to publish your changes</p>
			</div>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2">
				<Label className="sm:hw-col-span-full" label="Title:">
					<Input className="hw-w-full" value={pullRequest.title} onChange={changeProperty.formFunc('title', pullRequest)}/>
				</Label>
                <Label className="sm:hw-col-span-full" label="Publish Details:">
					<Input className="hw-w-full" type="textarea" value={pullRequest.body} onChange={changeProperty.formFunc('body', pullRequest)}/>
				</Label>
			</div>
			{error ? <p className="hw-text-red-400 hw-text-sm">{error}</p> : null}
			<div className="hw-flex hw-justify-between">
				{preview ? <Button onClick={onPreview}>Preview Changes</Button> : null}
				<Button onClick={onNewPullRequest} loading={loading}>Send Request</Button>
			</div>
		</HarmonyModal>
	</>
}

const ShareButton = () => {
	const [show, setShow] = useState(false);
	const [copyText, setCopyText] = useState('Copy Link');

	const url = new URL(window.location.href);
	url.searchParams.set('mode', 'preview-full');
	const href = url.href;

	const onClose = () => {
		setShow(false);
	}

	const onClick = () => {
		setShow(true);
	}

	const onCopy = () => {
		window.navigator.clipboard.writeText(href);
		setCopyText('Copied!')
	}

	return (<>
		<Popover button={<button className="hw-bg-primary hw-rounded-full hw-p-2 hover:hw-bg-primary/80" >
			<ShareArrowIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none"/>
		</button>} container={document.getElementById('harmony-container') || undefined}>
			<button className="hw-text-sm hw-text-blue-500 hw-flex hw-items-center hw-gap-1" onClick={onCopy}>
				<LinkIcon className="hw-h-4 hw-w-4 hw-fill-blue-500"/>
				{copyText}
			</button>
		</Popover>
		{/* <HarmonyModal show={show} onClose={onClose} editor>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<Header level={3}>Share Project</Header>
			</div> 
			<button className="hw-text-sm hw-text-blue-500 hw-flex hw-items-center hw-gap-1" onClick={onCopy}>
				<LinkIcon className="hw-h-4 hw-w-4 hw-fill-blue-500"/>
				{copyText}
			</button>
		</HarmonyModal> */}
	</>)
}

const textTools = ['font', 'fontSize', 'color', 'textAlign', 'spacing'] as const;
type TextTools = typeof textTools[number];
type ComponentTool = React.FunctionComponent<{data: string, onChange: (data: string) => void}>;

type ComponentToolData<T extends readonly string[]> = {name: T[number], value: string};
interface ComponentToolsProps<T extends readonly string[]> {
	tools: T,
	components: Record<T[number], ComponentTool | undefined>,
	data: ComponentToolData<T>[],
	onChange: (data: ComponentToolData<T>) => void
}
const ComponentTools = <T extends readonly string[]>({tools, components, data, onChange}: ComponentToolsProps<T>) => {
	return (<div className="hw-flex hw-gap-4 hw-items-center">
		{tools.map((tool: T[number]) => {
			const Component = components[tool] as ComponentTool | undefined;
			if (!Component) return undefined;

			const index = data.findIndex(d => d.name === tool);

			const onComponentChange = (value: string): void => {
				const update = data[index];

				onChange({...update, value});
			}
			return <Component data={data[index].value} onChange={onComponentChange}/>
		})}
	</div>)
}

interface AttributePanelProps {
	selectedComponent: ComponentElement | undefined;
	onAttributesChange: (component: ComponentElement, attributes: Attribute[]) => void;
	onAttributesSave: () => void;
	onAttributesCancel: () => void;
	root: ComponentElement | undefined;
	onComponentSelect: (component: ComponentElement) => void;
	onComponentHover: (component: ComponentElement) => void;
}
const AttributePanel: React.FunctionComponent<AttributePanelProps> = ({root, selectedComponent, onAttributesChange: onAttributesChangeProps, onAttributesSave, onAttributesCancel, onComponentHover, onComponentSelect}) => {
	const [isDirty, setIsDirty] = useState(false);
	const getTreeItems = (children: ComponentElement[]): TreeViewItem<ComponentElement>[] => {
		return children.map<TreeViewItem<ComponentElement>>(child => ({
			id: child,
			content: child.name,
			items: getTreeItems(child.children),
			selected: selectedComponent === child.element
		}))
	}
	const treeItems: TreeViewItem<ComponentElement>[] = root ? getTreeItems([root]) : [];

	const onAttributesChange = (attributes: Attribute[]): void => {
		setIsDirty(true);
		selectedComponent && onAttributesChangeProps(selectedComponent, attributes);
	}

	const onSave = (): void => {
		onAttributesSave();
		setIsDirty(false);
	}

	const onCancel = (): void => {
		onAttributesCancel();
		setIsDirty(false);
	}
	
	return (
		<div className="hw-absolute hw-right-0 hw-flex hw-flex-col hw-h-full hw-border hw-border-gray-200 hw-p-4 hw-bg-white hw-pointer-events-auto hw-overflow-auto" style={{minWidth: '400px'}}>
			<div className="hw-flex-1">
				{isDirty ? <div className="hw-flex hw-gap-2">
					<Button onClick={onSave}>Save</Button>
					<Button onClick={onCancel} mode='secondary'>Cancel</Button>
				</div> : null}
				{selectedComponent ? <>
					<ComponentDisplay value={selectedComponent} onAttributesChange={onAttributesChange}/>
				</> : null}
			</div>
			<div className="hw-flex-1">
				<TreeView items={treeItems} expand={true} onClick={(item) => onComponentSelect(item.id)} onHover={(item) => onComponentHover(item.id)}/>
				{/* {rootFiber ? <ComponentTree node={rootFiber} expand={true} onHover={onFiberHover} onClick={onFiberClick}/> : null} */}
			</div>
		</div>
	)
}

const spacingTypes = ['padding', 'margin', 'border'] as const;
const spacingDirections = ['top', 'left', 'right', 'bottom'] as const;
type SpacingType = typeof spacingTypes[number]
type SpacingDirection = typeof spacingDirections[number];
interface SpacingValue {
	direction: SpacingDirection, 
	value: number,
}
const spacingConvesions = {
	getSpacingValues: (attributes: Attribute[]): Record<SpacingType, SpacingValue[]> => {
		const values: Record<SpacingType, SpacingValue[]> = {'border': [], 'padding': [], 'margin': []};
		for (const attribute of attributes) {
			const {id, value: attributeValue} = attribute;
			const [type, direction] = id.split('-');

			const spacingType = spacingTypes.find(sType => type === sType);
			const spacingDirection = spacingDirections.find(sDirection => sDirection === direction);
			if (!spacingType || !spacingDirection) continue;

			const value = Number(attributeValue);
			if (isNaN(value)) {
				throw new Error(`Invalid attribute value for ${id}: ${attributeValue}`);
			}

			values[spacingType].push({direction: spacingDirection, value});
			// const spacingType = spacingTypes.find(type => id.includes(type));
			// if (spacingType) {
			// 	const directions = spacingDirections.filter(type => name.includes(type));
			// 	const value = Number(attributeValue);
			// 	if (isNaN(value)) {
			// 		throw new Error("Invalid attribute value for " + name);
			// 	}
			// 	const finalDirections = (directions.length > 0 ? directions : spacingDirections);
			// 	values[spacingType].push(...finalDirections.map(direction => ({direction, value, attribute })))
			// }
		}
	
		return values;
	},
	//padding -> p
	//padding-left-right -> px
	//padding-top-bottom -> py
	//padding-left -> pl
	//padding-top -> pt
	//padding-right -> pr
	//padding-bottom -> pb
	getAttributes: (spacingValues: Record<SpacingType, SpacingValue[]>): Attribute[] => {
		const attributes: Attribute[] = [];
		for (const type in spacingValues) {
			const values = spacingValues[type as SpacingType];
			attributes.push(...values.map(value => ({id: `${type}-${value.direction}`, type: 'className', name: `${type} ${value.direction}`, value: String(value.value), reference: {id: '', isComponent: false, parentId: ''}})));
			// const sameValues = groupBy(values, 'value');
			// for (const value in sameValues) {
			// 	const sameDirection = groupBy(sameValues[Number(value)], 'direction');
			// 	const directions = Object.keys(sameDirection) as SpacingDirection[];
			// 	const directionTag: string = directions.length === 4 ? '' : `-${directions.join('-')}`;
			// 	attributes.push({name: `${type}${directionTag}`, value, });
			// }
		}

		return attributes;
	}
}

const useSpacingAttributeConverter = () => {
	return spacingConvesions;
}

interface ComponentDisplayProps {
	value: ComponentElement;
	onAttributesChange: (attributes: Attribute[]) => void;
}
const ComponentDisplay: React.FunctionComponent<ComponentDisplayProps> = ({value, onAttributesChange}) => {
	const {name, attributes} = value;
	
	return (
		<div className="hw-inline-flex hw-flex-col hw-gap-2">
			<Header level={2}>{name}</Header>
			<Header level={3}>Attributes</Header>
			{/* <SpacingDisplay attributes={attributes} onChange={onAttributesChange}/> */}
			<PropsDisplay attributes={attributes} onChange={onAttributesChange}/>
		</div>
	)
}

interface SpacingDisplayProps {
	attributes: Attribute[],
	onChange: (value: Attribute[]) => void;
}
const SpacingDisplay: React.FunctionComponent<SpacingDisplayProps> = ({attributes, onChange}) => {
	const {getSpacingValues, getAttributes} = useSpacingAttributeConverter();
	
	const spacingValues = getSpacingValues(attributes);
	const {border, padding, margin} = spacingValues;
	
	const onSpacingChange = (type: SpacingType) => (values: SpacingValue[]): void => {
		const copy = {...spacingValues};
		copy[type] = values;

		const newAttributes = getAttributes(copy);
		onChange(newAttributes);
	}
	
	const borderItemTabs: TabItem[] = [
		{
			id: 0,
			label: 'padding',
			component: <SpacingInput type='padding' values={padding} onChange={onSpacingChange('padding')}/>
		},
		{
			id: 1,
			label: 'margin',
			component: <SpacingInput type='margin' values={margin} onChange={onSpacingChange('margin')}/>
		},
		{
			id: 2,
			label: 'border',
			component: <SpacingInput type='border' values={border} onChange={onSpacingChange('border')}/>
		}
	]
	return (
		<TabButton className="hw-inline-flex hw-flex-col" items={borderItemTabs}/>
	)
}

interface PropsDisplayProps {
	attributes: Attribute[]
	onChange: (attributes: Attribute[]) => void;
}
const PropsDisplay: React.FunctionComponent<PropsDisplayProps> = ({attributes, onChange}) => {
	const onAttributeChange = (attribute: Attribute) => (value: string) => {
		const copy = attributes.slice();
		const index = copy.indexOf(attribute);
		if (index < 0) throw new Error("Cannot find attribute " + attribute.id);

		copy[index] = {...attribute, value};

		onChange(copy);
	}
	return (
		attributes.map(attribute => <Label label={attribute.name} key={attribute.id}>
			<Input value={attribute.value} onChange={onAttributeChange(attribute)}/>
		</Label>)
	)
}

interface SpacingInputProps {
	values: SpacingValue[],
	onChange: (values: SpacingValue[]) => void,
	type: SpacingType
}
const SpacingInput: React.FunctionComponent<SpacingInputProps> = ({values, onChange, type}) => {
	const [selectedDirection, setSelectedDirection] = useState<SpacingDirection>('top');
	const selectedValue = values.find(value => value.direction === selectedDirection)?.value || 0;

	const onChangeInput = (value: string) => {
		const number = value ? Number(value) : 0;
		if (isNaN(number)) return;

		const copy = [...values];
		const index = copy.findIndex(c => c.direction === selectedDirection);
		if (index > -1) {
			const copyValue = {...copy[index]};
			copyValue.value = number;
			copy[index] = copyValue;
		} else {
			copy.push({direction: selectedDirection, value: number});
		}

		onChange(copy);
	}

	
	return (
		<div className="hw-flex hw-flex-col hw-gap-2">
			<div className="hw-flex hw-flex-col hw-gap-2">
				<div className="hw-mx-auto">
					<Button mode={selectedDirection === 'top' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('top')}>
						<ArrowUpIcon className="hw-w-5 hw-h-5"/>
					</Button>
				</div>
				<div className="hw-flex hw-justify-between">
					<Button mode={selectedDirection === 'left' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('left')}>
						<ArrowLeftIcon className="hw-w-5 hw-h-5"/>
					</Button>
					<Button mode={selectedDirection === 'right' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('right')}>
						<ArrowRightIcon className="hw-w-5 hw-h-5"/>
					</Button>
				</div>
				<div className="hw-mx-auto">
					<Button mode={selectedDirection === 'bottom' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('bottom')}>
						<ArrowDownIcon className="hw-w-5 hw-h-5"/>
					</Button>
				</div>
			</div>
			<InputBlur key={selectedValue} value={selectedValue || ''} onChange={onChangeInput} className="w-full"/>
		</div>
	)
}


type Alignments = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right'
| 'bottom-left' | 'bottom-center' | 'bottom-right' 
interface AlignmentSelectorProps {
	value: Alignments, 
	onChange: (value: Alignments) => void;
	className?: string
}
const AlignmentSelector: React.FunctionComponent<AlignmentSelectorProps> = ({value, onChange, className}) => {
	const alignmentButtons: {alignment: Alignments, icon: IconComponent, attr?: string}[][] = [
		[{
			alignment: 'top-left',
			icon: Bars3BottomRight,
			attr: 'rotate-180'
		},
		{
			alignment: 'top-center',
			icon: Bars3
		},
		{
			alignment: 'top-right',
			icon: Bars3BottomLeft,
			attr: 'rotate-180'
		},],
		[{
			alignment: 'middle-left',
			icon: Bars3CenterLeft,
		},
		{
			alignment: 'middle-center',
			icon: Bars3
		},
		{
			alignment: 'middle-right',
			icon: Bars3CenterLeft,
			attr: 'rotate-180'
		},],
		[{
			alignment: 'bottom-left',
			icon: Bars3BottomLeft,
		},
		{
			alignment: 'bottom-center',
			icon: Bars3
		},
		{
			alignment: 'bottom-right',
			icon: Bars3BottomRight,
		},]
	]
	return (
		<div className={getClass('hw-inline-flex hw-flex-col hw-gap-2', className)}>
			{alignmentButtons.map((row, i) => <div key={i} className="hw-flex hw-gap-2">
				{row.map(button => <button key={button.alignment} onClick={() => onChange(button.alignment)} className={getClass('p-1 hw-bg-white rounded-md', value === button.alignment ? 'border shadow-sm hover:hw-bg-gray-50' : 'hover:hw-bg-gray-100')}>
					<button.icon className={getClass('hw-w-5 hw-h-5', button.attr)}/>
				</button>)}
			</div>)}
		</div>
	)
}

interface TreeViewItem<T = string> {
	id: T;
	content: React.ReactNode,
	items: TreeViewItem<T>[],
	selected: boolean,
}
const isSelected = <T,>(item: TreeViewItem<T>): boolean => {
	if (item.selected) return true;

	if (item.items.some(it => isSelected(it))) return true;

	return false;
}

const TreeViewItem = <T,>({item, onClick, onHover}: {item: TreeViewItem<T>, onClick: (item: TreeViewItem<T>) => void, onHover: (item: TreeViewItem<T>) => void,}) => {
	const [expand, setExpand] = useState(isSelected(item));
	const onExpand = () => {
		setExpand(!expand);
	}

	return (<>
		{item.items.length === 0 ? <li className={getClass("hw-px-2 hover:hw-bg-gray-100", item.selected ? 'hw-bg-gray-200' : '')}>
			<button onClick={() => onClick(item)} onMouseOver={() => onHover(item)}>{item.content}</button></li> : null}
			{item.items.length > 0 ? <li >
				<div className={getClass("hw-flex", item.selected ? "hw-bg-gray-200" : "")}>
				<button
					onClick={onExpand}
					role="button"
					aria-expanded="false"
					aria-controls="collapseThree"
					className="hw-flex hw-items-center hw-px-1 hover:hw-bg-gray-100 hw-rounded-md focus:hw-text-primary active:hw-text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="2.5"
						stroke="currentColor"
						className={getClass('hw-h-4 hw-w-4', expand ? 'rotate-90' : '')}>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</button>
				<button className="hw-px-1 hover:hw-bg-gray-100 hw-rounded-md" onClick={() => onClick(item)} onMouseOver={() => onHover(item)}>
					{item.content}
				</button>
				</div>
				<TreeView items={item.items} expand={expand} onClick={onClick} onHover={onHover}/>
			</li> : null}
		</>
	)
}

const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<T>[], expand?: boolean, onClick: (item: TreeViewItem<T>) => void, onHover: (item: TreeViewItem<T>) => void}) => {
	return <>
		<ul className={getClass('!hw-visible hw-ml-4', expand ? '' : 'hw-hidden')}>
			{items.map(item => <>
				<TreeViewItem key={String(item.selected)} item={item} onClick={onClick} onHover={onHover}/>
			</>)}
		</ul>
	</>
}