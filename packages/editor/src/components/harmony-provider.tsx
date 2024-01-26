"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Inspector, componentIdentifier } from "./inspector/inspector";
import { Attribute, ComponentElement } from "@harmony/ui/src/types/component";
import { HarmonyPanel, SelectMode} from "./panel/harmony-panel";
import hotkeys from 'hotkeys-js';
import { hashComponent } from "@harmony/util/src/index";
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import {SidePanel} from "@harmony/ui/src/components/core/side-panel";
import ReactDOM from "react-dom";
import React from "react";
import '../global.css';

const WEB_URL = false && process.env.NODE_ENV === 'production' ? 'https://harmony-xi.vercel.app' : 'http://localhost:3001'
const WIDTH = 1960;
const HEIGHT = 1080;

function isNativeElement(element: Element): boolean {
    return element.tagName.toLowerCase() !== 'script' && element.id !== 'harmony-container';
}

function setupHarmonyMode(container: Element, body: HTMLBodyElement) {
    for (let i = 0; i < body.children.length; i++) {
        const child = body.children[i];
        if (isNativeElement(child)) {
            container.appendChild(child);
			i--;
        }
    }
}

function setupNormalMode(container: Element, body: HTMLBodyElement) {
    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i];
        if (isNativeElement(child)) {
            body.appendChild(child);
			i--;
        }
    }
}

export function setupHarmonyProvider(setupHarmonyContainer=true) {
    // let harmonyContainer: HTMLElement;
	// if (setupHarmonyContainer) {
	// 	harmonyContainer = document.createElement('div');
	// 	harmonyContainer.id = 'harmony-container';
	// 	document.body.appendChild(harmonyContainer);
	// }
	if (document.getElementById('harmony-container')) return undefined;

	const harmonyContainer = document.createElement('div');
	harmonyContainer.id = 'harmony-container';
	harmonyContainer.className = "hw-h-full";
	document.body.appendChild(harmonyContainer);

	const documentBody = document.body as HTMLBodyElement;

    const container = document.createElement('body');
    container.className = documentBody.className;

	//TODO: Probably need to do this for all styles;
	container.style.backgroundColor = 'white';
	setupHarmonyMode(container, documentBody);
	
	const createPortal = ReactDOM.createPortal;
	ReactDOM.createPortal = function(children: React.ReactNode, _container: Element | DocumentFragment, key?: string | null | undefined) {
		if (_container === documentBody) {
			_container = container;
		}
		
		return createPortal(children, _container, key);
	}

    const mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.parentElement === documentBody && isNativeElement(node as Element)) {
					container.appendChild(node);
                }
            })
        }
    });
    mutationObserver.observe(documentBody, {
        'attributeOldValue': true,
        attributes: true,
        characterData: true,
        characterDataOldValue: true,
        childList: true,
        subtree: true
    });

    return {container, harmonyContainer};
}

export const HarmonySetup: React.FunctionComponent<Pick<HarmonyProviderProps, 'repositoryId'>> = (options) => {
	const [rootElement, setRootElement] = useState<HTMLElement | undefined>();
	useEffect(() => {
		const result = setupHarmonyProvider();
		if (result) {
			const {container, harmonyContainer} = result;
			ReactDOM.render(React.createElement(HarmonyProvider, {...options, rootElement: container}), harmonyContainer);
			//setRootElement(container)
		}
		
	}, []);
	return (<>
		{/* {rootElement ? <div id="harmony-container">
			<HarmonyProvider repositoryId={repositoryId} rootElement={rootElement}/>
		</div> : null} */}
	</>)
}

