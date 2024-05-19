/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
/* eslint-disable @typescript-eslint/no-duplicate-type-constituents -- ok*/
/* eslint-disable @typescript-eslint/no-confusing-void-expression -- ok*/
/* eslint-disable @typescript-eslint/no-empty-interface -- ok*/
/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import { Button } from "@harmony/ui/src/components/core/button";
import type { DropdownItem } from "@harmony/ui/src/components/core/dropdown";
import { Dropdown } from "@harmony/ui/src/components/core/dropdown";
import { CheckboxInput, InputBlur } from "@harmony/ui/src/components/core/input";
import type { ComponentElement } from "@harmony/util/src/types/component";
import { camelToKebab, capitalizeFirstLetter, constArray, convertRgbToHex } from "@harmony/util/src/utils/common";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { Font } from "@harmony/util/src/fonts";
import type { ComponentUpdateWithoutGlobal } from "../harmony-context";
import { useHarmonyContext  } from "../harmony-context";
import { getComputedValue } from "../snapping/position-updator";
import { isDesignerElementSelectable, overlayStyles } from "../inspector/inspector";

export const attributeTools = ['font', 'fontSize', 'textAlign',
                        'display', 'justifyContent', 'alignItems', 'flexDirection', 'rowGap', 'columnGap', 'gap', 'flexWrap', 'flexGrow', 'flexShrink',
						'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow',
						'position', 'top', 'left', 'right', 'bottom', 'letterSpacing', 'lineHeight', 'marginRight', 'marginLeft', 'marginTop', 'marginBottom', 
                        'paddingRight', 'paddingLeft', 'paddingTop', 'paddingBottom', 'width', 'height'] as const;
const colorTools = ['color', 'backgroundColor'] as const;
type AttributeTools = typeof attributeTools[number];
type ColorTools = typeof colorTools[number]; 
export type CommonTools = AttributeTools | ColorTools;
export interface ComponentToolData {name: CommonTools, value: string};

interface ComponentAttributeContextProps {
    selectedComponent: HTMLElement | undefined;
    onAttributeChange: (value: {name: string, value: string}) => void;
    data: ReturnType<typeof getTextToolsFromAttributes> | undefined;
    getAttribute: (value: CommonTools, isComputed?: boolean) => string;
}
const ComponentAttributeContext = createContext<ComponentAttributeContextProps>({selectedComponent: {} as HTMLElement, onAttributeChange: () => undefined, data: [], getAttribute: () => ''});
type ComponentAttributeProviderProps = ComponentAttributePanelProps & {
    selectedComponent: ComponentElement | undefined;
    children: React.ReactNode, 
    onChange: (update: ComponentUpdateWithoutGlobal[]) => void;
}
export const ComponentAttributeProvider: React.FunctionComponent<ComponentAttributeProviderProps> = ({selectedComponent, children, onChange}) => {
    const {fonts} = useHarmonyContext();
    const data = useMemo(() => selectedComponent ? getTextToolsFromAttributes(selectedComponent, fonts) : undefined, [selectedComponent, fonts]);
    
    const onAttributeChange = (values: {name: string, value: string}) => {
		if (!data || !selectedComponent) return;

		const old = data.find(t => t.name === values.name);
		if (!old) throw new Error("Cannot find old property");
		const oldValue = old.value;
		const childIndex = Array.from(old.element.parentElement!.children).indexOf(old.element);
		if (childIndex < 0) throw new Error("Cannot get right child index");
        const componentId = old.element.dataset.harmonyId;
		if (!componentId) {
            throw new Error("Element does not have a data id");
        }

		const update: ComponentUpdateWithoutGlobal = {componentId, type: 'className', action: 'add', name: values.name, value: values.value, oldValue, childIndex};
		
		
		onChange([update]);
	}

    const selectedElement = selectedComponent?.element;

    const getAttribute = useCallback((attribute: CommonTools, isComputed=false): string => {
        if (isComputed && selectedElement) {
            return getComputedValue(selectedElement, camelToKebab(attribute));
        }
        if (data) {
            const value = data.find(d => d.name === attribute);
            if (value) {
                return value.value;
            }
        }

        return '';
    }, [data, selectedElement]);
    
    return (
        <ComponentAttributeContext.Provider value={{selectedComponent: selectedComponent?.element, onAttributeChange, data, getAttribute}}>
            {children}
        </ComponentAttributeContext.Provider>
    )
}

