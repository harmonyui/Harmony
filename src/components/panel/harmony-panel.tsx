import { Attribute, ComponentElement } from "@harmony/types/component"
import { createPortal } from "react-dom"
import { Header } from "@harmony/components/core/header";
import { Label } from "@harmony/components/core/label";
import { Input } from "../core/input";
import { TabButton, TabItem } from "../core/tab";
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, Bars3, Bars3BottomLeft, Bars3BottomRight, Bars3CenterLeft, CursorArrowRaysIcon, EyeDropperIcon, IconComponent } from "../core/icons";
import { getClass, groupBy } from "@harmony/utils/util";
import { useState } from "react";
import { Button } from "../core/button";

export interface HarmonyPanelProps {
	root: ComponentElement | undefined;
	selectedComponent: ComponentElement | undefined;
	onAttributesChange: (attributes: Attribute[]) => void;
	onComponentSelect: (component: ComponentElement) => void;
	onComponentHover: (component: ComponentElement) => void;
}
export const HarmonyPanel: React.FunctionComponent<HarmonyPanelProps> = ({root, selectedComponent, onAttributesChange, onComponentHover, onComponentSelect}) => {
	return (<>
		{createPortal(<div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[10000000]">
			<ToolbarPanel/>
			<div className="text-center">
				
			</div>
			<AttributePanel root={root} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onComponentHover={onComponentHover} onComponentSelect={onComponentSelect}/>
		</div>, document.body)}
		</>
	)
}

interface ToolbarPanelProps {

}
const ToolbarPanel: React.FunctionComponent<ToolbarPanelProps> = ({}) => {
	return (
		<div className="absolute left-0 inline-flex flex-col gap-2 h-full border border-gray-200 p-4 bg-white pointer-events-auto overflow-auto">
			<Button className="p-1" mode='secondary'>
				<CursorArrowRaysIcon className="w-5 h-5"/>
			</Button>
			<Button className="p-1" mode='secondary'>
				<EyeDropperIcon className="w-5 h-5"/>
			</Button>
		</div>
	)
}

interface AttributePanelProps {
	selectedComponent: ComponentElement | undefined;
	onAttributesChange: (attributes: Attribute[]) => void;
	root: ComponentElement | undefined;
	onComponentSelect: (component: ComponentElement) => void;
	onComponentHover: (component: ComponentElement) => void;
}
const AttributePanel: React.FunctionComponent<AttributePanelProps> = ({root, selectedComponent, onAttributesChange, onComponentHover, onComponentSelect}) => {
	const getTreeItems = (children: ComponentElement[]): TreeViewItem<ComponentElement>[] => {
		return children.map<TreeViewItem<ComponentElement>>(child => ({
			id: child,
			content: child.name,
			items: getTreeItems(child.children),
			selected: selectedComponent?.element === child.element
		}))
	}
	const treeItems: TreeViewItem<ComponentElement>[] = root ? getTreeItems([root]) : []
	
	return (
		<div className="absolute right-0 flex flex-col h-full border border-gray-200 p-4 bg-white pointer-events-auto min-w-[400px] overflow-auto">
			<div className="flex-1">
				{selectedComponent ? <ComponentDisplay value={selectedComponent} onAttributesChange={onAttributesChange}/> : null}
			</div>
			<div className="flex-1">
				<TreeView items={treeItems} expand={true} onClick={(item) => onComponentSelect(item.id)} onHover={(item) => onComponentHover(item.id)}/>
				{/* {rootFiber ? <ComponentTree node={rootFiber} expand={true} onHover={onFiberHover} onClick={onFiberClick}/> : null} */}
			</div>
		</div>
	)
}

const useSpacingAttributeConverter = () => {
	return {
		getSpacingValues: (attributes: Attribute[]): Record<SpacingType, SpacingValue[]> => {
			const values: Record<SpacingType, SpacingValue[]> = {'border': [], 'padding': [], 'margin': []};
			for (const {name, value: attributeValue} of attributes) {
				const spacingType = spacingTypes.find(type => name.includes(type));
				if (spacingType) {
					const directions = spacingDirections.filter(type => name.includes(type));
					const value = Number(attributeValue);
					if (isNaN(value)) {
						throw new Error("Invalid attribute value for " + name);
					}
					const finalDirections = (directions.length > 0 ? directions : spacingDirections);
					values[spacingType].push(...finalDirections.map(direction => ({direction, value})))
				}
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
				const sameValues = groupBy(values, 'value');
				for (const value in sameValues) {
					const sameDirection = groupBy(sameValues[Number(value)], 'direction');
					const directions = Object.keys(sameDirection) as SpacingDirection[];
					const directionTag: string = directions.length === 4 ? '' : `-${directions.join('-')}`;
					attributes.push({name: `${type}${directionTag}`, value});
				}
			}

			return attributes;
		}
	}
}

