"use client";
import { Component, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Inspector, ResizeCoords, ResizeDirection, ResizeValue, componentIdentifier } from "./inspector/inspector";
import { Attribute, ComponentElement, ComponentUpdate } from "@harmony/ui/src/types/component";
import {PublishRequest, loadResponseSchema, type UpdateRequest} from "@harmony/ui/src/types/network";

import { HarmonyPanel, SelectMode} from "./panel/harmony-panel";
import hotkeys from 'hotkeys-js';
import { getNumberFromString} from "@harmony/util/src/index";
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import React from "react";
import {WEB_URL} from '@harmony/util/src/constants';

import '../global.css';
import { setupHarmonyMode, setupHarmonyProvider, setupNormalMode } from "./harmony-setup";
import { Button } from "@harmony/ui/src/components/core/button";
import { MinimizeIcon } from "@harmony/ui/src/components/core/icons";
import { PullRequest } from "@harmony/ui/src/types/branch";

const WIDTH = 1960;
const HEIGHT = 1080;

export function findElementFromId(componentId: string, parentId: string): HTMLElement | undefined {
	return (document.querySelector(`[data-harmony-id="${componentId}"][data-harmony-parent-id="${parentId}"]`) as HTMLElement || null) || undefined;
}

const viewModes = ['designer', 'preview', 'preview-full'] as const;
type DisplayMode = typeof viewModes[number];

interface HarmonyContextProps {
	branchId: string;
	isSaving: boolean;
	setIsSaving: (isSaving: boolean) => void;
	publish: (request: PublishRequest) => Promise<void>;
	isPublished: boolean;
	setIsPublished: (value: boolean) => void;
	displayMode: DisplayMode;
	changeMode: (mode: DisplayMode) => void;
	publishState: PullRequest | undefined;
	setPublishState: (value: PullRequest | undefined) => void;
}
const HarmonyContext = createContext<HarmonyContextProps>({branchId: '', isPublished: false, publish: async () => undefined, isSaving: false, setIsSaving: () => undefined, setIsPublished: () => undefined, displayMode: 'designer', changeMode: () => undefined, publishState: undefined, setPublishState: () => undefined});

export const useHarmonyContext = () => {
	const context = useContext(HarmonyContext);

	return context;
}

export interface HarmonyProviderProps {
	repositoryId: string;
	branchId: string;
	rootElement: HTMLElement;
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({repositoryId, rootElement: _rootElement, branchId: branchIdProps}) => {
	const [isToggled, setIsToggled] = useState(true);
	const [selectedComponent, _setSelectedComponent] = useState<HTMLElement>();
	const [selectedComponentText, setSelectedComponentText] = useState<string>();
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
	const [rootElement, setRootElement] = useState<HTMLElement>(_rootElement);
	const ref = useRef<HTMLDivElement>(null);
	const harmonyContainerRef = useRef<HTMLDivElement | null>(null);
	//const [harmonyContainer, setHarmonyContainer] = useState<HTMLElement>();
	const [mode, setMode] = useState<SelectMode>('tweezer');
	const [availableIds, setAvailableIds] = useState<ComponentUpdate[]>([]);
	const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
	const [scale, _setScale] = useState(1);
	const [isDirty, setIsDirty] = useState(false);
	const [updateOverlay, setUpdateOverlay] = useState(0);
	const [branchId, _setBranchId] = useState<string | undefined>(branchIdProps);
	const [isSaving, setIsSaving] = useState(false);
	const [isPublished, setIsPublished] = useState(false);
	const [displayMode, setDisplayMode] = useState<DisplayMode>();
	const [publishState, setPublishState] = useState<PullRequest | undefined>();
	
	const executeCommand = useComponentUpdator({isSaving, setIsSaving, isPublished, branchId: branchId || '', repositoryId, onChange() {
		setUpdateOverlay(updateOverlay + 1);
	}});

	// const assignIds = useCallback((element: HTMLElement): void => {
	// 	const elementName = element.tagName.toLowerCase();
	// 	const className = element.className;
	// 	const childPosition = Array.from(element.parentNode?.children ?? []).indexOf(element)
	// 	let hash = hashComponent({elementName, className, childPosition});

	// 	let idIndex = availableIds.indexOf(hash);
	// 	if (idIndex < 0) {
	// 		hash = hashComponent({elementName, className, childPosition: 1});
	// 		idIndex = availableIds.indexOf(hash);
	// 	}

	// 	if (idIndex > -1) {
	// 		element.dataset.harmonyId = String(hash);
	// 	}

	// 	Array.from(element.children).forEach(child => assignIds(child as HTMLElement));
	// }, [availableIds]);

	const setBranchId = (branchId: string | undefined) => {
		const url = new URL(window.location.href);
		if (branchId && !url.searchParams.has('branch-id')) {
			url.searchParams.set('branch-id', branchId);
			window.history.replaceState(null, '', url.href);
		}

		_setBranchId(branchId);
	}

	const onHistoryChange = () => {
		const url = new URL(window.location.href);
		const mode = url.searchParams.get('mode');
		if (mode && (viewModes as readonly string[]).includes(mode)) {
			setDisplayMode(mode as DisplayMode);
		}
	}
	
	useEffect(() => {
		const initialize = async () => {
			onHistoryChange();

			const response = await fetch(`${WEB_URL}/api/load/${repositoryId}${branchId ? `?branchId=${branchId}` : ''}`, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
			});

			const {updates, branches, isPublished} = loadResponseSchema.parse(await response.json());
			setAvailableIds(updates);
			setBranches(branches);
			setIsPublished(isPublished);
		}

		initialize();

		window.addEventListener('popstate', onHistoryChange);

		return () => window.removeEventListener('popstate', onHistoryChange);
	}, []);