export const getTextToolsFromAttributes = (element: ComponentElement, fonts: Font[] | undefined) => {
	if (!element.element) {
		throw new Error("Component must have an element");
	}

	
	const allStyles: [HTMLElement, Record<string, string>][] = [];

	const getComputed = (name: keyof CSSStyleDeclaration) => {
		let selectedElement = element.element;
		let value: string | undefined;

		function find(style: [HTMLElement, Record<string, string>]) {
			return style[0] === selectedElement;
		}

		while (selectedElement && !value) {
			let styles = allStyles.find(find);
			if (!styles) {
				const newStyles: [HTMLElement, Record<string, string>] = [selectedElement, getAppliedComputedStyles(selectedElement)]
				allStyles.push(newStyles);
				styles = newStyles
			}
			value = styles[1][camelToKebab(name as string)];
			if (value) {
				break;
			}
			selectedElement = isDesignerElementSelectable(selectedElement.parentElement) ? selectedElement.parentElement : undefined;
		}
		if (!selectedElement) {
			selectedElement = element.element!;
			value = allStyles.find(style => style[0] === element.element!)?.[1][name as string] || getComputedValue(element.element!, camelToKebab(name as string));
		}
		return {value: value!, element: selectedElement};
	}

	const getAttr = (name: keyof CSSStyleDeclaration): {value: string, element: HTMLElement} => {
		const computed = getComputed(name);
			
		if (name === 'font') {
			if (!fonts) {
				//console.log("No fonts");
				return {element: element.element!, value: ''};
			}
			const font = fonts.find(f => element.element!.classList.contains(f.id) || computed.value.toLowerCase().includes(f.name.toLowerCase()));

			if (font) return {element: element.element!, value: font.id};

			return computed;
		}
		return computed;
	}

	const getColor = (name: 'color' | 'backgroundColor') => {
		const color = getAttr(name);

		return {
			value: convertRgbToHex(color.value),
			element: color.element
		}
	}
    const all = constArray<ComponentToolData>()([
		...attributeTools.map(prop => ({name: prop, ...getAttr(prop)})),
        ...colorTools.map(prop => ({name: prop, ...getColor(prop)}))
	]);

	return all;
}

function getAppliedComputedStyles(element: HTMLElement, pseudo?: string | null) {
	const styles = window.getComputedStyle(element, pseudo)
	const inlineStyles = element.getAttribute('style')

	const retval: Record<string, string> = {}
	for (let i = 0; i < styles.length; i++) {
		const key = styles[i]
		const value = styles.getPropertyValue(key)

		element.style.setProperty(key, 'unset')

		const unsetValue = styles.getPropertyValue(key)

		if (inlineStyles)
			element.setAttribute('style', inlineStyles)
		else
			element.removeAttribute('style')

		if (unsetValue !== value)
			retval[key] = value
	}

	return retval
}

export const useComponentAttribute = () => {
    return useContext(ComponentAttributeContext);
}

interface ComponentAttributePanelProps {
}
export const ComponentAttributePanel: React.FunctionComponent<ComponentAttributePanelProps> = () => {
	return (
        <div className="hw-flex hw-flex-col hw-divide-y-2 hw-max-w-[300px]">
            <Section>
                <EditSpacing spacing="margin"/>
                <EditSpacing spacing="padding"/>
                <EditSize size='width'/>
                <EditSize size='height'/>
            </Section>
            <Section>
                <EditDisplay/>
            </Section>
            <Section>
                <EditPosition/>
            </Section>
        </div>
	)
}

const Section: React.FunctionComponent<{children: React.ReactNode}> = ({children}) => {
    return (
        <div className="hw-flex hw-flex-col hw-gap-2 hw-py-4 hw-px-4">
            {children}
        </div>
    )
}

