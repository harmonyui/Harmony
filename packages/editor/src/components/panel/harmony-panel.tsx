import { Attribute, ComponentElement } from "@harmony/ui/src/types/component"
import { Header } from "@harmony/ui/src/components/core/header";
import { Label } from "@harmony/ui/src/components/core/label";
import { Input, InputBlur } from "@harmony/ui/src/components/core/input";
import { TabButton, TabItem } from "@harmony/ui/src/components/core/tab";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, Bars3, Bars3BottomLeft, Bars3BottomRight, Bars3CenterLeft, Bars4Icon, BarsArrowDownIcon, CursorArrowRaysIcon, DocumentTextIcon, EditDocumentIcon, EyeDropperIcon, IconComponent } from "@harmony/ui/src/components/core/icons";
import { arrayOfAll, convertRgbToHex, getClass, groupBy } from "@harmony/util/src/index";
import { Fragment, useState } from "react";
import { Button } from "@harmony/ui/src/components/core/button";
import { componentIdentifier } from "../inspector/inspector";
import { Slider } from "@harmony/ui/src/components/core/slider";
import {Dropdown, DropdownItem} from "@harmony/ui/src/components/core/dropdown";
import ColorPicker from '@harmony/ui/src/components/core/color-picker';
import { HexColorSchema } from "@harmony/ui/src/types/colors";
import {useChangeArray} from '@harmony/ui/src/hooks/change-property';
import { Popover } from "@harmony/ui/src/components/core/popover";
import { Transition } from "@headlessui/react";

export type SelectMode = 'scope' | 'tweezer';