	useEffect(() => {
		if (displayMode?.includes('preview')) {
			setIsToggled(false);
			setScale(0.5);

			if (displayMode === 'preview-full') {
				const harmonyContainer = document.getElementById('harmony-container') as HTMLElement;
				setupNormalMode(rootElement, harmonyContainer, document.body as HTMLBodyElement);
				rootComponent !== document.body && setRootComponent(document.body);
			}
		}

		if (displayMode === 'designer') {
			setIsToggled(true);
		}
	}, [displayMode, harmonyContainerRef])

	const onToggle = useEffectEvent(() => {
		setIsToggled(!isToggled);

		// if (!isToggled && rootComponent) {
		// 	assignIds(rootComponent);
		// }
	});

	useEffect(() => {
		hotkeys('ctrl+option+h,command+option+h', onToggle);
		
		return () => hotkeys.unbind('esc', onToggle);
	}, []);

	// useEffect(() => {
	// 	if (ref.current) {
	// 		//const element = componentIdentifier.getComponentFromElement(ref.current.nextElementSibling as HTMLElement);
	// 		setRootComponent(ref.current.nextElementSibling as HTMLElement | null ?? undefined);
	// 	}
	// }, [ref]);

	useEffect(() => {
		// if (harmonyContainerRef.current) {
		// 	setRootComponent(harmonyContainerRef.current);
		// 	harmonyContainerRef.current.appendChild(rootElement);
		// 	//document.body = rootElement;
		// }
	}, [harmonyContainerRef]);

	useEffect(() => {
		if (rootComponent && availableIds.length > 0) {
			const mutationObserver = new MutationObserver((mutations) => {
				updateElements(rootComponent);
			});
			const body = rootComponent.querySelector('body');
			mutationObserver.observe(body || rootComponent, {
				childList: true,
				//subtree: true,
			});

			updateElements(rootComponent);
		}
	}, [rootComponent, availableIds]);

	const updateElements = (element: HTMLElement): void => {
		const id = element.dataset.harmonyId;
		const parentId = element.dataset.harmonyParentId || null;
		if (id !== undefined) {
			const updates = availableIds.filter(up => up.componentId === id && up.parentId === parentId);
			makeUpdates(element, updates);
		}

		Array.from(element.children).forEach(child => updateElements(child as HTMLElement));
	}

	const setScale = useCallback((scale: number) => {
        if (harmonyContainerRef.current && harmonyContainerRef.current.parentElement) {
            harmonyContainerRef.current.style.transform = `scale(${scale})`;
            harmonyContainerRef.current.parentElement.style.width = `${WIDTH*scale}px`;
            harmonyContainerRef.current.parentElement.style.height = `${HEIGHT*scale}px`;
        }
        _setScale(scale);
    }, [harmonyContainerRef]);

	const onTextChange = useEffectEvent((value: string) => {
		if (!selectedComponent) return;

		const component = componentIdentifier.getComponentFromElement(selectedComponent);
		if (!component) throw new Error("Error when getting component");

		const update: ComponentUpdate = {componentId: component.id, parentId: component.parentId, type: 'text', name: '0', action: 'change', value}
		const oldValue = selectedComponentText || '';
		onAttributesChange(component, [update], [oldValue]);
	});