type Unit = 'px' | 'percent';
interface EditUnitProps {
    units: Unit[]
}
const EditUnit: React.FunctionComponent<EditUnitProps> = ({units}) => {
    const unitLabels: Record<Unit, string> = {
        'percent': '%',
        'px': 'PX'
    }
    return (
        <div className="hw-flex hw-gap-1 hw-text-xs">
            {units.map(unit => <button key={unit} className="hover:hw-text-gray-900 hw-text-gray-500">{unitLabels[unit]}</button>)}
        </div>
    )
}

interface EditAttributeProps {
    label: string;
    children?: React.ReactNode;
    sameLine: React.ReactNode;
    color?: string;
}
const EditAttribute: React.FunctionComponent<EditAttributeProps> = ({label, sameLine, children, color}) => {
    return (
        <div className="hw-flex hw-flex-col hw-gap-1" style={{backgroundColor: color}}>
            <div className="hw-flex hw-justify-between hw-items-center">
                <label className="hw-block hw-text-sm hw-font-medium hw-leading-6 hw-text-gray-900">{label}</label>
                {sameLine}
            </div>
            {children}
        </div>
    )
}

const sides = ['Top', 'Bottom', 'Left', 'Right'] as const;
type Side = typeof sides[number];

interface EditSpacingProps {
    spacing: 'margin' | 'padding'
}
const EditSpacing: React.FunctionComponent<EditSpacingProps> = ({spacing}) => {
    const {onAttributeChange, getAttribute} = useComponentAttribute();

    const onChange = (side: `${typeof spacing}${Side}`) => (value: string) => onAttributeChange({name: side, value});

    const color = spacing === 'margin' ? overlayStyles.margin : overlayStyles.padding;
    
    return (
        <EditAttribute label={capitalizeFirstLetter(spacing)} sameLine={<EditUnit units={['px', 'percent']}/>} color={color}>
            <div className="hw-flex hw-gap-1 hw-text-xs hw-text-gray-400">
                {sides.map(side => <div key={side} className="hw-flex-1">
                    <InputBlur className="hw-w-full" value={getAttribute(`${spacing}${side}`)} onChange={onChange(`${spacing}${side}`)}/>
                    <div>{side}</div>
                </div>)}
            </div>
        </EditAttribute>
    )
}

type Displays = 'block' | 'inline' | 'flex' | 'grid';
const EditDisplay: React.FunctionComponent = () => {
    const {getAttribute, selectedComponent} = useComponentAttribute();
    const items: DropdownItem<Displays>[] = [
        {
            id: 'block',
            name: 'Block'
        },
        {
            id: 'inline',
            name: 'Inline'
        },
        {
            id: 'flex',
            name: 'Flex'
        },
        {
            id: 'grid',
            name: 'Grid'
        }
    ];

    const getComponent = (_display: Displays): React.ReactNode => {
        const components: Record<Displays, React.ReactNode> = {
            block: <></>,
            inline: <></>,
            flex: <EditFlexAttributes/>,
            grid: <EditGridAttributes/>
        }

        const component = components[initialValue];

        if (selectedComponent?.parentElement && getComputedStyle(selectedComponent.parentElement).display === 'grid') {
            return <>
                <EditGridChildAttributes/>
                {component}
            </>
        }

        return component;
    }

    

    // const onChange = (item: DropdownItem<string>) => {
    //     onAttributeChange({name: 'display', value: item.id});
    // }

    const display = getAttribute('display');
    const initialValue: Displays = items.find(item => item.id === display) ? display as Displays : 'block';

    const component = getComponent(initialValue);
    return (<>
        {/* <EditAttribute label="Display" sameLine={<Dropdown initialValue={initialValue} items={items} onChange={onChange} container={document.getElementById('harmony-container') || undefined}/>}/> */}
        {component}
    </>)
}

interface EditSizeProps {
    size: 'width' | 'height';
}
const EditSize: React.FunctionComponent<EditSizeProps> = ({size}) => {
    const {getAttribute, onAttributeChange} = useComponentAttribute();
    const onChange = (value: string) => onAttributeChange({name: size, value})

    return (
        <EditAttribute label={capitalizeFirstLetter(size)} sameLine={<EditUnit units={['px', 'percent']}/>}>
            <InputBlur className="hw-w-full" value={getAttribute(size)} onChange={onChange}/>
        </EditAttribute>
    )
}

