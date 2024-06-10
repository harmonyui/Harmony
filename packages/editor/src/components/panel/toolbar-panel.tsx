/* eslint-disable @typescript-eslint/no-duplicate-type-constituents -- ok*/
/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
/* eslint-disable no-constant-condition -- ok*/
/* eslint-disable no-nested-ternary -- ok*/
import type { Font } from "@harmony/util/src/fonts";
import { useMemo, useState } from "react";
import { Button } from "@harmony/ui/src/components/core/button";
import ColorPicker from "@harmony/ui/src/components/core/color-picker";
import type { DropdownItem } from "@harmony/ui/src/components/core/dropdown";
import { Dropdown } from "@harmony/ui/src/components/core/dropdown";
import { Header } from "@harmony/ui/src/components/core/header";
import { PlayIcon, XMarkIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, BarsArrowDownIcon, BorderAllIcon, CancelCircle, SolidLine, DottedLine, DashedLine, BorderIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon, DottedSquareIcon } from "@harmony/ui/src/components/core/icons";
import { InputBlur, NumberStepperInput } from "@harmony/ui/src/components/core/input";
import { Slider } from "@harmony/ui/src/components/core/slider";
import { HexColorSchema } from "@harmony/util/src/types/colors";
import { Popover } from "@harmony/ui/src/components/core/popover";
import { useEffectEvent } from "../inspector/inspector-dev";
import { selectDesignerElement, isTextElement } from "../inspector/inspector";
import { useHarmonyContext } from "../harmony-context";
import type { SelectMode } from "../harmony-context";
import type { ComponentElement } from "../inspector/component-identifier";
import { useHarmonyStore } from "../hooks/state";
import { ComponentLayoutPanel } from "./layout-panel";
import { useSidePanel } from "./side-panel";
import type { CommonTools, ComponentToolData } from "./attribute-panel";
import { ComponentAttributePanel, useComponentAttribute } from "./attribute-panel";
import { PublishButton } from "./publish-button";
export const buttonTools = ['backgroundColor', 'textAttr', 'borderAttrs'] as const;
export const textTools = ['font', 'fontSize', 'color', 'textAlign', 'spacing'] as const;
export const componentTools = ['backgroundColor', 'textAttr', 'borderAttrs'] as const;
export type TextTools = typeof textTools[number];
export type ButtonTools = typeof buttonTools[number];
export type ComponentTools = typeof componentTools[number];
export type ToolbarTools = TextTools | ButtonTools | ComponentTools



