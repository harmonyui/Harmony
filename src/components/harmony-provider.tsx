'use client';
import { useEffect, useRef, useState } from "react";
import { Inspector, componentIdentifier } from "./inspector/inspector";
import { Attribute, ComponentElement } from "../types/component";
import { HarmonyPanel, SelectMode} from "./panel/harmony-panel";
import hotkeys from 'hotkeys-js';
import { hashComponent } from "@harmony/utils/util";

export interface HarmonyProviderProps {
	children: React.ReactNode
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({children}) => {
	const [isToggled, setIsToggled] = useState(false);
	const [selectedComponent, setSelectedComponent] = useState<HTMLElement>();
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement>();
	const ref = useRef<HTMLDivElement>(null);
	const [mode, setMode] = useState<SelectMode>('scope');
	const [currEdits, setCurrEdits] = useState<Map<HTMLElement, {oldValue: ComponentElement, newValue: ComponentElement}>>(new Map());
	const [availableIds, setAvailableIds] = useState<number[]>([]);

	useEffect(() => {
		const initialize = async () => {
			const response = await fetch('/api/load', {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
			});

			const ids = await response.json();
			if (Array.isArray(ids)) {
				setAvailableIds(ids);
			}
		}

		initialize();
	}, [])

	useEffect(() => {
		const onToggle = () => {
			setIsToggled(!isToggled);
		}
		hotkeys('ctrl+shift+h', onToggle);

		return () => hotkeys.unbind('esc', onToggle);
	}, [isToggled]);

	useEffect(() => {
		if (ref.current) {
			//const element = componentIdentifier.getComponentFromElement(ref.current.nextElementSibling as HTMLElement);
			setRootComponent(ref.current.nextElementSibling as HTMLElement | null ?? undefined);
		}
	}, [ref]);

	useEffect(() => {
		const assignIds = (element: HTMLElement): void => {
			const elementName = element.tagName.toLowerCase();
			const className = element.className;
			const childPosition = Array.from(element.parentNode?.children ?? []).indexOf(element)
			let hash = hashComponent({elementName, className, childPosition});

			let idIndex = availableIds.indexOf(hash);
			if (idIndex < 0) {
				hash = hashComponent({elementName, className, childPosition: 1});
				idIndex = availableIds.indexOf(hash);
			}

			if (idIndex > -1) {
				element.dataset.harmonyId = String(hash);
			}

			Array.from(element.children).forEach(child => assignIds(child as HTMLElement));
		}

		if (rootComponent && availableIds.length > 0) {
			assignIds(rootComponent);
		}
	}, [rootComponent, availableIds])
	const onAttributesChange = (component: ComponentElement, attributes: Attribute[]) => {
		if (selectedComponent === undefined) return;
		const copy = {...component};
		copy.attributes = attributes;
		const newCommand: HarmonyCommand = {
			name: 'change',
			component: copy,
			oldValue: component.attributes
		}
		componentUpdator.executeCommand(newCommand);

		if (component.element === undefined) return;

		const newEdits = new Map(currEdits);
		const curr = newEdits.get(component.element);
		if (curr) {
			newEdits.set(component.element, {...curr, newValue: copy});
		} else {
			newEdits.set(component.element, {oldValue: component, newValue: copy})
		}
		setCurrEdits(newEdits);
	}

	const onAttributesSave = (): void => {
		const commands: HarmonyCommand[] = [];
		currEdits.forEach(({newValue, oldValue}) => {
			commands.push({name: 'change', component: newValue, oldValue: oldValue.attributes })
		})
		
		componentUpdator.executeCommands(commands, true);
		setCurrEdits(new Map());
	}

	const onAttributesCancel = (): void => {
		const commands: HarmonyCommand[] = [];
		currEdits.forEach(({newValue, oldValue}) => {
			commands.push({name: 'change', component: oldValue, oldValue: newValue.attributes })
		})
		
		componentUpdator.executeCommands(commands);
		setCurrEdits(new Map());
		setSelectedComponent(undefined);
		setHoveredComponent(undefined);
	}

	return (
		<>
			<div ref={ref} className="hidden p-0 p-1 p-2 p-3 p-4 p-5 p-6 p-7 p-8 p-9 p-10 p-11 p-12 p-14 p-0 p-4 p-8 p-12 p-16 p-20 p-24 p-28 p-32 p-36 p-40 p-44 pl-0 pl-1 pl-2 pl-3 pl-4 pl-5 pl-6 pl-7 pl-8 pl-9 pl-10 pl-11 pl-12 pl-14 pl-0 pl-4 pl-8 pl-12 pl-16 pl-20 pl-24 pl-28 pl-32 pl-36 pl-40 pl-44 pr-0 pr-1 pr-2 pr-3 pr-4 pr-5 pr-6 pr-7 pr-8 pr-9 pr-10 pr-11 pr-12 pr-14 pr-0 pr-4 pr-8 pr-12 pr-16 pr-20 pr-24 pr-28 pr-32 pr-36 pr-40 pr-44 pt-0 pt-1 pt-2 pt-3 pt-4 pt-5 pt-6 pt-7 pt-8 pt-9 pt-10 pt-11 pt-12 pt-14 pt-0 pt-4 pt-8 pt-12 pt-16 pt-20 pt-24 pt-28 pt-32 pt-36 pt-40 pt-44 pb-0 pb-1 pb-2 pb-3 pb-4 pb-5 pb-6 pb-7 pb-8 pb-9 pb-10 pb-11 pb-12 pb-14 pb-0 pb-4 pb-8 pb-12 pb-16 pb-20 pb-24 pb-28 pb-32 pb-36 pb-40 pb-44 m-0 m-1 m-2 m-3 m-4 m-5 m-6 m-7 m-8 m-9 m-10 m-11 m-12 m-14 m-0 m-4 m-8 m-12 m-16 m-20 m-24 m-28 m-32 m-36 m-40 m-44 ml-0 ml-1 ml-2 ml-3 ml-4 ml-5 ml-6 ml-7 ml-8 ml-9 ml-10 ml-11 ml-12 ml-14 ml-0 ml-4 ml-8 ml-12 ml-16 ml-20 ml-24 ml-28 ml-32 ml-36 ml-40 ml-44 mr-0 mr-1 mr-2 mr-3 mr-4 mr-5 mr-6 mr-7 mr-8 mr-9 mr-10 mr-11 mr-12 mr-14 mr-0 mr-4 mr-8 mr-12 mr-16 mr-20 mr-24 mr-28 mr-32 mr-36 mr-40 mr-44 mt-0 mt-1 mt-2 mt-3 mt-4 mt-5 mt-6 mt-7 mt-8 mt-9 mt-10 mt-11 mt-12 mt-14 mt-0 mt-4 mt-8 mt-12 mt-16 mt-20 mt-24 mt-28 mt-32 mt-36 mt-40 mt-44 mb-0 mb-1 mb-2 mb-3 mb-4 mb-5 mb-6 mb-7 mb-8 mb-9 mb-10 mb-11 mb-12 mb-14 mb-0 mb-4 mb-8 mb-12 mb-16 mb-20 mb-24 mb-28 mb-32 mb-36 mb-40 mb-44 border-0 border-1 border-2 border-3 border-4 border-5 border-6 border-7 border-8 border-9 border-10 border-11 border-12 border-14 border-0 border-4 border-8 border-12 border-16 border-20 border-24 border-28 border-32 border-36 border-40 border-44 border-l-0 border-l-1 border-l-2 border-l-3 border-l-4 border-l-5 border-l-6 border-l-7 border-l-8 border-l-9 border-l-10 border-l-11 border-l-12 border-l-14 border-l-0 border-l-4 border-l-8 border-l-12 border-l-16 border-l-20 border-l-24 border-l-28 border-l-32 border-l-36 border-l-40 border-l-44 border-r-0 border-r-1 border-r-2 border-r-3 border-r-4 border-r-5 border-r-6 border-r-7 border-r-8 border-r-9 border-r-10 border-r-11 border-r-12 border-r-14 border-r-0 border-r-4 border-r-8 border-r-12 border-r-16 border-r-20 border-r-24 border-r-28 border-r-32 border-r-36 border-r-40 border-r-44 border-t-0 border-t-1 border-t-2 border-t-3 border-t-4 border-t-5 border-t-6 border-t-7 border-t-8 border-t-9 border-t-10 border-t-11 border-t-12 border-t-14 border-t-0 border-t-4 border-t-8 border-t-12 border-t-16 border-t-20 border-t-24 border-t-28 border-t-32 border-t-36 border-t-40 border-t-44 border-b-0 border-b-1 border-b-2 border-b-3 border-b-4 border-b-5 border-b-6 border-b-7 border-b-8 border-b-9 border-b-10 border-b-11 border-b-12 border-b-14 border-b-0 border-b-4 border-b-8 border-b-12 border-b-16 border-b-20 border-b-24 border-b-28 border-b-32 border-b-36 border-b-40 border-b-44"></div>
			{children}
			{isToggled ? <>
				<Inspector rootElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} mode={mode}/>
				<HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onAttributesSave={onAttributesSave} onAttributesCancel={onAttributesCancel} onComponentHover={setHoveredComponent} onComponentSelect={setSelectedComponent} mode={mode} onModeChange={setMode}/>
			</> : null}
		</>
	)
}

