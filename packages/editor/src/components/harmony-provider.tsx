"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Inspector, componentIdentifier, isSelectable, replaceTextContentWithSpans, selectDesignerElement } from "./inspector/inspector";
import { Attribute, ComponentElement, ComponentError, ComponentUpdate } from "@harmony/ui/src/types/component";
import {PublishRequest, loadResponseSchema, updateResponseSchema, type UpdateRequest} from "@harmony/ui/src/types/network";
import {translateUpdatesToCss} from '@harmony/util/src/component';

import { HarmonyPanel, SelectMode} from "./panel/harmony-panel";
import hotkeys from 'hotkeys-js';
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import React from "react";
import {WEB_URL} from '@harmony/util/src/constants';

import { Setup } from "./harmony-setup";
import { MinimizeIcon } from "@harmony/ui/src/components/core/icons";
import { PullRequest } from "@harmony/ui/src/types/branch";
import { Font } from "@harmony/util/src/fonts";
import $ from 'jquery';
import { getBoundingRect } from "./snapping/calculations";
import { reverseUpdates } from "@harmony/util/src";

const WIDTH = 1960;
const HEIGHT = 1080;

export function findElementFromId(componentId: string, parentId: string, childIndex: number): HTMLElement | undefined {
	const elements = document.querySelectorAll(`[data-harmony-id="${componentId}"][data-harmony-parent-id="${parentId}"]`);
	for (const element of Array.from(elements)) {
		const elementChildIndex = Array.from(element.parentElement!.children).indexOf(element);
		if (elementChildIndex === childIndex) return element as HTMLElement;
	}

	return undefined;
}

export function findElementsFromId(componentId: string, parentId: string): HTMLElement[] {
	const elements = document.querySelectorAll(`[data-harmony-id="${componentId}"][data-harmony-parent-id="${parentId}"]`);
	return Array.from(elements) as HTMLElement[];
}


const viewModes = ['designer', 'preview', 'preview-full'] as const;
export type DisplayMode = typeof viewModes[number];

interface HarmonyContextProps {
	branchId: string;
	isSaving: boolean;
	setIsSaving: (isSaving: boolean) => void;
	publish: (request: PublishRequest) => Promise<boolean>;
	isPublished: boolean;
	setIsPublished: (value: boolean) => void;
	displayMode: DisplayMode;
	changeMode: (mode: DisplayMode) => void;
	publishState: PullRequest | undefined;
	setPublishState: (value: PullRequest | undefined) => void;
	fonts?: Font[];
	onFlexToggle: () => void;
	scale: number;
	onScaleChange: (scale: number, cursorPos: {x: number, y: number}) => void;
	onClose: () => void;
	error: string | undefined;
	setError: (value: string | undefined) => void;
}
const HarmonyContext = createContext<HarmonyContextProps>({branchId: '', isPublished: false, publish: async () => true, isSaving: false, setIsSaving: () => undefined, setIsPublished: () => undefined, displayMode: 'designer', changeMode: () => undefined, publishState: undefined, setPublishState: () => undefined, onFlexToggle: () => undefined, scale: 1, onScaleChange: () => undefined, onClose: () => undefined, error: undefined, setError: () => undefined});

export const useHarmonyContext = () => {
	const context = useContext(HarmonyContext);

	return context;
}