interface ComponentDisplayProps {
	value: ComponentElement;
	onAttributesChange: (attributes: Attribute[]) => void;
}
const ComponentDisplay: React.FunctionComponent<ComponentDisplayProps> = ({value, onAttributesChange}) => {
	const {name, attributes} = value;
	const {getSpacingValues, getAttributes} = useSpacingAttributeConverter();
	
	const spacingValues = getSpacingValues(attributes);
	const {border, padding, margin} = spacingValues;
	
	const onSpacingChange = (type: SpacingType) => (values: SpacingValue[]): void => {
		const copy = {...spacingValues};
		copy[type] = values;

		const newAttributes = getAttributes(copy);
		onAttributesChange(newAttributes);
	}
	
	const borderItemTabs: TabItem[] = [
		{
			id: 0,
			label: 'padding',
			component: <SpacingInput values={padding} onChange={onSpacingChange('padding')}/>
		},
		{
			id: 1,
			label: 'margin',
			component: <SpacingInput values={margin} onChange={onSpacingChange('margin')}/>
		},
		{
			id: 2,
			label: 'border',
			component: <SpacingInput values={border} onChange={onSpacingChange('border')}/>
		}
	]
	return (
		<div className="inline-flex flex-col gap-2">
			<Header level={2}>{name}</Header>
			<Header level={3}>Attributes</Header>
			<TabButton className="inline-flex flex-col" items={borderItemTabs}/>
			<PropsDisplay attributes={attributes}/>
		</div>
	)
}

interface PropsDisplayProps {
	attributes: Attribute[]
}
const PropsDisplay: React.FunctionComponent<PropsDisplayProps> = ({attributes}) => {
	return (
		attributes.map(attribute => <Label label={attribute.name} key={attribute.name}>
			<Input value={attribute.value} onChange={() => undefined}/>
		</Label>)
	)
}

const spacingTypes = ['padding', 'margin', 'border'] as const;
const spacingDirections = ['top', 'left', 'right', 'bottom'] as const;
type SpacingType = typeof spacingTypes[number]
type SpacingDirection = typeof spacingDirections[number];
interface SpacingValue {
	direction: SpacingDirection, 
	value: number
}
interface SpacingInputProps {
	values: SpacingValue[],
	onChange: (values: SpacingValue[]) => void
}
const SpacingInput: React.FunctionComponent<SpacingInputProps> = ({values, onChange}) => {
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
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-2">
				<div className="mx-auto">
					<Button mode={selectedDirection === 'top' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('top')}>
						<ArrowUpIcon className="w-5 h-5"/>
					</Button>
				</div>
				<div className="flex justify-between">
					<Button mode={selectedDirection === 'left' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('left')}>
						<ArrowLeftIcon className="w-5 h-5"/>
					</Button>
					<Button mode={selectedDirection === 'right' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('right')}>
						<ArrowRightIcon className="w-5 h-5"/>
					</Button>
				</div>
				<div className="mx-auto">
					<Button mode={selectedDirection === 'bottom' ? 'primary' : 'secondary'} onClick={() => setSelectedDirection('bottom')}>
						<ArrowDownIcon className="w-5 h-5"/>
					</Button>
				</div>
			</div>
			<Input value={selectedValue || ''} onChange={onChangeInput} className="w-full"/>
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
		<div className={getClass('inline-flex flex-col gap-2', className)}>
			{alignmentButtons.map((row, i) => <div key={i} className="flex gap-2">
				{row.map(button => <button key={button.alignment} onClick={() => onChange(button.alignment)} className={getClass('p-1 bg-white rounded-md', value === button.alignment ? 'border shadow-sm hover:bg-gray-50' : 'hover:bg-gray-100')}>
					<button.icon className={getClass('w-5 h-5', button.attr)}/>
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
		{item.items.length === 0 ? <li className={getClass("px-2 hover:bg-gray-100", item.selected ? 'bg-gray-200' : '')}>
			<button onClick={() => onClick(item)} onMouseOver={() => onHover(item)}>{item.content}</button></li> : null}
			{item.items.length > 0 ? <li >
				<div className={getClass("flex", item.selected ? "bg-gray-200" : "")}>
				<button
					onClick={onExpand}
					role="button"
					aria-expanded="false"
					aria-controls="collapseThree"
					className="flex items-center px-1 hover:bg-gray-100 rounded-md focus:text-primary active:text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2.5"
						stroke="currentColor"
						className={getClass('h-4 w-4', expand ? 'rotate-90' : '')}>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</button>
				<button className="px-1 hover:bg-gray-100 rounded-md" onClick={() => onClick(item)} onMouseOver={() => onHover(item)}>
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
		<ul className={getClass('!visible ml-4', expand ? '' : 'hidden')}>
			{items.map(item => <>
				<TreeViewItem key={String(item.selected)} item={item} onClick={onClick} onHover={onHover}/>
			</>)}
		</ul>
	</>
}