const justifyValues = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] as const;
const alignValues = ['flex-start', 'flex-end', 'center'] as const;
const directionValues = ['row', 'column'] as const;

const EditFlexAttributes: React.FunctionComponent = () => {
    const {getAttribute, onAttributeChange} = useComponentAttribute();
    const getLabel = (value: string): string => {
        const split = value.split('-');
        if (split.length > 1) {
            return capitalizeFirstLetter(split[1]);
        }

        return capitalizeFirstLetter(split[0]);
    }

    const getMode = (name: CommonTools) => (value: string) => {
        const attr = getAttribute(name)
        return attr === value || attr === 'normal' && value === 'flex-start' ? 'primary' : 'secondary'
    }

    const onClick = (name: CommonTools, value: string) => () => onAttributeChange({name, value})

    const onChange = (name: CommonTools) => (value: string) => onAttributeChange({name, value});

    const direction = getAttribute('flexDirection') as typeof directionValues[number];
    const gapDirection = direction === 'row' ? 'columnGap' : 'rowGap';
    // const gapX = getAttribute('columnGap');
    // const gapY = getAttribute('rowGap');
    const gap = getAttribute(gapDirection);
    const wrap = getAttribute('flexWrap');
    const grow = getAttribute('flexGrow');
    const shrink = getAttribute('flexShrink');

    return (<>
        <EditAttribute label="Flex" sameLine={undefined}>
            <div className="hw-flex hw-gap-1 hw-items-center hw-flex-wrap">
                {justifyValues.map(value => <Button key={value} className="hw-text-xs" mode={getMode('justifyContent')(value)} onClick={onClick('justifyContent', value)}>{getLabel(value)}</Button>)}
            </div>
        </EditAttribute>
        <EditAttribute label="Align Items" sameLine={undefined}>
            <div className="hw-flex hw-gap-1 hw-items-center">
                {alignValues.map(value => <Button key={value} className="hw-text-xs" mode={getMode('alignItems')(value)} onClick={onClick('alignItems', value)}>{getLabel(value)}</Button>)}
            </div>
        </EditAttribute>
        <EditAttribute label="Direction" sameLine={undefined}>
            <div className="hw-flex hw-gap-1 hw-items-center">
                {directionValues.map(value => <Button key={value} className="hw-text-xs" mode={getMode('flexDirection')(value)} onClick={onClick('flexDirection', value)}>{getLabel(value)}</Button>)}
            </div>
        </EditAttribute>
        <EditAttribute label="Gap" sameLine={<EditUnit units={['px']}/>}>
            <InputBlur value={gap === 'normal' ? '0px' : gap} onChange={onChange(gapDirection)}/>
        </EditAttribute>
        <EditAttribute label="Wrap" sameLine={<CheckboxInput value={wrap === 'wrap'} onChange={(value) => onAttributeChange({name: 'flexWrap', value: value ? 'wrap' : 'nowrap'})}/>}/>
        <EditAttribute label="Size" sameLine={undefined}>
            <div className="hw-flex hw-gap-1 hw-items-center">
                <Button className="hw-text-xs" mode={grow === '1' ? 'primary' : 'secondary'} onClick={() => onAttributeChange({name: 'flexGrow', value: grow === '1' ? '0' : '1'})}>Grow</Button>
                <Button className="hw-text-xs" mode={shrink === '1' ? 'primary' : 'secondary'} onClick={() => onAttributeChange({name: 'flexShrink', value: shrink === '1' ? '0' : '1'})}>Shrink</Button>
            </div>
        </EditAttribute>
    </>)
}