	const onResize = useEffectEvent((size: ResizeValue) => {
		if (!selectedComponent) return;

		const component = componentIdentifier.getComponentFromElement(selectedComponent);
		if (!component) throw new Error("Error when getting component");

		const styles = getComputedStyle(selectedComponent);

		const oldSize = {
			n: getNumberFromString(styles.paddingTop),
			e: getNumberFromString(styles.paddingRight),
			s: getNumberFromString(styles.paddingBottom),
			w: getNumberFromString(styles.paddingLeft),
		}

		const convertSizeToString = (size: ResizeValue): string => Object.entries(size).reduce((prev, [direction, value]) => prev ? `${prev}:${direction}=${value}` : `${direction}=${value}`, '')

		const value = convertSizeToString(size);
		const update: ComponentUpdate = {componentId: component.id, parentId: component.parentId, type: 'className', name: 'size', action: 'change', value}
		const oldValue = convertSizeToString(oldSize);
		onAttributesChange(component, [update], [oldValue]);
	});

	const onReorder = useEffectEvent(({from, to, element}: {from: number, to: number, element: HTMLElement}) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) throw new Error("Error when getting component");
		
		const value = `from=${from}:to=${to}`
		const oldValue = `from=${to}:to=${from}`;
		const update: ComponentUpdate = {componentId: component.id, parentId: component.parentId, type: 'component', name: 'reorder', action: 'change', value};
		
		onAttributesChange(component, [update], [oldValue], false);
	})

	const onAttributesChange = (component: ComponentElement, update: ComponentUpdate[], oldValue: string[], execute=true) => {
		executeCommand(component, update, oldValue, execute);
	}

	const onElementChange = (element: HTMLElement, update: ComponentUpdate[], oldValue: string[], execute=true) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) {
			throw new Error("Error when getting component");
		}

		onAttributesChange(component, update, oldValue, execute);
	}

	const onPublish = async (request: PublishRequest): Promise<void> => {
		await fetch(`${WEB_URL}/api/publish`, {
			method: 'POST',
			// headers: {
			// 	'Accept': 'application/json',
			// 	'Content-Type': 'application/json'
			// },
			body: JSON.stringify(request)
		});
	}

	const setSelectedComponent = (component: HTMLElement | undefined): void => {
		_setSelectedComponent(component);
		selectedComponent !== component && setSelectedComponentText(component?.textContent || '');
	}
	
	const changeMode = (mode: DisplayMode) => {
		const url = new URL(window.location.href);
		url.searchParams.set('mode', mode);

		//TODO: Change to history.pushState so the transition is smooth
		//window.location.replace(url.href);
		window.history.pushState(publishState, 'mode', url.href);
		onHistoryChange();

		if (mode === 'preview' && displayMode === 'preview-full') {
			const result = setupHarmonyProvider(false);
			if (!result) throw new Error("There should be a result");
			setRootElement(result.container);
			// setRootComponent(harmonyContainerRef.current);
			// harmonyContainerRef.current.appendChild(rootElement);
		}
	}

	const onMinimize = () => {
		changeMode('preview');
	}

	return (
		<>
			{/* <div ref={harmonyContainerRef}> */}
				{<HarmonyContext.Provider value={{branchId: branchId || '', publish: onPublish, isSaving, setIsSaving, isPublished, setIsPublished, displayMode: displayMode || 'designer', changeMode, publishState, setPublishState}}>
					{displayMode && displayMode !== 'preview-full' ? <><HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onComponentHover={setHoveredComponent} onComponentSelect={setSelectedComponent} mode={mode} scale={scale} onScaleChange={_setScale} onModeChange={setMode} toggle={isToggled} onToggleChange={setIsToggled} isDirty={isDirty} setIsDirty={setIsDirty} branchId={branchId} branches={branches} onBranchChange={setBranchId}>
					<div style={{width: `${WIDTH*scale}px`, height: `${HEIGHT*scale}px`}}>
						<div ref={(d) => {
							harmonyContainerRef.current = d
							if (harmonyContainerRef.current) {
								setRootComponent(harmonyContainerRef.current);
								harmonyContainerRef.current.appendChild(rootElement);
							}
						}} style={{width: `${WIDTH}px`, height: `${HEIGHT}px`, transformOrigin: "0 0", transform: `scale(${scale})`}}>
						{isToggled ? <Inspector rootElement={rootComponent} parentElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} onElementTextChange={onTextChange} onResize={onResize} onReorder={onReorder} mode={mode} updateOverlay={updateOverlay} scale={scale} onChange={onElementChange}/> : null}	
						</div>
					</div>
					</HarmonyPanel></> : <div className="hw-absolute hw-z-[100] hw-group hw-p-2">
						<button className="hw-invisible group-hover:hw-visible hw-bg-primary hw-rounded-md hw-p-2" onClick={onMinimize}>
							<MinimizeIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none"/>
						</button>
					</div>}
				</HarmonyContext.Provider>}
			{/* </div> */}
		</>
	)
}