interface HarmonyCommandChange {
	name: 'change',
	component: ComponentElement,
	oldValue: Attribute[]
}
type HarmonyCommand = HarmonyCommandChange;

class ComponentUpdator {
	constructor(private attributeTranslator: AttributeTranslator) {}

	public executeCommand(command: HarmonyCommand, save=false): void {
		this[command.name](command, save);
	}

	public executeCommands(commands: HarmonyCommand[], save=false): void {
		commands.forEach(command => this.executeCommand(command, save));
	}

	private change({component, oldValue}: HarmonyCommandChange, save: boolean): void {
		// const replaceClassName = (className: string, oldClassName: string, newClassName: string) => {
		// 	oldClassName.split(' ').forEach(name => {
		// 		className = className.replaceAll(name, '');
		// 	})

		// 	return `${className} ${newClassName}`;
		// }

		// const newClassName = this.attributeTranslator.translateCSSClass(component.attributes);
		// const oldClassName = this.attributeTranslator.translateCSSClass(oldValue);

		// component.element.className = replaceClassName(component.element.className, oldClassName, newClassName);
		
		for (const attribute of component.attributes) {
			const [attrName, indexName] = attribute.id.split('-');
			const index = Number(indexName);
			if (isNaN(index)) throw new Error('Invalid index ' + indexName);

			if (attrName === 'text') {
				const node = component.element?.childNodes[index] as HTMLElement;
				if (node === undefined) {
					throw new Error('Invalid node');
				}

				node.textContent = attribute.value;
			}
		}
		if (save) {
			fetch('/api/update', {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({id: component.id, oldValue, newValue: component.attributes})
			});
		}
	}
}