export interface HarmonyProviderProps {
	repositoryId: string;
	branchId: string;
	//rootElement: HTMLElement;
	children: React.ReactNode;
	//bodyObserver: MutationObserver;
	setup: Setup;
	fonts?: Font[];
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({repositoryId, children, branchId, fonts, setup}) => {
	const [isToggled, setIsToggled] = useState(true);
	const [selectedComponent, _setSelectedComponent] = useState<HTMLElement>();
	const [selectedComponentText, setSelectedComponentText] = useState<string>();
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
	//const [rootElement, setRootElement] = useState<HTMLElement>(_rootElement);
	const ref = useRef<HTMLDivElement>(null);
	const harmonyContainerRef = useRef<HTMLDivElement | null>(null);
	//const [harmonyContainer, setHarmonyContainer] = useState<HTMLElement>();
	const [mode, setMode] = useState<SelectMode>('tweezer');
	const [availableIds, setAvailableIds] = useState<ComponentUpdate[]>();
	const [errorElements, setErrorElements] = useState<ComponentError[]>();
	const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
	const [scale, _setScale] = useState(.8);
	const [isDirty, setIsDirty] = useState(false);
	const [updateOverlay, setUpdateOverlay] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isPublished, setIsPublished] = useState(false);
	const [displayMode, setDisplayMode] = useState<DisplayMode>();
	const [publishState, setPublishState] = useState<PullRequest | undefined>();
	const [cursorX, setCursorX] = useState(0);
	const [cursorY, setCursorY] = useState(0);
	const [oldScale, setOldSclae] = useState(scale);
	const [forceSave, setForceSave] = useState(0);
	const [error, setError] = useState<string | undefined>();
	
	const executeCommand = useComponentUpdator({isSaving, setIsSaving, fonts, isPublished, branchId, repositoryId, rootComponent, forceSave, onChange() {
		setUpdateOverlay(updateOverlay + 1);
	}, onError: setError});

	const onHistoryChange = () => {
		const url = new URL(window.location.href);
		let mode = url.searchParams.get('mode');
		if (!mode) {
			mode = window.sessionStorage.getItem('harmony-mode');
			mode && url.searchParams.set('mode', mode);
			window.history.pushState(publishState, 'mode', url.href);
		}
		if (mode && (viewModes as readonly string[]).includes(mode)) {
			setDisplayMode(mode as DisplayMode);
			setup.changeMode(mode as DisplayMode);
		}

		

		if (!mode) {
			changeMode('designer');
		}
	}
	
	useEffect(() => {
		const initialize = async () => {
			onHistoryChange();

			try {
				const response = await fetch(`${WEB_URL}/api/load/${repositoryId}${branchId ? `?branchId=${branchId}` : ''}`, {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
				});

				const {updates, branches, isPublished, errorElements} = loadResponseSchema.parse(await response.json());
				setAvailableIds(updates);
				setBranches(branches);
				setIsPublished(isPublished);
				setErrorElements(errorElements);
			} catch(err) {
				console.log(err);
			}
		}

		initialize();

		window.addEventListener('popstate', onHistoryChange);

		
		return () => window.removeEventListener('popstate', onHistoryChange);
	}, []);

	// useEffect(() => {
	// 	bodyObserverRef.current = bodyObserver
	// }, [bodyObserver, bodyObserverRef])