const EditGridAttributes: React.FunctionComponent = () => {
    const {getAttribute, onAttributeChange, } = useComponentAttribute();
    
    const getNumRowCols = (property: 'gridTemplateColumns' | 'gridTemplateRows') => {
        const value = getAttribute(property, true);
        const match = /repeat\((\d+), minmax\(0px, 1fr\)\)/.exec(value);
        if (!match) {
            return '';
        }

        const num = match[1];

        return num;
        // const gridValues = value.split(' ');

        // //Value is a space limited pixel length of each number of column (ex. 142px 142px 142px). This property is assuming
        // //that each column is the same size, so if it isn't then we don't do anything with it
        // const everyValueIsTheSame = gridValues.every(val => !gridValues.find(val2 => !close(parseFloat(val2), parseFloat(val), 0.1)))
        // if (everyValueIsTheSame) {
        //     return String(gridValues.length);
        // }

        // return '';
    }

    const onChange = (name: 'gridTemplateColumns' | 'gridTemplateRows' | 'rowGap' | 'columnGap') => (value: string): void => {
        const repeat = value ? `repeat(${value}, minmax(0px, 1fr))` : 'none';
        onAttributeChange({name, value: repeat});
    }

    const cols = getNumRowCols('gridTemplateColumns');
    const rows = getNumRowCols('gridTemplateRows');
    const gapX = getAttribute('rowGap');
    const gapY = getAttribute('columnGap');

    return (<>
        <EditAttribute label="Num Columns" sameLine={<InputBlur className="hw-w-1/4" value={cols} onChange={onChange('gridTemplateColumns')}/>}></EditAttribute>
        <EditAttribute label="Num Rows" sameLine={<InputBlur className="hw-w-1/4" value={rows} onChange={onChange('gridTemplateRows')}/>}></EditAttribute>
        <EditAttribute label="Gap" sameLine={<EditUnit units={['px']}/>}>
            <div className="hw-flex hw-gap-1 hw-text-xs hw-text-gray-400">
                <div className="hw-flex-1">
                    <InputBlur className="hw-w-full" value={gapX} onChange={(value) => onAttributeChange({name: 'rowGap', value})}/>
                    <div>Row</div>
                </div>
                <div className="hw-flex-1">
                    <InputBlur className="hw-w-full" value={gapY} onChange={(value) => onAttributeChange({name: 'columnGap', value})}/>
                    <div>Column</div>
                </div>
            </div>
        </EditAttribute>
    </>)
}

const EditGridChildAttributes: React.FunctionComponent = () => {
    const {getAttribute, onAttributeChange} = useComponentAttribute();

    const getSpan = (property: 'gridColumn' | 'gridRow') => {
        const value = getAttribute(property);
        const match = /span (\d+) \/ span (\d+)/.exec(value);
        if (!match) {
            return '';
        }

        const num1 = match[1];
        const num2 = match[2];
        if (num1 !== num2) {
            return '';
        }

       return num1;
    }

    const onChange = (name: 'gridColumn' | 'gridRow') => (value: string): void => {
        const span = `span ${value} / span ${value}`;
        onAttributeChange({name, value: span});
    }

    const cols = getSpan('gridColumn');
    //const rows = getSpan('gridRow');

    return (<>
        <EditAttribute label="Column Span" sameLine={<InputBlur className="hw-w-1/4" value={cols} onChange={onChange('gridColumn')}/>}/>
    </>)
}

const EditPosition: React.FunctionComponent = () => {
    const {getAttribute, onAttributeChange} = useComponentAttribute();
    const items: DropdownItem<string>[] = [
        {
            id: 'static',
            name: 'Default'
        },
        {
            id: 'relative',
            name: 'Relative'
        },
        {
            id: 'absolute',
            name: 'Absolute'
        },
        {
            id: 'fixed',
            name: 'Fixed'
        }
    ];

    const onChange = (item: DropdownItem<string>) => {
        onAttributeChange({name: 'position', value: item.id});
    }
    const position = getAttribute('position');

    return (
        <EditAttribute label="Position" sameLine={<Dropdown initialValue={position} onChange={onChange} items={items} />}>
            {position !== 'static' ? <>
                {(['top', 'bottom', 'left', 'right'] as const).map(side => <div key={side} className="hw-flex-1">
                    <InputBlur className="hw-w-full" value={getAttribute(side)} onChange={(value) => onAttributeChange({name: side, value})}/>
                    <div>{side}</div>
                </div>)}
            </> : null}
        </EditAttribute>
    )
}