interface HarmonyCommandChange {
	name: 'change',
	update: ComponentUpdate[],
	old: ComponentUpdate[]
	//oldValue: Attribute[]
}
type HarmonyCommand = HarmonyCommandChange;

interface ComponentUpdatorProps {
	onChange?: () => void;
	branchId: string;
	repositoryId: string;
	isSaving: boolean;
	setIsSaving: (value: boolean) => void;
	isPublished: boolean;
}
const useComponentUpdator = ({onChange, branchId, repositoryId, isSaving, isPublished, setIsSaving}: ComponentUpdatorProps) => {
	const [undoStack, setUndoStack] = useState<HarmonyCommand[]>([]);
	const [redoStack, setRedoStack] = useState<HarmonyCommand[]>([]);
	const [saveStack, setSaveStack] = useState<HarmonyCommand[]>([]);
	const [editTimeout, setEditTimeout] = useState(new Date().getTime());
	
	useBackgroundLoop(() => {
		if (saveStack.length && !isSaving && !isPublished) {
			saveCommand(saveStack, {branchId, repositoryId}).then(() => {
				setSaveStack([]);
			}).catch(() => {
				
			});
		}
	}, 10);

	const onLeave = useEffectEvent((e: BeforeUnloadEvent) => {
		if (saveStack.length > 0 && !isPublished) {
			e.preventDefault();
			return "Are you sure you want to leave?";
		}
	})

	useEffect(() => {
		window.addEventListener('beforeunload', onLeave);

		return () => window.removeEventListener('beforeunload', onLeave);
	}, []);

	const executeCommand = (component: ComponentElement, update: ComponentUpdate[], oldValues: string[], execute=true): void => {
		const old = oldValues.map((oldValue, i) => ({...update[i], value: oldValue}));
		const newCommand: HarmonyCommand = {
			name: 'change',
			update,
			old,
		}
		//TODO: find a better way to do this
		if (execute)
			change(newCommand);

		if (component.element === undefined) return;

		const newEdits = undoStack.slice();
		const newSaves = saveStack.slice();
		const lastEdits = newEdits[newEdits.length - 1];
		const lastEdit = lastEdits?.update.length === 1 ? lastEdits.update[0] : undefined;
		const newEdit = newCommand.update.length === 1 ? newCommand.update[0] : undefined;
		const isSameCommandType = newEdit && lastEdit && newEdit.type === lastEdit.type && newEdit.name === lastEdit.name && newEdit.componentId === lastEdit.componentId && newEdit.parentId === lastEdit.parentId;

		const currTime = new Date().getTime();
		if (editTimeout < currTime || !isSameCommandType) {
			newEdits.push(newCommand);
			newSaves.push(newCommand);
			const newTime = currTime + 1000;
			setEditTimeout(newTime);
		} else {
			//TODO: Get rid of type = 'component' dependency
			if (newEdits.length && newCommand.update.length === 1 && newCommand.update[0].type !== 'component') {
				newCommand.old[0].value = lastEdits.old[0].value;
				newEdits[newEdits.length - 1] = newCommand;
				//TODO: test this to make sure this works
				newSaves[newSaves.length - 1] = newCommand;
			} else {
				newEdits.push(newCommand);
				newSaves.push(newCommand);
			}
		}
		setUndoStack(newEdits);
		setSaveStack(newSaves);
		setRedoStack([]);
	}

	const change = ({update, old}: HarmonyCommandChange): void => {
		for (let i = 0; i < update.length; i++) {
			const element = findElementFromId(update[i].componentId, update[i].parentId);
			if (element === undefined) return;
			
			makeUpdates(element, [update[i]]);
		}

		onChange && onChange();
	}

	const changeStack = (from: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>], to: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>]) => {
		const [fromValue, fromSet] = from;
		const [toValue, toSet] = to;

		if (fromValue.length === 0) return;
		const lastEdit = fromValue[fromValue.length - 1];
		const newEdit: HarmonyCommand = {name: 'change', update: lastEdit.old, old: lastEdit.update};
		change(newEdit);
		const newFrom = fromValue.slice();
		newFrom.splice(newFrom.length - 1);

		const newTo = toValue.slice();
		newTo.push(newEdit);
		fromSet(newFrom);
		toSet(newTo);

		//TODO: Test this
		const newSaves = saveStack.slice();
		newSaves.push(newEdit);
		setSaveStack(newSaves);
	}

	const onUndo = useEffectEvent(() => {
		changeStack([undoStack, setUndoStack], [redoStack, setRedoStack]);
	});

	const onRedo = useEffectEvent(() => {
		changeStack([redoStack, setRedoStack], [undoStack, setUndoStack]);
	});

	const saveCommand = async (commands: HarmonyCommand[], save: {branchId: string, repositoryId: string}): Promise<void> => {
		setIsSaving(true);
		const cmds = commands.map(cmd => ({update: cmd.update, old: cmd.old}))
		const data: UpdateRequest = {values: cmds, repositoryId: save.repositoryId};
		const result = await fetch(`${WEB_URL}/api/update/${save.branchId}`, {
			method: 'POST',
			// headers: {
			// 	'Accept': 'application/json',
			// 	'Content-Type': 'application/json'
			// },
			body: JSON.stringify(data)
		});
		setIsSaving(false);

		if (!result.ok) {
			throw new Error("There was an problem saving the changes");
		}
	}

	useEffect(() => {
		
		hotkeys('ctrl+z, command+z', onUndo);
		hotkeys('ctrl+shift+z, command+shift+z', onRedo);

		return () => {
			hotkeys.unbind('ctrl+z, command+z', onUndo);
			hotkeys.unbind('ctrl+shift+z, command+shift+z', onRedo);
		}
	}, []);

	useEffect(() => {

	}, []);


	return executeCommand;
}