	useEffect(() => {
		if (displayMode?.includes('preview')) {
			setIsToggled(false);
			setScale(0.5, {x: 0, y: 0});

			// if (displayMode === 'preview-full') {
			// 	const harmonyContainer = document.getElementById('harmony-container') as HTMLElement;
			// 	setupNormalMode(rootElement, harmonyContainer, document.body as HTMLBodyElement, bodyObserverRef.current);
			// 	rootComponent !== document.body && setRootComponent(document.body);
			// }
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

	const onScaleIn = useEffectEvent((e: KeyboardEvent) => {
		e.preventDefault();
		setScale(Math.min(scale + .25, 5), {x: cursorX, y: cursorY});
	})

	const onScaleOut = useEffectEvent((e: KeyboardEvent) => {
		e.preventDefault();
		setScale(Math.min(scale - .25, 5), {x: cursorX, y: cursorY});
	});

	const onMouseMove = useEffectEvent((e: MouseEvent) => {
		const scrollContainer = document.getElementById("harmony-scroll-container");
		if (!scrollContainer) return;

		const currScrollLeft = scrollContainer.scrollLeft;
		const currScrollTop = scrollContainer.scrollTop;

		const newValX = e.clientX + currScrollLeft;
		const newValY = e.clientY + currScrollTop;
		setCursorX(newValX);
		setCursorY(newValY);
		setOldSclae(scale);
	})

	useEffect(() => {
		hotkeys('T', onToggle);
		hotkeys('ctrl+=,command+=', onScaleIn);
		hotkeys('ctrl+-,command+-', onScaleOut);
		document.addEventListener('mousemove', onMouseMove);
		
		return () => hotkeys.unbind('esc', onToggle);
	}, []);

	useEffect(() => {
		if (!isToggled) {
			setSelectedComponent(undefined);
		}
	}, [isToggled]);

	useEffect(() => {
		const scrollContainer = document.getElementById("harmony-scroll-container")
		if (scrollContainer) {
			//TODO: Hacky beyon hacky (went want to center the screen)
			scrollContainer.scrollLeft = 150;
		}
	}, [rootComponent]);

	const onFlexClick = useCallback(() => {
		if (!selectedComponent) return;

		const parent = selectDesignerElement(selectedComponent).parentElement!;
		const flexEnabled = parent.dataset.harmonyFlex;
		if (flexEnabled) {
			const $text = $('[name="harmony-flex-text"]');
			//TODO: This is kind of hacky to use jquery to trigger the flex change, but we can't use react because the 
			//overlay where the flex toggle lives is outside of react. We might be able to reverse dependencies
			//to make this logic live here instead of in this jquery pointer down function
			$text.trigger('pointerdown');
		}
	}, [selectedComponent]);

	useEffect(() => {
		if (rootComponent && availableIds && errorElements) {
			const mutationObserver = new MutationObserver((mutations) => {
				updateElements(rootComponent, availableIds, errorElements);
			});
			const body = rootComponent.querySelector('body');
			mutationObserver.observe(body || rootComponent, {
				childList: true,
				//subtree: true,
			});

			updateElements(rootComponent, availableIds, errorElements);
		}
	}, [rootComponent, availableIds, errorElements]);

	const updateElements = (element: HTMLElement, availableIds: ComponentUpdate[], errorElements: ComponentError[]): void => {
		if (!rootComponent) return;
		const errorComponent = errorElements.find(el => el.componentId === element.dataset.harmonyId && el.parentId === element.dataset.harmonyParentId)
		if (errorComponent) {
			const type = errorComponent.type;
			element.dataset.harmonyError = type;
		}

		const id = element.dataset.harmonyId;
		const parentId = element.dataset.harmonyParentId || null;
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		const children = Array.from(element.childNodes);
		const textNodes = children.filter(child => child.nodeType === Node.TEXT_NODE);
		const styles = getComputedStyle(element);

		//TODO: Do this better so there is no dependency on this action in this function
		//If there are text nodes and non-text nodes inside of an element, wrap the text nodes in
		//span tags so we can select and edit them
		if (textNodes.length > 0 && (children.length > textNodes.length || ['Bottom', 'Top', 'Left', 'Right'].some(d => parseFloat($(element).css(`padding${d}`)) !== 0))) {
			replaceTextContentWithSpans(element);
		}

		if (id !== undefined) {
			const updates = availableIds.filter(up => up.componentId === id && up.parentId === parentId && up.childIndex === childIndex);
			makeUpdates(element, updates, rootComponent, fonts);
		}

		Array.from(element.children).filter(child => (child as HTMLElement).dataset.harmonyText !== 'true').forEach(child => updateElements(child as HTMLElement, availableIds, errorElements));
	}

	const setScale = useCallback((newScale: number, {x, y}: {x: number, y: number}) => {
		const scrollContainer = document.getElementById("harmony-scroll-container");
		if (rootComponent && scrollContainer) {
			const currScrollLeft = scrollContainer.scrollLeft;
			const currScrollTop = scrollContainer.scrollTop;
			const rootRect = getBoundingRect(rootComponent);
			
			const offsetX = cursorX - rootRect.left;
			const offsetY = cursorY - rootRect.top;
			const scaleDelta = newScale - scale
			const scrollLeft = (offsetX / scale);
			const scrollTop = (offsetY / scale);

			const ratio = scaleDelta / oldScale
			
			const newX = currScrollLeft + (offsetX - currScrollLeft) * ratio;
			const newY = currScrollTop + (offsetY - currScrollTop) * ratio;


			scrollContainer.scrollLeft = newX;
			scrollContainer.scrollTop = newY;
		}

		if (selectedComponent) {
			if (!isSelectable(selectedComponent, newScale)) {
				setSelectedComponent(undefined);
			}
		}
	
        _setScale(newScale);
    }, [rootComponent, oldScale, scale, cursorX, cursorY, selectedComponent]);

	const onTextChange = useEffectEvent((value: string, oldValue: string) => {
		if (!selectedComponent) return;

		let component: ComponentElement | undefined = componentIdentifier.getComponentFromElement(selectedComponent);
		let index = 0;
		if (!component) {
			if (selectedComponent.dataset.harmonyText === 'true') {
				const element = selectedComponent.parentElement;
				component = element ? componentIdentifier.getComponentFromElement(element) : undefined;
				index = Array.from(element?.children || []).filter(child => (child as HTMLElement).dataset.harmonyText === 'true').indexOf(selectedComponent);
			}

			if (!component || index < 0) {
				throw new Error("Error when getting component");
			}
		}

		const childIndex = Array.from(selectedComponent.parentElement!.children).indexOf(selectedComponent);
		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdate = {componentId: component.id, parentId: component.parentId, type: 'text', name: String(index), action: 'change', value, oldValue, childIndex}
		onAttributesChange(component, [update], false);
	});

	const onReorder = useEffectEvent(({from, to, element}: {from: number, to: number, element: HTMLElement}) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) throw new Error("Error when getting component");
		
		const value = `from=${from}:to=${to}`
		const oldValue = `from=${to}:to=${from}`;
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdate = {componentId: component.id, parentId: component.parentId, type: 'component', name: 'reorder', action: 'change', value, oldValue, childIndex};
		
		onAttributesChange(component, [update], false);
	})

	const onAttributesChange = (component: ComponentElement, update: ComponentUpdate[], execute=true) => {
		executeCommand(component, update, execute);
	}

	const onElementChange = (element: HTMLElement, update: ComponentUpdate[], execute=true) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) {
			throw new Error("Error when getting component");
		}