export interface HarmonyPanelProps {
	root: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onAttributesChange: (component: ComponentElement, attributes: Attribute[]) => void;
	onAttributesSave: () => void;
	onAttributesCancel: () => void;
	onComponentSelect: (component: HTMLElement) => void;
	onComponentHover: (component: HTMLElement) => void;
	mode: SelectMode;
	onModeChange: (mode: SelectMode) => void;
	scale: number;
	onScaleChange: (scale: number) => void;
	children: React.ReactNode;
}
export const HarmonyPanel: React.FunctionComponent<HarmonyPanelProps> = ({root: rootElement, selectedComponent: selectedElement, onAttributesChange, onComponentHover, onComponentSelect, mode, onModeChange, onAttributesSave, onAttributesCancel, scale, onScaleChange, children}) => {
	const selectedComponent = selectedElement ? componentIdentifier.getComponentFromElement(selectedElement) : undefined;
	const root = rootElement ? componentIdentifier.getComponentFromElement(rootElement) : undefined;


	return (
		<div className="hw-flex hw-h-full">
			<div className="hw-flex hw-flex-col">
				<img src="/harmony.ai.svg"/>
				<SidePanelToolbar/>
			</div>
			<div className="hw-flex hw-flex-col hw-divide-y hw-divide-gray-200 hw-w-full hw-h-full hw-overflow-hidden hw-rounded-lg hw-bg-white hw-shadow">
				<div className="hw-px-4 hw-py-5 sm:hw-px-6">
					<ToolbarPanel mode={mode} onModeChange={onModeChange} selectedComponent={selectedComponent} onChange={onAttributesChange} onCancel={onAttributesCancel} onSave={onAttributesSave}/>
				</div>
				<div className="hw-flex hw-w-full hw-overflow-auto hw-flex-1 hw-px-4 hw-py-5 sm:hw-p-6 hw-bg-gray-200">
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

const getTextToolsFromAttributes = (element: ComponentElement) => {
	if (!element.element) {
		throw new Error("Component must have an element");
	}

	const computed = getComputedStyle(element.element);
	const getAttr = (name: keyof CSSStyleDeclaration) => {
		return computed[name] as string;
	}
	return arrayOfAll<ComponentToolData<typeof textTools>>()([
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
}

interface ToolbarPanelProps {
	mode: SelectMode;
	onModeChange: (mode: SelectMode) => void;
	selectedComponent: ComponentElement | undefined;
	onChange: (component: ComponentElement, attributes: Attribute[]) => void;
	onSave: () => void;
	onCancel: () => void;
}
const ToolbarPanel: React.FunctionComponent<ToolbarPanelProps> = ({selectedComponent, onChange, onSave: onSaveProps, onCancel: onCancelProps}) => {
	const [isDirty, setIsDirty] = useState(false);
	const data = selectedComponent ? getTextToolsFromAttributes(selectedComponent) : undefined;
	const changeData = (values: ComponentToolData<typeof textTools>[]) => {
		if (selectedComponent === undefined || data === undefined) return;

		const attributes: Attribute[] = values.map(({name, value}) => ({id: 'className', name, value}));
		setIsDirty(true);
		selectedComponent.attributes = data.map(({name, value}) => ({id: 'className', name, value}));
		onChange(selectedComponent, attributes);
	}

	const onCancel = () => {
		setIsDirty(false);
		onCancelProps();
	}

	const onSave = () => {
		setIsDirty(false);
		onSaveProps();
	}

	return (
		<div className="hw-inline-flex hw-gap-2 hw-items-center hw-h-full hw-bg-white hw-pointer-events-auto hw-overflow-auto hw-divide-x">
			<div>
				<Header level={4}>Landing Page Changes</Header>
			</div>
			{data ? <>
				<div className="hw-px-4">
					<ComponentTools tools={textTools} components={textToolsComponents} data={data} onChange={changeData}/>
				</div>
				<div className="hw-px-4">
					<Button mode="secondary">Behavior</Button>
				</div>
			</> : null}
			{isDirty ? <div className="hw-flex hw-gap-2 hw-px-4">
				<Button onClick={onCancel} mode="secondary">Cancel</Button>
				<Button onClick={onSave}>Save</Button>
			</div> : null}
			{/* <Button className="hw-p-1" mode={mode === 'scope' ? 'primary' : 'secondary'} onClick={() => onModeChange('scope')}>
				<CursorArrowRaysIcon className="hw-w-5 hw-h-5"/>
			</Button>
			<Button className="hw-p-1" mode={mode === 'tweezer' ? 'primary' : 'secondary'} onClick={() => onModeChange('tweezer')}>
				<EyeDropperIcon className="hw-w-5 hw-h-5"/>
			</Button> */}
		</div>
	)
}

const textTools = ['font', 'fontSize', 'color', 'textAlign', 'spacing'] as const;
type TextTools = typeof textTools[number];
type ComponentTool = React.FunctionComponent<{data: string, onChange: (data: string) => void}>;

const textToolsComponents: Record<TextTools, ComponentTool> = {
	'font': ({data, onChange}) => {
		const items: DropdownItem<string>[] = [
			{
				id: 'times',
				name: 'Times New Roman'
			}
		]
		return (
			<Dropdown className="hw-w-[170px]" items={items} initialValue={data} onChange={(item) => onChange(item.id)}/>
		)
	},
	'fontSize': ({data, onChange}) => {
		return (
			<Input className="hw-w-fit" value={data} onChange={onChange}/>
		)
	},
	'color': ({data, onChange}) => {
		return (
			<ColorPicker value={HexColorSchema.parse(data)} onChange={onChange}/>
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
			<Popover button={<Button mode='none'><BarsArrowDownIcon className="hw-h-5 hw-w-5"/></Button>} container>
				<div className="hw-flex hw-flex-col hw-gap-2 hw-font-normal">
					<div className="hw-flex hw-gap-2 hw-text-sm">
						<span className="hw-w-full">Line Spacing</span>
						<Slider value={line} max={50} onChange={(value) => onChange(`${value}px-${letter}px`)}/>
						<span>{line}</span>
					</div>
					<div className="hw-flex hw-gap-2 hw-text-sm">
						<span className="hw-w-full">Line Spacing</span>
						<Slider value={letter} max={50} onChange={(value) => onChange(`${line}px-${value}px`)}/>
						<span>{letter}</span>
					</div>
				</div>
			</Popover>
		)
	}
}

type ComponentToolData<T extends readonly string[]> = {name: T[number], value: string};
interface ComponentToolsProps<T extends readonly string[]> {
	tools: T,
	components: Record<T[number], ComponentTool>,
	data: ComponentToolData<T>[],
	onChange: (data: ComponentToolData<T>[]) => void
}
const ComponentTools = <T extends readonly string[]>({tools, components, data, onChange}: ComponentToolsProps<T>) => {
	const changeProperty = useChangeArray<ComponentToolData<T>>(onChange);
	return (<div className="hw-flex hw-gap-4">
		{tools.map((tool: T[number]) => {
			const Component = components[tool] as ComponentTool;
			const index = data.findIndex(d => d.name === tool);

			const onComponentChange = (value: string): void => {
				changeProperty(data, index, 'value', value);
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
			attributes.push(...values.map(value => ({id: `${type}-${value.direction}`, name: `${type} ${value.direction}`, value: String(value.value), className: undefined})));
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