const useBackgroundLoop = (callback: () => void, intervalInSeconds: number) => {
	const callbackRef = useRef(callback);
	const intervalRef = useRef<NodeJS.Timeout>();
	
	// Update the callback function if it changes
	useEffect(() => {
	  callbackRef.current = callback;
	}, [callback]);
  
	// Start the background loop when the component mounts
	useEffect(() => {
	  const handle = () => {
		callbackRef.current();
	  };
  
	  // Call the callback immediately when the component mounts
	  handle();
  
	  // Start the interval
	  intervalRef.current = setInterval(handle, intervalInSeconds * 1000);
  
	  // Clear the interval when the component unmounts
	  return () => {
		clearInterval(intervalRef.current);
	  };
	}, [intervalInSeconds]);
  
	// Function to manually stop the background loop
	const stopBackgroundLoop = () => {
	  clearInterval(intervalRef.current);
	};
  
	return stopBackgroundLoop;
  };

function makeUpdates(el: HTMLElement, updates: ComponentUpdate[]) {
	let alreadyDoneText = false;
	const id = el.dataset.harmonyId;
	if (!id) {
		return;
	}

	//TODO: make the value string splitting be a regex thing with groups

	//Updates that should happen just for the element (reordering)
	for (const update of updates) {
		if (update.type === 'component') {
			if (update.name === 'reorder') {
				const [fromStr, toStr] = update.value.split(':');
				const [_, from] = fromStr.split('=');
				const [_2, to] = toStr.split('=');

				const element = findElementFromId(update.componentId, update.parentId);
				if (!element) throw new Error("Cannot find element with id " + update.componentId + " and parent id " + update.parentId);

				const parent = element.parentElement;
				if (!parent) throw new Error("Element does not have a parent");

				const fromNum = parseInt(from);
				const toNum = parseInt(to);
				if (isNaN(fromNum) || isNaN(toNum) || fromNum < 0 || toNum < 0 || fromNum >= parent.children.length || toNum >= parent.children.length)
					throw new Error(`Invalid from and to numbers: ${fromNum}, ${toNum}`);

				if (fromNum === toNum) continue;

				const fromElement = parent.children[fromNum];
				//+1 because we need to get the next sibiling for the insertBefore
				const toElement = parent.children[fromNum < toNum ? toNum + 1 : toNum] || null;
				parent.insertBefore(fromElement, toElement);
			}
		}
	}

	//Updates that should happen for every element in a component
	const sameElements = document.querySelectorAll(`[data-harmony-id="${id}"]`);
	for (const element of Array.from(sameElements)) {
		const htmlElement = element as HTMLElement;
		for (const update of updates) {
			if (update.type === 'className') {
				
				if (update.name === 'spacing') {
					const [line, letter] = update.value.split('-');
					htmlElement.style.lineHeight = line;
					htmlElement.style.letterSpacing = letter;
				} else if (update.name === 'size') {
					const directionsStr = update.value.split(':');
					const mapping: Record<ResizeCoords, 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'> = {
						n: 'paddingTop',
						e: 'paddingRight',
						s: 'paddingBottom',
						w: 'paddingLeft'
					}
					for (const directionStr of directionsStr) {
						const [direction, value] = directionStr.split('=');
						if (isNaN(Number(value))) throw new Error("Value must be a number: " + value);
						if (direction.length !== 1 || !'nesw'.includes(direction)) throw new Error("Invalid direction " + direction);

						const valueStyle = `${value}px`;
						htmlElement.style[mapping[direction as ResizeCoords]] = valueStyle;
					}
				} else {
					htmlElement.style[update.name as unknown as number]= update.value;
				}
			}

			if (update.type === 'text') {
				if (htmlElement.textContent !== update.value) {
					htmlElement.textContent = update.value;
					alreadyDoneText = true;
				}
			}
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
		
		// //Any class that is available, let's use that and leave what is left
		// const left: Attribute[] = [];
		// for (const attr of attributes) {
		// 	if (attr.className === undefined) {
		// 		left.push(attr);
		// 	} else {
		// 		classes.add(attr.className);
		// 	}
		// }

		// const condensed = left.reduce<Attribute[]>((prev, curr) => {
		// 	const [type, direction] = curr.id.split('-');
		// 	const sameType = prev.find(d => d.id.includes(type) && d.value === curr.value);
		// 	if (sameType) {
		// 		sameType.id += `-${direction}`;
		// 	} else {
		// 		prev.push({...curr});
		// 	}

		// 	return prev;
		// }, [])
		// for (const attribute of condensed) {
		// 	const [spacingType, ...directions] = attribute.id.split('-');

		// 	if (directions.length === 4) {
		// 		classes.add(`${spacingMapping[spacingType]}-${attribute.value}`)
		// 	} else {
		// 		for (const direction of directions) {
		// 			classes.add(`${spacingMapping[spacingType] === 'border' ? 'border-' : spacingMapping[spacingType]}${directionMapping[direction]}-${attribute.value}`);
		// 		}
		// 	}
		// }

		const classNames: string[] = [];
		classes.forEach(klass => classNames.push(klass));

		return classNames.join(' ');
	},
	translateCSSAttributes(className): Attribute[] {
		const spacingReverse = reverse(spacingMapping);
		const directionReverse = reverse(directionMapping);

		const attributes: Attribute[] = [];
		// className.split(' ').forEach(name => {
		// 	Object.keys(spacingReverse).forEach(key => {
		// 		const keySplit = key === 'border' ? 'border-' : key;
		// 		const [type, next] = name.split(keySplit);
		// 		if (!type && next) {
		// 			const [direction, value] = next.split('-');
		// 			const directionName = directionReverse[direction];
		// 			//This is a false positive (like min-h-screen)
		// 			if ((direction && !directionName)) {
		// 				return;
		// 			}

		// 			const numValue = Number(value ?? (key === 'border' ? 1 : ''));
		// 			if (isNaN(numValue)) throw new Error('Invalid value for class ' + name);
		// 			const type = spacingReverse[key];

		// 			if (directionName) {
		// 				attributes.push({id: `${type}-${directionName}`, type: 'className', name: `${type} ${directionName}`, value: String(numValue), className: name});
		// 			} else {
		// 				attributes.push(...spacingDirections.map(direction => ({id: `${type}-${direction}`, type: 'className', name: `${type} ${direction}`, value: String(numValue), className: name})));
		// 			}
		// 		}
		// 	})
		// })

		return attributes;
	},
}

const reverse = (records: Record<string, string>): Record<string, string> => {
	return Object.entries(records).reduce((prev, [key, value]) => ({...prev, [value]: key}), {});
}

//const componentUpdator = new ComponentUpdator(TailwindAttributeTranslator);


class Stack<T> {
	private arr: T[] = [];

	public push(item: T) {
		this.arr.push(item);
	}

	public pop(): T | undefined {
		if (this.arr.length === 0) return undefined;

		const lastItem = this.arr[this.arr.length - 1];
		this.arr.splice(this.arr.length - 1);

		return lastItem;
	}
}