		onAttributesChange(component, update, execute);
	}

	const onPublish = async (request: PublishRequest): Promise<boolean> => {
		try {
			await fetch(`${WEB_URL}/api/publish`, {
				method: 'POST',
				body: JSON.stringify(request)
			});

			return true;
		} catch(err) {
			return false
		}
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
		window.sessionStorage.setItem('harmony-mode', mode);
		onHistoryChange();
	}

	const onMinimize = () => {
		changeMode('preview');
	}
	
	const onClose = () => {
		setForceSave(forceSave + 1);
	}

	return (
		<>
			{<HarmonyContext.Provider value={{branchId: branchId || '', publish: onPublish, isSaving, setIsSaving, isPublished, setIsPublished, displayMode: displayMode || 'designer', changeMode, publishState, setPublishState, fonts, onFlexToggle: onFlexClick, scale, onScaleChange: setScale, onClose, error, setError}}>
				{displayMode && displayMode !== 'preview-full' ? <><HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onComponentHover={setHoveredComponent} onComponentSelect={setSelectedComponent} mode={mode} onModeChange={setMode} toggle={isToggled} onToggleChange={setIsToggled} isDirty={isDirty} setIsDirty={setIsDirty} branchId={branchId} branches={branches}>
				<div style={{width: `${WIDTH*scale}px`, minHeight: `${HEIGHT*scale}px`}}>
					<div id="harmony-scaled" ref={(d) => {
						if (d && d !== harmonyContainerRef.current) {
							harmonyContainerRef.current = d
							setRootComponent(harmonyContainerRef.current);
							//harmonyContainerRef.current.appendChild(rootElement);
						}
					}} style={{width: `${WIDTH}px`, height: `${HEIGHT}px`, transformOrigin: "0 0", transform: `scale(${scale})`}}>
					{isToggled ? <Inspector rootElement={rootComponent} parentElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} onElementTextChange={onTextChange} onReorder={onReorder} mode={mode} updateOverlay={updateOverlay} scale={scale} onChange={onElementChange}/> : null}	
					{children}
					</div>
				</div>
				</HarmonyPanel></> : <div className="hw-fixed hw-z-[100] hw-group hw-p-2">
					<button className="hw-bg-[#11283B] hover:hw-bg-[#11283B]/80 hw-rounded-md hw-p-2" onClick={onMinimize}>
						<MinimizeIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none"/>
					</button>
				</div>}
			</HarmonyContext.Provider>}
		</>
	)
}