export interface HarmonyProviderProps {
	repositoryId: string;
	rootElement: HTMLElement;
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({repositoryId, rootElement}) => {
	const [isToggled, setIsToggled] = useState(false);
	const [selectedComponent, setSelectedComponent] = useState<HTMLElement>();
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
	const ref = useRef<HTMLDivElement>(null);
	const harmonyContainerRef = useRef<HTMLDivElement>(null);
	//const [harmonyContainer, setHarmonyContainer] = useState<HTMLElement>();
	const [mode, setMode] = useState<SelectMode>('tweezer');
	const [currEdits, setCurrEdits] = useState<Map<HTMLElement, {oldValue: ComponentElement, newValue: ComponentElement}>>(new Map());
	const [availableIds, setAvailableIds] = useState<number[]>([]);
	const [branchId, setBranchId] = useState<string>();
	const [scale, _setScale] = useState(.38);

	const assignIds = useCallback((element: HTMLElement): void => {
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
	}, [availableIds]);
	
	useEffect(() => {
		const initialize = async () => {
			const urlParams = new URLSearchParams(window.location.search);
			const branchId = urlParams.get('branch-id');

			if (branchId) {
				setBranchId(branchId);
				// const response = await fetch(`${WEB_URL}/api/load/${repositoryId}?branchId=${branchId}`, {
				// 	method: 'GET',
				// 	headers: {
				// 		'Accept': 'application/json',
				// 		'Content-Type': 'application/json'
				// 	},
				// });

				// const ids = await response.json();
				// if (Array.isArray(ids)) {
				// 	setAvailableIds(ids);
				// }
			}
		}

		initialize();
	}, [])

	const onToggle = useEffectEvent(() => {
		setIsToggled(!isToggled);

		// if (!isToggled && rootComponent) {
		// 	assignIds(rootComponent);
		// }
	});

	useEffect(() => {
		
		hotkeys('ctrl+shift+h', onToggle);

		return () => hotkeys.unbind('esc', onToggle);
	}, []);

	// useEffect(() => {
	// 	if (ref.current) {
	// 		//const element = componentIdentifier.getComponentFromElement(ref.current.nextElementSibling as HTMLElement);
	// 		setRootComponent(ref.current.nextElementSibling as HTMLElement | null ?? undefined);
	// 	}
	// }, [ref]);

	useEffect(() => {
		if (harmonyContainerRef.current) {
			setRootComponent(harmonyContainerRef.current);
			harmonyContainerRef.current.appendChild(rootElement);
			//document.body = rootElement;
		}
	}, [harmonyContainerRef]);

	// useEffect(() => {
	// 	if (document.body.firstElementChild) {

	// 		let child = document.body.firstElementChild;
	// 		let i = 0;
	// 		while (i < document.body.children.length && child.tagName.toLowerCase() !== 'div' && child.id !== 'harmony-container') {
	// 			child = document.body.children[++i];
	// 		}
	// 		if (child.tagName.toLowerCase() !== 'div' || child.id === 'harmony-container') {
	// 			return;//throw new Error("Invalid children of body");
	// 		}
	// 		setRootComponent(child as HTMLElement);
	// 	}
	// }, [document.body.children.length])

	// useEffect(() => {
	// 	const assignIds = (element: HTMLElement): void => {
	// 		const elementName = element.tagName.toLowerCase();
	// 		const className = element.className;
	// 		const childPosition = Array.from(element.parentNode?.children ?? []).indexOf(element)
	// 		let hash = hashComponent({elementName, className, childPosition});

	// 		let idIndex = availableIds.indexOf(hash);
	// 		if (idIndex < 0) {
	// 			hash = hashComponent({elementName, className, childPosition: 1});
	// 			idIndex = availableIds.indexOf(hash);
	// 		}

	// 		if (idIndex > -1) {
	// 			element.dataset.harmonyId = String(hash);
	// 		}

	// 		Array.from(element.children).forEach(child => assignIds(child as HTMLElement));
	// 	}

	// 	if (rootComponent && availableIds.length > 0) {
	// 		assignIds(rootComponent);
	// 	}
	// }, [rootComponent, availableIds])

	const setScale = useCallback((scale: number) => {
        if (harmonyContainerRef.current && harmonyContainerRef.current.parentElement) {
            harmonyContainerRef.current.style.transform = `scale(${scale})`;
            harmonyContainerRef.current.parentElement.style.width = `${WIDTH*scale}px`;
            harmonyContainerRef.current.parentElement.style.height = `${HEIGHT*scale}px`;
        }
        _setScale(scale);
    }, [harmonyContainerRef]);

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
		if (branchId === undefined) return;
		
		const commands: HarmonyCommand[] = [];
		currEdits.forEach(({newValue, oldValue}) => {
			commands.push({name: 'change', component: newValue, oldValue: oldValue.attributes })
		})
		
		componentUpdator.executeCommands(commands, {branchId, repositoryId});
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
			{/* <div ref={harmonyContainerRef}> */}
				{<>
					{isToggled ? <Inspector rootElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} mode={mode}/> : null}
					<HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onAttributesSave={onAttributesSave} onAttributesCancel={onAttributesCancel} onComponentHover={setHoveredComponent} onComponentSelect={setSelectedComponent} mode={mode} scale={scale} onScaleChange={_setScale} onModeChange={setMode}>
					<div style={{width: `${WIDTH*scale}px`, height: `${HEIGHT*scale}px`}}>
						<div ref={harmonyContainerRef} style={{width: `${WIDTH}px`, height: `${HEIGHT}px`, transformOrigin: "0 0", transform: `scale(${scale})`}}>
							
						</div>
					</div>
					</HarmonyPanel>
				</>}
			{/* </div> */}
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

	public executeCommand(command: HarmonyCommand, save: false | {branchId: string, repositoryId: string}=false): void {
		this[command.name](command, save);
	}

	public executeCommands(commands: HarmonyCommand[], save: false | {branchId: string, repositoryId: string}=false): void {
		commands.forEach(command => this.executeCommand(command, save));
	}

	private change({component, oldValue}: HarmonyCommandChange, save: false | {branchId: string, repositoryId: string}=false): void {
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
			fetch(`${WEB_URL}/api/update/${save.branchId}`, {
				method: 'POST',
				// headers: {
				// 	'Accept': 'application/json',
				// 	'Content-Type': 'application/json'
				// },
				body: JSON.stringify({id: component.id, parentId: component.parentId, oldValue, newValue: component.attributes, repositoryId: save.repositoryId})
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