interface ToolbarPanelProps {
	mode: SelectMode;
	onModeChange: (mode: SelectMode) => void;
	toggle: boolean;
	onToggleChange: (toggle: boolean) => void;
	isDirty: boolean;
}
export const ToolbarPanel: React.FunctionComponent<ToolbarPanelProps> = ({ toggle, onToggleChange }) => {
	const { data, onAttributeChange, getAttribute } = useComponentAttribute();
	const isDemo = useHarmonyStore(state => state.isDemo);
	const pullRequest = useHarmonyStore(state => state.pullRequest);
	const currentBranch = useHarmonyStore(state => state.currentBranch);
	const selectedComponent = useHarmonyStore(state => state.selectedComponent);
	const selectedElement = selectedComponent?.element;

	const { isSaving, changeMode, fonts, onFlexToggle, onClose, isGlobal, setIsGlobal } = useHarmonyContext();
	const { setPanel } = useSidePanel();
	const { toolNames, toolComponents } = useToolbarTools({ element: selectedElement, fonts });


	const onPreview = () => {
		changeMode('preview')
	}

	const savingText = isSaving ? 'Saving...' : pullRequest ? 'Published' : null;

	// const onChangeBehavior = (behavior: BehaviorType) => (value: boolean) => {
	// 	const copy = behaviors.slice();
	// 	if (value) {
	// 		if (!copy.includes(behavior)) {
	// 			copy.push(behavior);
	// 		}
	// 	} else {
	// 		const currIndex = copy.indexOf(behavior);
	// 		if (currIndex > -1) {
	// 			copy.splice(currIndex, 1);
	// 		}
	// 	}

	// 	setBehaviors(copy);
	// }

	const onAttributeClick = () => {
		!isDemo && setPanel({ id: 'attribute', content: <ComponentAttributePanel /> });
	}

	const onLayoutClick = useEffectEvent(() => {
		!isDemo && setPanel({ id: 'layout', content: <ComponentLayoutPanel selectedComponent={selectedComponent} /> });
	});

	const onGlobalClick = () => {
		setIsGlobal(!isGlobal);
	}

	return (
		<div className="hw-inline-flex hw-gap-2 hw-items-center hw-h-full hw-w-full hw-bg-white hw-pointer-events-auto hw-divide-x">
			<div className="hw-flex hw-items-center hw-text-nowrap hw-gap-2 hw-mr-4">
				<Header className="hw-font-normal" level={3}>{currentBranch ? currentBranch.name : 'Invalid Branch'}</Header>
			</div>
			{!isDemo && true ? <div className="hw-px-4">
				<button className="hw-text-base hw-font-light" onClick={onLayoutClick}>Layout</button>
			</div> : null}
			{data ? <>
				<div className="hw-px-4">
					<ComponentTools tools={toolNames} components={toolComponents} data={data} onChange={onAttributeChange} getAttribute={getAttribute} />
				</div>
				{!isDemo ? <div className="hw-px-4">
					<button className="hw-text-base hw-font-light" onClick={onAttributeClick}>Attributes</button>
				</div> : null}
				<div className="hw-px-4">
					<button className="hw-text-base hw-font-light" onClick={onGlobalClick}>{isGlobal ? 'All' : 'Single'}</button>
				</div>
				{/* <div className="hw-px-4">
					<Popover button={<Button mode="secondary">Behavior</Button>}>
						<Label label="Dark Mode:" sameLine>
							<CheckboxInput value={behaviors.includes('dark')} onChange={onChangeBehavior('dark')}/>
						</Label>
					</Popover>
				</div> */}
				{selectedComponent?.element && selectDesignerElement(selectedComponent.element).parentElement?.dataset.harmonyFlex ? <div className="hw-px-4">
					<HotkeyLabel label="Flex" hotkey="F" value={selectDesignerElement(selectedComponent.element).parentElement!.dataset.harmonyFlex === 'true'} onToggle={onFlexToggle} />
				</div> : null}
			</> : null}
			{savingText ? <div className="hw-px-4">{savingText}</div> : null}
			<div className="hw-ml-auto" style={{ borderLeft: '0px' }}>
				{/* <ToggleSwitch value={toggle} onChange={onToggleChange} label="Designer Mode"/> */}
				<HotkeyLabel label={toggle ? 'Designer Mode' : 'Navigator Mode'} hotkey="T" onToggle={onToggleChange} value={toggle} />
			</div>
			<div className="hw-pl-4 hw-flex hw-gap-4 hw-items-center">
				<PublishButton preview />
				<button className="hw-text-[#11283B] hover:hw-text-[#11283B]/80" onClick={onPreview}>
					<PlayIcon className="hw-h-7 hw-w-7 hw-fill-white hw-stroke-none" />
				</button>
				{!isDemo ? <button className="hover:hw-fill-slate-400 hw-group" onClick={onClose}>
					<XMarkIcon className="group-hover:hw-fill-gray-500 hw-h-6 hw-w-6" />
				</button> : null}
			</div>
		</div>
	)
}

type ComponentTool = React.FunctionComponent<{ data: ComponentToolData[], onChange: (props: ComponentToolData) => void, getAttribute: (value: CommonTools, isComputed?: boolean) => string }>;

interface ComponentToolsProps {
	tools: readonly ToolbarTools[],
	components: Record<ToolbarTools, ComponentTool | undefined>,
	data: ComponentToolData[],
	onChange: (data: ComponentToolData) => void;
	getAttribute: (value: CommonTools, isComputed?: boolean) => string;
}
const ComponentTools = ({ tools, components, data, onChange, getAttribute }: ComponentToolsProps) => {
	return (<div className="hw-flex hw-gap-4 hw-items-center">
		{tools.map((tool: ToolbarTools) => {
			const Component = components[tool]
			if (!Component) return;

			return <Component key={tool} data={data} onChange={onChange} getAttribute={getAttribute} />;
		})}
	</div>)
}