export const usePinchGesture = ({scale, onTouching}: {scale: number, onTouching: (scale: number, cursorPos: {x: number, y: number}) => void}) => {
	const onTouch = useEffectEvent((event: WheelEvent) => {
		if (!event.ctrlKey) return;
		event.preventDefault();
		
		const delta = event.deltaY;
		const scaleFactor = 0.01; // Adjust sensitivity as needed
		const newScale = scale - scaleFactor * delta;
	
		// Update the scale state, ensuring it doesn't go below a minimum value
		onTouching(Math.max(0.1, newScale), {x: event.clientX, y: event.clientY});
	});

	return {onTouch};
}

interface HarmonyCommandChange {
	name: 'change',
	update: ComponentUpdate[],
}
type HarmonyCommand = HarmonyCommandChange;

interface ComponentUpdatorProps {
	onChange?: () => void;
	branchId: string;
	repositoryId: string;
	isSaving: boolean;
	setIsSaving: (value: boolean) => void;
	isPublished: boolean;
	rootComponent: HTMLElement | undefined; 
	fonts: Font[] | undefined;
	//TODO: This is super hacky 
	forceSave: number;
	onError: (error: string) => void;
}
const useComponentUpdator = ({onChange, branchId, repositoryId, isSaving, isPublished, setIsSaving, rootComponent, fonts, forceSave, onError}: ComponentUpdatorProps) => {
	const [undoStack, setUndoStack] = useState<HarmonyCommand[]>([]);
	const [redoStack, setRedoStack] = useState<HarmonyCommand[]>([]);
	const [saveStack, setSaveStack] = useState<HarmonyCommand[]>([]);
	const [editTimeout, setEditTimeout] = useState(new Date().getTime());

	const save = useEffectEvent(() => {
		return new Promise<void>((resolve, reject) => {
			const copy = saveStack.slice();
			saveCommand(saveStack, {branchId, repositoryId}).then((errorUpdates) => {
				if (errorUpdates.length > 0) {
					change({name: 'change', update: errorUpdates});
					errorUpdates.forEach(error => {
						const elements = findElementsFromId(error.componentId, error.parentId);
						elements.forEach(element => {
							element.dataset.harmonyError = error.errorType;
						})
					})
					onError("Some elements are not updateable at the moment");
				}
				resolve();
			}).catch(() => {
				//TODO: Test this
				for (const update of copy) {
					change({name: update.name, update: reverseUpdates(update.update)});
				}
				setSaveStack([]);
				onError("There was an error saving the project");
				resolve();
			});
			setSaveStack([]);
			//Force there to be a new change when we are saving
			setEditTimeout(new Date().getTime() - 1000);
		});
	});
	
	useBackgroundLoop(() => {
		if (saveStack.length && !isSaving && !isPublished) {
			save();
		}
	}, 10);

	useEffect(() => {
		if (forceSave > 0) {
			save().then(() => {
				window.sessionStorage.removeItem('branch-id');
				window.location.replace(WEB_URL);
			});
		}
	}, [forceSave])

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

	const executeCommand = (component: ComponentElement, update: ComponentUpdate[], execute=true): void => {
		const newCommand: HarmonyCommand = {
			name: 'change',
			update: update.filter(update => update.oldValue !== update.value),
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
				newCommand.update[0].oldValue = lastEdits.update[0].oldValue;
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

	const change = ({update}: HarmonyCommandChange): void => {
		if (!rootComponent) return;
		for (let i = 0; i < update.length; i++) {
			const element = findElementFromId(update[i].componentId, update[i].parentId, update[i].childIndex);
			if (element === undefined) return;
			
			makeUpdates(element, [update[i]], rootComponent, fonts);
		}

		onChange && onChange();
	}

	const changeStack = (from: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>], to: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>]) => {
		const [fromValue, fromSet] = from;
		const [toValue, toSet] = to;

		if (fromValue.length === 0) return;
		const lastEdit = fromValue[fromValue.length - 1];
		const newUpdates = lastEdit.update.map(up => ({...up, value: up.oldValue, oldValue: up.value}))
		const newEdit: HarmonyCommand = {name: 'change', update: newUpdates};
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

	const saveCommand = async (commands: HarmonyCommand[], save: {branchId: string, repositoryId: string}) => {
		setIsSaving(true);
		const cmds = commands.map(cmd => ({update: cmd.update}))
		const data: UpdateRequest = {values: cmds, repositoryId: save.repositoryId};
		const result = await fetch(`${WEB_URL}/api/update/${save.branchId}`, {
			method: 'POST',
			body: JSON.stringify(data)
		});
		setIsSaving(false);

		if (!result.ok) {
			throw new Error("There was an problem saving the changes");
		}

		const resultData = updateResponseSchema.parse(await result.json());

		return resultData.errorUpdates;
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

function makeUpdates(el: HTMLElement, updates: ComponentUpdate[], rootComponent: HTMLElement, fonts: Font[] | undefined) {
	let alreadyDoneText = false;
	const id = el.dataset.harmonyId;
	const parentId = el.dataset.harmonyParentId;
	if (!id || !parentId) {
		return;
	}

	const translated = translateUpdatesToCss(updates);

	//TODO: make the value string splitting be a regex thing with groups

	//Updates that should happen just for the element (reordering)
	for (const update of translated) {
		const parent = el.parentElement;
		if (!parent) throw new Error("Element does not have a parent");

		if (update.type === 'component') {
			if (update.name === 'reorder') {
				const [fromStr, toStr] = update.value.split(':');
				const [_, from] = fromStr.split('=');
				const [_2, to] = toStr.split('=');

				
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

		//TODO: Need to figure out when a text component should update everywhere and where it should update just this element
		if (update.type === 'text') {
			const textNodes = Array.from(el.childNodes).filter(node => node.nodeType === Node.TEXT_NODE || (node as HTMLElement).dataset.harmonyText === 'true');
			const index = parseInt(update.name);
			if (isNaN(index)) {
				throw new Error("Invalid update text element " + update.name);
			}
			if (textNodes[index].textContent !== update.value && textNodes[index].textContent === update.oldValue) {
				textNodes[index].textContent = update.value;
				alreadyDoneText = true;
			}
		}

		//TODO: Find a better way to exclude margin class names from being applied to all elements.
		//Probably the solution is figure out what needs to applied to all elements by indexing the code base before hand
		// if (update.type === "className" && update.name.includes('margin')) {
		// 	el.style[update.name as unknown as number]= update.value;
		// }
	}

	//Updates that should happen for every element in a component
	const sameElements = rootComponent.querySelectorAll(`[data-harmony-id="${id}"][data-harmony-parent-id="${parentId}"]`);
	for (const element of Array.from(sameElements)) {
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		const htmlElement = element as HTMLElement;
		for (const update of translated) {
			if (update.childIndex !== childIndex) continue;

			if (update.type === 'className') {
				if (update.name === 'font') {
					if (!fonts) {
						console.log("No fonts are installed");
						continue;
					}
					const font = fonts.find(f => f.id === update.value);
					if (!font) throw new Error("Invlaid font " + update.value);

					fonts.forEach(f => {
						htmlElement.className = htmlElement.className.replace(f.id, '');
					})

					htmlElement.classList.add(font.font.className);
				} else if (true || !update.name.includes('margin')) {
					htmlElement.style[update.name as unknown as number]= update.value;
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