interface AttributeTranslator {
	translateCSSClass: (attributes: Attribute[]) => string;
	translateCSSAttributes: (className: string) => Attribute[];
}

const spacingMapping: Record<string, string> = {
	'padding': 'p',
	'margin': 'm',
	'border': 'border'
}
const directionMapping: Record<string, string> = {
	'left': 'l',
	'right': 'r',
	'top': 't',
	'bottom': 'b'
}

const spacingDirections = ['left', 'right', 'top', 'bottom'];

export const TailwindAttributeTranslator: AttributeTranslator = {
	translateCSSClass(attributes: Attribute[]): string {
		const classes: Set<string> = new Set();
		
		//Any class that is available, let's use that and leave what is left
		const left: Attribute[] = [];
		for (const attr of attributes) {
			if (attr.className === undefined) {
				left.push(attr);
			} else {
				classes.add(attr.className);
			}
		}

		const condensed = left.reduce<Attribute[]>((prev, curr) => {
			const [type, direction] = curr.id.split('-');
			const sameType = prev.find(d => d.id.includes(type) && d.value === curr.value);
			if (sameType) {
				sameType.id += `-${direction}`;
			} else {
				prev.push({...curr});
			}

			return prev;
		}, [])
		for (const attribute of condensed) {
			const [spacingType, ...directions] = attribute.id.split('-');

			if (directions.length === 4) {
				classes.add(`${spacingMapping[spacingType]}-${attribute.value}`)
			} else {
				for (const direction of directions) {
					classes.add(`${spacingMapping[spacingType] === 'border' ? 'border-' : spacingMapping[spacingType]}${directionMapping[direction]}-${attribute.value}`);
				}
			}
		}

		const classNames: string[] = [];
		classes.forEach(klass => classNames.push(klass));

		return classNames.join(' ');
	},
	translateCSSAttributes(className): Attribute[] {
		const spacingReverse = reverse(spacingMapping);
		const directionReverse = reverse(directionMapping);

		const attributes: Attribute[] = [];
		className.split(' ').forEach(name => {
			Object.keys(spacingReverse).forEach(key => {
				const keySplit = key === 'border' ? 'border-' : key;
				const [type, next] = name.split(keySplit);
				if (!type && next) {
					const [direction, value] = next.split('-');
					const directionName = directionReverse[direction];
					//This is a false positive (like min-h-screen)
					if ((direction && !directionName)) {
						return;
					}

					const numValue = Number(value ?? (key === 'border' ? 1 : ''));
					if (isNaN(numValue)) throw new Error('Invalid value for class ' + name);
					const type = spacingReverse[key];

					if (directionName) {
						attributes.push({id: `${type}-${directionName}`, name: `${type} ${directionName}`, value: String(numValue), className: name});
					} else {
						attributes.push(...spacingDirections.map(direction => ({id: `${type}-${direction}`, name: `${type} ${direction}`, value: String(numValue), className: name})));
					}
				}
			})
		})

		return attributes;
	},
}

const reverse = (records: Record<string, string>): Record<string, string> => {
	return Object.entries(records).reduce((prev, [key, value]) => ({...prev, [value]: key}), {});
}

const componentUpdator = new ComponentUpdator(TailwindAttributeTranslator);

const g = () => {
	const classes: string[] = [];
	const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, ...[...new Array(12)].map((_, i) => i * 4 + 14)];
	console.log(values);
	Object.values(spacingMapping).forEach(spacing => {
		values.forEach(value => {
			classes.push(`${spacing}-${value}`);
		})
		Object.values(directionMapping).forEach(direction => {
			values.forEach(value => {
				classes.push(`${spacing === 'border' ? 'border-' : spacing}${direction}-${value}`);
			})
		});
	});

	return classes.join(' ');
}