interface ComponentToolComponentProps {
	ToolComponent: ComponentTool | undefined,
	data: ComponentToolData[],
	onChange: (data: ComponentToolData) => void;
	getAttribute: (value: CommonTools, isComputed?: boolean) => string
}
const ComponentToolComponent: React.FunctionComponent<ComponentToolComponentProps> = ({ ToolComponent: Component, data, onChange, getAttribute }) => {
	if (!Component) return undefined;

	return <Component data={data} onChange={onChange} getAttribute={getAttribute} />
}

const HotkeyLabel: React.FunctionComponent<{ label: string, hotkey: string, onToggle: (value: boolean) => void, value: boolean }> = ({ label, hotkey, onToggle, value }) => {
	return <button onClick={() => { onToggle(!value) }} className="hw-text-base hw-font-light">{label} <span className="hw-text-gray-400">[{hotkey}]</span></button>
}

interface ToolbarToolsProps {
	element: HTMLElement | undefined;
	fonts: Font[] | undefined;
}
const useToolbarTools = ({ element, fonts }: ToolbarToolsProps) => {
	const commonTools: Record<ToolbarTools, ComponentTool | undefined> = useMemo(() => ({
		'font': fonts ? ({ onChange, getAttribute }) => {
			const value = getAttribute('font');
			const items: DropdownItem<string>[] = fonts.map(font => ({ id: font.id, name: font.name, className: font.id }));
			return (
				<Dropdown className="hw-w-[170px] hw-h-7 !hw-rounded-[3px]" items={items} initialValue={value} onChange={(item) => { onChange({ name: 'font', value: item.id }) }} />
			)
		} : undefined,
		'fontSize': ({ onChange, getAttribute }) => {
			const value = getAttribute('fontSize');
			return (
				<NumberStepperInput key={value} value={parseInt(value)} onChange={(_value) => { onChange({ name: 'fontSize', value: `${_value}px` }) }} />
			)
		},
		'color': ({ onChange, getAttribute }) => {
			const value = getAttribute('color');
			//A black transparent looks like a white
			const _data = value === '#00000000' ? '#FFFFFF' : value
			return (
				<ColorPicker<`#${string}`> className="hw-h-7" value={HexColorSchema.parse(_data)} onChange={(_value) => { onChange({ value: _value, name: 'color' }) }} container={document.getElementById("harmony-container") || undefined} />
			)
		},
		'backgroundColor': ({ onChange, getAttribute }) => {
			const value = getAttribute('backgroundColor');
			const _data = value === '#00000000' ? '#FFFFFF' : value
			return (
				<ColorPicker<`#${string}`> className="hw-h-7" value={HexColorSchema.parse(_data)} onChange={(_value) => { onChange({ value: _value, name: 'backgroundColor' }) }} container={document.getElementById("harmony-container") || undefined} />
			)
		},
		'textAlign': ({ onChange, getAttribute }) => {
			const icons: Record<string, React.ReactNode> = {
				'left': <AlignLeftIcon className="hw-h-7 hw-w-7" />,
				'center': <AlignCenterIcon className="hw-h-7 hw-w-7" />,
				'right': <AlignRightIcon className="hw-h-7 hw-w-7" />,
				'justify': <AlignJustifyIcon className="hw-h-7 hw-w-7" />,
			};
			const value = getAttribute('textAlign');
			const data = value === 'start' ? 'left' : value === 'end' ? 'right' : value;

			const options = Object.keys(icons);

			const onClick = () => {
				const index = options.indexOf(data);
				if (index < 0) throw new Error("Invalid alignment");
				const nextIndex = index < options.length - 1 ? index + 1 : 0;
				onChange({ name: 'textAlign', value: options[nextIndex] });
			}
			const icon = icons[data];
			if (!icon) {
				<></>
			}

			return (
				<Button className="hw-h-7" mode='none' onClick={onClick}>{icon}</Button>
			)
		},
		'spacing': ({ onChange, getAttribute }) => {
			const lineAttr = getAttribute('lineHeight');
			const letterAttr = getAttribute('letterSpacing');
			const lineStr = lineAttr.replace('px', '');
			const letterStr = letterAttr.replace('px', '');
			const line = Number(lineStr);
			let letter = Number(letterStr);
			if (isNaN(letter)) {
				letter = 0;
			}

			return (
				<Popover buttonClass="hw-h-7" button={<BarsArrowDownIcon className="hw-h-7 hw-w-7" />}>
					<div className="hw-grid hw-grid-cols-6 hw-gap-2 hw-text-sm hw-items-center hw-font-normal">
						<span className="hw-col-span-2">Line Height</span>
						<Slider className="hw-col-span-3" value={line} max={50} onChange={(value) => { onChange({ name: 'lineHeight', value: `${value}px` }) }} />
						<span className="hw-col-span-1">{line}</span>
						<span className="hw-col-span-2">Letter Spacing</span>
						<Slider className="hw-col-span-3" value={letter * 5} max={50} onChange={(value) => { onChange({ name: 'letterSpacing', value: `${value / 5}px` }) }} />
						<span className="hw-col-span-1">{letter * 5}</span>
					</div>
				</Popover>
			)
		},
		'textAttr': ({ data, onChange, getAttribute }) => {
			return (
				<Popover button={<button className="hw-text-base hw-font-light">Text</button>}>
					<div className="hw-flex hw-flex-col hw-gap-2">
						<div className="hw-flex hw-justify-around">
							<ComponentToolComponent ToolComponent={commonTools.color} data={data} onChange={onChange} getAttribute={getAttribute} />
							<ComponentToolComponent ToolComponent={commonTools.fontSize} data={data} onChange={onChange} getAttribute={getAttribute} />
						</div>
						<ComponentToolComponent ToolComponent={commonTools.font} data={data} onChange={onChange} getAttribute={getAttribute} />
					</div>
				</Popover>
			)
		},
		'borderAttrs': ({ data, onChange, getAttribute }) => {
			const borderAttr = getAttribute('borderWidth');
			const borderAttrRadius = getAttribute('borderRadius');
			const borderStr = borderAttr.replace('px', '');
			const borderRadiusStr = borderAttrRadius.replace('px', '');

			const borderWidth = borderStr.split(" ").map((item) => parseInt(item.trim()));
			if (borderWidth.length === 1) borderWidth.push(borderWidth[0], borderWidth[0], borderWidth[0]);
			if (borderWidth.length === 2) borderWidth.push(borderWidth[0], borderWidth[1]);
			if (borderWidth.length === 3) borderWidth.push(borderWidth[1]);
			const borderRadius = Number(borderRadiusStr);

			let value = getAttribute('borderColor')
			const _data = value === '#00000000' ? '#FFFFFF' : value
			const borderStyles: DropdownItem<string>[] = [
				{
					id: 'none',
					name: 'None',
				},
				{
					id: 'solid',
					name: 'Solid',
				},
				{
					id: 'dotted',
					name: 'Dotted',
				},
				{
					id: 'dashed',
					name: 'Dashed',
				},
			]

			function updateBorderWidth(type: string, value: number) {
				if (type === 'T') {
					onChange({ name: 'borderWidth', value: `${value}px ${borderWidth[1]}px ${borderWidth[2]}px ${borderWidth[3]}px` })
				} else if (type === 'R') {
					onChange({ name: 'borderWidth', value: `${borderWidth[0]}px ${value}px ${borderWidth[2]}px ${borderWidth[3]}px` })
				} else if (type === 'B') {
					onChange({ name: 'borderWidth', value: `${borderWidth[0]}px ${borderWidth[1]}px ${value}px ${borderWidth[3]}px` })
				} else if (type === 'L') {
					onChange({ name: 'borderWidth', value: `${borderWidth[0]}px ${borderWidth[1]}px ${borderWidth[2]}px ${value}px` })
				}
			}

			return (
				<Popover buttonClass="hw-h-[25.76px]" button={<BorderIcon className="hw-h-[25.76px] hw-w-[25.76px]" />}>
					<div className="hw-flex hw-flex-col hw-gap-3 hw-w-[350px] hw-p-2">
						<div className="hw-flex hw-flex-row hw-justify-between hw-border-b hw-border-gray-200 hw-py-4">
							<p className="hw-font-bold">Border</p>
							<p className="hw-font-bold hw-cursor-pointer">X</p>
						</div>
						{/* Border Color  */}
						<div className="hw-grid hw-grid-cols-3 hw-items-center hw-justify-center">
							<p>Color</p>
							<div className="hw-col-span-2 hw-flex hw-flex-row hw-p-2 hw-items-center hw-w-full hw-space-x-3 hw-border hw-border-gray-200 hw-rounded-md hw-h-12">
								<ColorPicker<`#${string}`> className="hw-h-7 hw-z-50" value={HexColorSchema.parse(_data)} onChange={(_value) => { onChange({ value: _value, name: 'borderColor' }) }} container={document.getElementById("harmony-container") || undefined} />
								<p className="hw-uppercase  hw-text-lg">{_data}</p>
							</div>
						</div>
						{/* Borer Width */}
						<div className="hw-grid hw-grid-cols-3 hw-items-center hw-justify-center">
							<p>Width</p>
							<div className="hw-grid hw-grid-cols-2 hw-col-span-2 hw-gap-1">
								<InputBlur className="hw-border hw-border-gray-200 hw-rounded-md hw-w-full hw-text-center hw-h-12" value={borderWidth[0].toFixed(0)} onChange={(value) => { onChange({ name: 'borderWidth', value: `${value}px` }) }} />
								<div className="hw-border hw-border-gray-200 hw-rounded-md hw-flex hw-flex-row hw-items-center hw-justify-center hw-space-x-2 hw-h-12">
									<div className='hw-cursor-pointer hw-p-2 hw-rounded-md' >
										<SquareIcon className='hw-size-8' />
									</div>
									<div className='hw-cursor-pointer hw-p-2 hw-rounded-md'>
										<DottedSquareIcon className='hw-size-8' />
									</div>
								</div>
							</div>
							{/* <Slider value={borderWidth} max={50} onChange={(value) => { onChange({ name: 'borderWidth', value: `${value}px` }) }} /> */}
						</div>
						<div className="hw-grid hw-grid-cols-3 hw-items-center hw-justify-center">
							<div className='hw-col-start-2 hw-col-span-2 hw-grid hw-grid-cols-4 hw-gap-1'>
								<div className="hw-flex hw-flex-col hw-items-center hw-justify-center">
									<InputBlur className="hw-p-4 hw-w-full hw-h-12 hw-border hw-border-gray-200 hw-rounded-tl-md hw-rounded-bl-md" value={borderWidth[0]} onChange={
										(value) => updateBorderWidth('T', parseInt(value))
									} />
									<p className="hw-mt-2">T</p>
								</div>
								<div className="hw-flex hw-flex-col hw-items-center hw-justify-center">
									<InputBlur className="hw-p-4 hw-w-full hw-h-12 hw-border hw-border-gray-200" value={borderWidth[1]} onChange={
										(value) => updateBorderWidth('R', parseInt(value))
									} />
									<p className="hw-mt-2">R</p>
								</div>
								<div className="hw-flex hw-flex-col hw-items-center hw-justify-center">
									<InputBlur className="hw-p-4 hw-w-full hw-h-12 hw-border hw-border-gray-200" value={borderWidth[2]} onChange={
										(value) => updateBorderWidth('B', parseInt(value))
									} />
									<p className="hw-mt-2">B</p>
								</div>
								<div className="hw-flex hw-flex-col hw-items-center hw-justify-center">
									<InputBlur className="hw-p-4 hw-w-full hw-h-12 hw-border hw-border-gray-200 hw-rounded-tr-md hw-rounded-br-md" value={borderWidth[3]} onChange={
										(value) => updateBorderWidth('L', parseInt(value))
									} />
									<p className="hw-mt-2">L</p>
								</div>
							</div>
						</div>
						<div className="hw-grid hw-grid-cols-3 hw-items-center hw-justify-center">
							<p>Style</p>
							<div className="hw-col-span-2">
								<Dropdown className="hw-w-full hw-h-12 !hw-rounded-md hw-p-2" items={borderStyles} initialValue={getAttribute('borderStyle')} onChange={(item) => { onChange({ name: 'borderStyle', value: item.id }) }} />
							</div>
						</div>
					</div>
				</Popover>
			)
		}
	}), [fonts]);

	const toolNames: readonly ToolbarTools[] = useMemo(() => {
		if (!element) return [] as ToolbarTools[];

		if (isTextElement(element)) {
			return textTools;
		}

		if (element.tagName.toLowerCase() === 'button') {
			return buttonTools;
		}

		return componentTools;
	}, [element]);

	const toolComponents = useMemo(() => toolNames.reduce<Record<string, ComponentTool | undefined>>((prev, curr) => { prev[curr] = commonTools[curr]; return prev }, {}), [toolNames, commonTools]);

	return { toolComponents, toolNames, allToolComponents: commonTools };
}