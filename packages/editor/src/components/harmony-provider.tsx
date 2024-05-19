 
/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/
/* eslint-disable import/no-cycle -- TODO: Fix later */
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BehaviorType, ComponentElement, ComponentError, ComponentUpdate } from "@harmony/util/src/types/component";
import type {PublishRequest, PublishResponse, UpdateRequest} from "@harmony/util/src/types/network";
import type { Environment} from '@harmony/util/src/utils/component';
import {translateUpdatesToCss, reverseUpdates , getWebUrl } from '@harmony/util/src/utils/component';
import hotkeys from 'hotkeys-js';
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { MinimizeIcon } from "@harmony/ui/src/components/core/icons";
import type { PullRequest } from "@harmony/util/src/types/branch";
import type { Font } from "@harmony/util/src/fonts";
import $ from 'jquery';
import {DEFAULT_WIDTH as WIDTH, DEFAULT_HEIGHT as HEIGHT} from '@harmony/util/src/constants';
import { loadProject, publishProject, saveProject } from "../data-layer";
import { HarmonyPanel} from "./panel/harmony-panel";
import { getBoundingRect } from "./snapping/calculations";
import { WelcomeModal } from "./panel/welcome/welcome-modal";
import type { Setup } from "./harmony-setup";
import { Inspector, componentIdentifier, isSelectable, replaceTextContentWithSpans, selectDesignerElement } from "./inspector/inspector";
import type { ComponentUpdateWithoutGlobal, DisplayMode, SelectMode} from "./harmony-context";
import { HarmonyContext, viewModes } from "./harmony-context";

export function findElementFromId(componentId: string, childIndex: number): HTMLElement | undefined {
	const selector = `[data-harmony-id="${componentId}"]`;
	const container = document.getElementById('harmony-container');
	if (!container) {
		throw new Error("Cannot find container harmony-container");
	}
	const elements = container.querySelectorAll(selector);
	for (const element of Array.from(elements)) {
		const elementChildIndex = Array.from(element.parentElement?.children || []).indexOf(element);
		if (elementChildIndex === childIndex) return element as HTMLElement;
	}

	return undefined;
}

export function findElementsFromId(componentId: string): HTMLElement[] {
	const selector = `[data-harmony-id="${componentId}"]`;
	const container = document.getElementById('harmony-container');
	if (!container) {
		throw new Error("Cannot find container harmony-container");
	}
	const elements = container.querySelectorAll(selector);
	return Array.from(elements) as HTMLElement[];
}

export function findSameElementsFromId(componentId: string): HTMLElement[] {
	const selector = `[data-harmony-component-id="${componentId}"]`;
	const container = document.getElementById('harmony-container');
	if (!container) {
		throw new Error("Cannot find container harmony-container");
	}
	const elements = container.querySelectorAll(selector);
	return Array.from(elements) as HTMLElement[];
}

export interface HarmonyProviderProps {
	repositoryId: string;
	branchId: string;
	children: React.ReactNode;
	setup: Setup;
	fonts?: Font[];
	environment?: Environment
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({repositoryId, children, branchId, fonts, setup, environment='production'}) => {
	const [isToggled, setIsToggled] = useState(true);
	const [selectedComponent, _setSelectedComponent] = useState<HTMLElement>();
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
	const harmonyContainerRef = useRef<HTMLDivElement | null>(null);
	const [mode, setMode] = useState<SelectMode>('tweezer');
	const [availableIds, setAvailableIds] = useState<ComponentUpdate[]>();
	const [errorElements, setErrorElements] = useState<ComponentError[]>();
	const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
	const [scale, _setScale] = useState(.8);
	const [isDirty, setIsDirty] = useState(false);
	const [updateOverlay, setUpdateOverlay] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [pullRequest, setPullRequest] = useState<PullRequest | undefined>();
	const [displayMode, setDisplayMode] = useState<DisplayMode>();
	const [publishState, setPublishState] = useState<PullRequest | undefined>();
	const [cursorX, setCursorX] = useState(0);
	const [cursorY, setCursorY] = useState(0);
	const [oldScale, setOldSclae] = useState(scale);
	const [forceSave, setForceSave] = useState(0);
	const [error, setError] = useState<string | undefined>();
	const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(false);
	const [showGiveFeedback, setShowGiveFeedback] = useState(false);
	const [isDemo, setIsDemo] = useState(false);
	const [behaviors, setBehaviors] = useState<BehaviorType[]>([]);
	const [isGlobal, setIsGlobal] = useState(false);
	//const [currUpdates, setCurrUpdates] = useState<{updates: ComponentUpdateWithoutGlobal[], execute: boolean}>();

	const executeCommand = useComponentUpdator({isSaving, environment, setIsSaving, fonts, isPublished: Boolean(pullRequest), branchId, repositoryId, rootComponent, forceSave, behaviors, onChange() {
		setUpdateOverlay(updateOverlay + 1);
	}, onError: setError});

	const onHistoryChange = () => {
		const url = new URL(window.location.href);
		let _mode = url.searchParams.get('mode');
		if (!_mode) {
			_mode = window.sessionStorage.getItem('harmony-mode');
			_mode && url.searchParams.set('mode', _mode);
			window.history.pushState(publishState, 'mode', url.href);
		}
		if (_mode && (viewModes as readonly string[]).includes(_mode)) {
			setDisplayMode(_mode as DisplayMode);
			setup.changeMode(_mode as DisplayMode);
		}

		

		if (!_mode) {
			changeMode('designer');
		}
	}
	
	useEffect(() => {
		const initialize = async () => {
			onHistoryChange();

			try {
				const response = await loadProject({branchId, repositoryId});
				// const response = await fetch(`${WEB_URL}/api/load/${repositoryId}${branchId ? `?branchId=${branchId}` : ''}`, {
				// 	method: 'GET',
				// 	headers: {
				// 		'Accept': 'application/json',
				// 		'Content-Type': 'application/json'
				// 	},
				// });

				 
				const {updates, branches, pullRequest, errorElements, showWelcomeScreen, isDemo} = response;
				setAvailableIds(updates);
				setBranches(branches);
				setPullRequest(pullRequest);
				setErrorElements(errorElements);
				setShowWelcomeScreen(showWelcomeScreen);
				setIsDemo(isDemo);
			} catch(err) {
				console.log(err);
			}
		}

		void initialize();

		window.addEventListener('popstate', onHistoryChange);

		
		return () => { window.removeEventListener('popstate', onHistoryChange); };
	}, []);

	useEffect(() => {
		if (displayMode?.includes('preview')) {
			setIsToggled(false);
			setScale(0.5, {x: 0, y: 0});
		}

		if (displayMode === 'designer') {
			setIsToggled(true);
		}
	}, [displayMode, harmonyContainerRef])

	const onToggle = useEffectEvent(() => {
		setIsToggled(!isToggled);
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
		
		return () => { hotkeys.unbind('esc', onToggle); };
	}, []);

	useEffect(() => {
		if (!isToggled) {
			setSelectedComponent(undefined);
		}
	}, [isToggled]);

	useEffect(() => {
		const scrollContainer = document.getElementById("harmony-scroll-container")
		if (scrollContainer) {
			//TODO: Hacky beyond hacky (we want to center the screen)
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
			const mutationObserver = new MutationObserver(() => {
				updateElements(rootComponent, availableIds, errorElements);
			});
			const body = rootComponent.querySelector('body');
			mutationObserver.observe(body || rootComponent, {
				childList: true,
				//subtree: true,
			});

			updateElements(rootComponent, availableIds, errorElements);

			//Hacky fix for the toolbar zooming weird and the user does not have the updated editor
			const harmonyContainer = document.getElementById('harmony-container');
			if (harmonyContainer && harmonyContainer.className.includes('hw-h-full')) {
				harmonyContainer.classList.add('hw-w-full');
			}
		}
	}, [rootComponent, availableIds, errorElements]);

	const updateElements = (element: HTMLElement, availableIds: ComponentUpdate[], errorElements: ComponentError[]): void => {
		if (!rootComponent) return;
		const errorComponent = errorElements.find(el => el.componentId === element.dataset.harmonyId)
		if (errorComponent) {
			const type = errorComponent.type;
			element.dataset.harmonyError = type;
		}

		let id = element.dataset.harmonyId;
		if (id && id !== 'undefined') {
			const split = id.split('#');
			const componentId = split[split.length - 1];
			element.dataset.harmonyComponentId = componentId;

			if (/pages\/_app\.(tsx|jsx|js)/.exec(atob(split[0]))) {
				id = split.slice(1).join('#');
				element.dataset.harmonyId = id;
			}
		}
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		const children = Array.from(element.childNodes);
		const textNodes = children.filter(child => child.nodeType === Node.TEXT_NODE);
		const styles = getComputedStyle(element);
		//Sticky elements behavior weirdly in the editor (follow us down the screen at a slow pace), so let's make them not sticky
		if (styles.position === 'sticky') {
			element.style.position = 'relative';
		}

		//TODO: Do this better so there is no dependency on this action in this function
		//If there are text nodes and non-text nodes inside of an element, wrap the text nodes in
		//span tags so we can select and edit them
		if (textNodes.length > 0 && (children.length > textNodes.length || ['Bottom', 'Top', 'Left', 'Right'].some(d => parseFloat($(element).css(`padding${d}`)) !== 0))) {
			replaceTextContentWithSpans(element);
		}

		if (id !== undefined) {
			const updates = availableIds.filter(up => up.componentId === id && up.childIndex === childIndex);
			makeUpdates(element, updates, rootComponent, fonts);
		}

		Array.from(element.children).filter(child => (child as HTMLElement).dataset.harmonyText !== 'true').forEach(child => { updateElements(child as HTMLElement, availableIds, errorElements); });
	}

	const setScale = useCallback((newScale: number, _: {x: number, y: number}) => {
		const scrollContainer = document.getElementById("harmony-scroll-container");

		//Adjust the scroll so that it zooms with the pointer
		if (rootComponent && scrollContainer) {
			const currScrollLeft = scrollContainer.scrollLeft;
			const currScrollTop = scrollContainer.scrollTop;
			const rootRect = getBoundingRect(rootComponent);
			
			const offsetX = cursorX - rootRect.left;
			const offsetY = cursorY - rootRect.top;
			const scaleDelta = newScale - scale
			// const scrollLeft = (offsetX / scale);
			// const scrollTop = (offsetY / scale);

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
		let childIndex = Array.from(selectedComponent.parentElement!.children).indexOf(selectedComponent);
		if (!component) {
			if (selectedComponent.dataset.harmonyText === 'true') {
				const element = selectedComponent.parentElement;
				if (!element) {
					throw new Error("Error when getting component parent in harmony text");
				}
				component = componentIdentifier.getComponentFromElement(element);
				index = Array.from(element.children).indexOf(selectedComponent);
				childIndex = Array.from(element.parentElement!.children).indexOf(element)
			}

			if (!component || index < 0) {
				throw new Error("Error when getting component");
			}
		}

		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdateWithoutGlobal = {componentId: component.id, type: 'text', name: String(index), action: 'change', value, oldValue, childIndex}
		onAttributesChange([update], false);
	});

	const onReorder = useEffectEvent(({from, to, element}: {from: number, to: number, element: HTMLElement}) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) throw new Error("Error when getting component");
		
		const value = `from=${from}:to=${to}`
		const oldValue = `from=${to}:to=${from}`;
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdateWithoutGlobal = {componentId: component.id, type: 'component', name: 'reorder', action: 'change', value, oldValue, childIndex};
		
		onAttributesChange([update], false);
	})

	const onAttributesChange = (updates: ComponentUpdateWithoutGlobal[], execute=true) => {
		executeCommand(updates.map(update => ({...update, isGlobal})), execute);
		//setCurrUpdates({updates, execute});
	}

	const onElementChange = (element: HTMLElement, update: ComponentUpdateWithoutGlobal[], execute=true) => {
		const component = componentIdentifier.getComponentFromElement(element);
		if (!component) {
			throw new Error("Error when getting component");
		}

		onAttributesChange(update, execute);
	}

	const onPublish = async (request: PublishRequest): Promise<PublishResponse | undefined> => {
		try {
			// const response = await fetch(`${WEB_URL}/api/publish`, {
			// 	method: 'POST',
			// 	body: JSON.stringify(request)
			// });
			// if (!response.ok) {
			// 	return undefined;
			// }


			// const parsed = publishResponseSchema.safeParse(await response.json());
			// if (!parsed.success) {
			// 	return undefined;
			// }

			const response = await publishProject(request);

			setPullRequest(response.pullRequest);

			return response;
		} catch(err) {
			return undefined
		}
	}

	const setSelectedComponent = (component: HTMLElement | undefined): void => {
		_setSelectedComponent(component);
	}
	
	const changeMode = (mode: DisplayMode) => {
		const url = new URL(window.location.href);
		url.searchParams.set('mode', mode);

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

	// const onFinishGlobalUpdates = (updates: ComponentUpdate[]) => {
	// 	executeCommand(updates, currUpdates?.execute);
	// 	setCurrUpdates(undefined);
	// }

	return (
		<>
			{<HarmonyContext.Provider value={{branchId: branchId || '', publish: onPublish, isSaving, setIsSaving, pullRequest, setPullRequest, displayMode: displayMode || 'designer', changeMode, publishState, setPublishState, fonts, onFlexToggle: onFlexClick, scale, onScaleChange: setScale, onClose, error, setError, environment, showWelcomeScreen, setShowWelcomeScreen, showGiveFeedback, setShowGiveFeedback, isDemo, currentBranch: branches.find(branch => branch.id === branchId), behaviors, setBehaviors, isGlobal, setIsGlobal, onComponentHover: setHoveredComponent, onComponentSelect: setSelectedComponent, selectedComponent, onAttributesChange}}>
				{displayMode && displayMode !== 'preview-full' ? <>
					<HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} mode={mode} onModeChange={setMode} toggle={isToggled} onToggleChange={setIsToggled} isDirty={isDirty} setIsDirty={setIsDirty} branchId={branchId} branches={branches}>
						<div style={{width: `${WIDTH*scale}px`, minHeight: `${HEIGHT*scale}px`}}>
							<div id="harmony-scaled" ref={(d) => {
								if (d && d !== harmonyContainerRef.current) {
									harmonyContainerRef.current = d
									setRootComponent(harmonyContainerRef.current);
								}
							}} style={{width: `${WIDTH}px`, minHeight: `${HEIGHT}px`, transformOrigin: "0 0", transform: `scale(${scale})`}}>
							{isToggled ? <Inspector rootElement={rootComponent} parentElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} onElementTextChange={onTextChange} onReorder={onReorder} mode={mode} updateOverlay={updateOverlay} scale={scale} onChange={onElementChange}/> : null}	
							{children}
							</div>
						</div>
					</HarmonyPanel>
				</> : <div className="hw-fixed hw-z-[100] hw-group hw-p-2">
					<button className="hw-bg-[#11283B] hover:hw-bg-[#11283B]/80 hw-rounded-md hw-p-2" onClick={onMinimize}>
						<MinimizeIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none"/>
					</button>
				</div>}
				<WelcomeModal />
				{/* {currUpdates ? <GlobalUpdateModal updates={currUpdates.updates || []} onFinish={onFinishGlobalUpdates}/> : null} */}
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
	environment: Environment;
	behaviors: BehaviorType[];
}
const useComponentUpdator = ({onChange, branchId, repositoryId, isSaving, isPublished, setIsSaving, rootComponent, fonts, forceSave, onError, environment}: ComponentUpdatorProps) => {
	const [undoStack, setUndoStack] = useState<HarmonyCommand[]>([]);
	const [redoStack, setRedoStack] = useState<HarmonyCommand[]>([]);
	const [saveStack, setSaveStack] = useState<HarmonyCommand[]>([]);
	const [editTimeout, setEditTimeout] = useState(new Date().getTime());

	const WEB_URL = useMemo(() => getWebUrl(environment), [environment]);

	const save = useEffectEvent(() => {
		return new Promise<void>((resolve) => {
			const copy = saveStack.slice();
			saveCommand(saveStack, {branchId, repositoryId}).then((errorUpdates) => {
				if (errorUpdates.length > 0) {
					change({name: 'change', update: errorUpdates});
					errorUpdates.forEach(error => {
						const elements = findElementsFromId(error.componentId);
						elements.forEach(element => {
							element.dataset.harmonyError = error.errorType;
						})
					})
					onError("Some elements are not updateable at the moment");
				}
				resolve();
			}).catch(() => {
				setIsSaving(false);
				//TODO: Test this
				for (let i = copy.length - 1; i >= 0; i--) {
					const update = copy[i];
					//if (!update) throw new Error("Need to have an update");
					change({name: update.name, update: reverseUpdates(update.update)});
				}
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
			void save();
		}
	}, 10);

	useEffect(() => {
		if (forceSave > 0) {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises -- ok
			save().then(() => {
				window.sessionStorage.removeItem('branch-id');
				window.location.replace(WEB_URL);
			});
		}
	}, [forceSave])

	const onLeave = useEffectEvent((e: BeforeUnloadEvent) => {
		if ((saveStack.length > 0 || isSaving) && !isPublished) {
			e.preventDefault();
			return "Are you sure you want to leave?";
		}
	})

	useEffect(() => {
		window.addEventListener('beforeunload', onLeave);

		return () => { window.removeEventListener('beforeunload', onLeave); };
	}, []);

	const executeCommand = (update: ComponentUpdate[], execute=true): void => {
		const newCommand: HarmonyCommand = {
			name: 'change',
			update: update.filter(update => update.oldValue !== update.value)//.map(update => ({...update, behaviors})),
		}

		//TODO: find a better way to do this
		if (execute)
			change(newCommand);

		const newEdits = undoStack.slice();
		const newSaves = saveStack.slice();
		const lastEdits = newEdits[newEdits.length - 1] as HarmonyCommandChange | undefined;
		const lastEdit = lastEdits?.update.length === 1 ? lastEdits.update[0] : undefined;
		const newEdit = newCommand.update.length === 1 ? newCommand.update[0] : undefined;
		const isSameCommandType = newEdit && lastEdit && newEdit.type === lastEdit.type && newEdit.name === lastEdit.name && newEdit.componentId === lastEdit.componentId;

		const currTime = new Date().getTime();
		if (editTimeout < currTime || !isSameCommandType) {
			newEdits.push(newCommand);
			newSaves.push(newCommand);
			const newTime = currTime + 1000;
			setEditTimeout(newTime);
		} else {
			//TODO: Get rid of type = 'component' dependency
			// eslint-disable-next-line no-lonely-if -- ok
			if (newEdits.length && newCommand.update.length === 1 && newCommand.update[0] && lastEdits?.update[0] && newCommand.update[0].type !== 'component') {
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
		for (const up of update) {
			const element = findElementFromId(up.componentId, up.childIndex);
			if (element === undefined) return;
			
			makeUpdates(element, [up], rootComponent, fonts);
		}

		onChange && onChange();
	}

	const changeStack = (from: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>], to: [HarmonyCommandChange[], React.Dispatch<React.SetStateAction<HarmonyCommandChange[]>>]) => {
		const [fromValue, fromSet] = from;
		const [toValue, toSet] = to;

		if (fromValue.length === 0) return;
		const lastEdit = fromValue[fromValue.length - 1];
		//if (!lastEdit) throw new Error("We shouldn't get here");

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
		const cmds = commands.map(cmd => ({update: cmd.update}));
		const data: UpdateRequest = {values: cmds, repositoryId: save.repositoryId, branchId};
		const resultData = await saveProject(data);
		setIsSaving(false);

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

	// useEffect(() => {

	// }, []);


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
	const id = el.dataset.harmonyId;
	if (!id) {
		return;
	}
	const componentId = id.split('#')[id.split('#').length - 1];
	
	let translated = translateUpdatesToCss(updates);

	//TODO: This is kind of a hacky way to deal with the layering issue when we have a map of components
	//When we want global in this scenario, we are going to assume it is the next layer up (which is what isGlobal false does)
	//This might not hold true in all scenarios, but we will assume for now
	translated = translated.map(orig => {
		const update = {...orig};
		const id = update.componentId;
		const sameElements = findElementsFromId(id);
		if (sameElements.length > 1) {
			update.childIndex = -1;
		}

		return update;
	})

	//Updates that should happen just for the element (reordering)
	for (const update of translated) {
		const parent = el.parentElement;
		if (!parent) throw new Error("Element does not have a parent");

		if (update.type === 'component') {
			if (update.name === 'reorder') {
				const [fromStr, toStr] = update.value.split(':');
				if (!fromStr || !toStr) throw new Error(`Invalid update reorder value ${  update.value}`);
				const [_, from] = fromStr.split('=');
				const [_2, to] = toStr.split('=');

				if (!from || !to) throw new Error(`Invalid update reorder value ${  update.value}`);

				
				const fromNum = parseInt(from);
				const toNum = parseInt(to);
				if (isNaN(fromNum) || isNaN(toNum) || fromNum < 0 || toNum < 0 || fromNum >= parent.children.length || toNum >= parent.children.length)
					throw new Error(`Invalid from and to numbers: ${fromNum}, ${toNum}`);

				if (fromNum === toNum) continue;

				const fromElement = parent.children[fromNum];
				//if (!fromElement) throw new Error("Need from element");
				//+1 because we need to get the next sibiling for the insertBefore
				const toElement = parent.children[fromNum < toNum ? toNum + 1 : toNum]// || null;
				parent.insertBefore(fromElement, toElement);
			}
		}

		//TODO: Need to figure out when a text component should update everywhere and where it should update just this element
		if (update.type === 'text') {
			const textNodes = Array.from(el.childNodes)
			const index = parseInt(update.name);
			if (isNaN(index)) {
				throw new Error(`Invalid update text element ${  update.name}`);
			}
			if (textNodes[index]?.textContent !== update.value && textNodes[index]?.textContent === update.oldValue) {
				textNodes[index].textContent = update.value;
			}
		}
	}

	//Updates that should happen for every element in a component
	for (const update of translated) {
		const sameElements = update.isGlobal ? findSameElementsFromId(componentId) : findElementsFromId(id);
		for (const element of Array.from(sameElements)) {
			const childIndex = Array.from(element.parentElement!.children).indexOf(element);
			const htmlElement = element;
			
			//Setting childIndex to -1 means that we want to update all items in a list
			if (!update.isGlobal && update.childIndex > -1 && update.childIndex !== childIndex) continue;

			if (update.type === 'className') {
				if (update.name === 'font') {
					if (!fonts) {
						console.log("No fonts are installed");
						continue;
					}
					const font = fonts.find(f => f.id === update.value);
					if (!font) throw new Error(`Invlaid font ${  update.value}`);

					fonts.forEach(f => {
						htmlElement.className = htmlElement.className.replace(f.id, '');
					})

					htmlElement.classList.add(font.font.className);
				} else {
					htmlElement.style[update.name as unknown as number]= update.value;
				}
			}
		}
	}
}

// interface GlobalUpdateModalProps {
// 	updates: ComponentUpdateWithoutGlobal[]
// 	onFinish: (updates: ComponentUpdate[]) => void;
// }
// const GlobalUpdateModal: React.FunctionComponent<GlobalUpdateModalProps> = ({updates, onFinish}) => {
// 	const [currUpdates, setCurrUpdates] = useState<ComponentUpdate[]>([]);
// 	useEffect(() => {
// 		if (updates.length) {
// 			setCurrUpdates([]);
// 		}
// 	}, [updates])
// 	const currUpdate = updates[currUpdates.length];
// 	const name = currUpdate.componentId;

// 	const addUpdate = (update: ComponentUpdateWithoutGlobal, isGlobal: boolean) => {
// 		const copy = currUpdates.slice();
// 		copy.push({...update, isGlobal});

// 		if (copy.length === updates.length) {
// 			onFinish(copy);
// 		}
// 		setCurrUpdates(copy);
// 	}

// 	const onSingleInstance = useEffectEvent(() => {
// 		addUpdate(currUpdate, false);
// 	})

// 	const onAllInstances = useEffectEvent(() => {
// 		addUpdate(currUpdate, true);
// 	});

// 	return (
// 		<HarmonyModal show={updates.length > 0 && currUpdates.length < updates.length} onClose={onSingleInstance} editor>
// 			<Header level={3}>Update {name}</Header>
// 			You are updating {name} component. Would you like to make changes for all components or just this one instance?
// 			<div className="hw-flex hw-justify-end hw-gap-2">
// 				<Button mode="secondary" onClick={onSingleInstance}>Single Instance</Button>
// 				<Button mode="primary" onClick={onAllInstances}>All Instances</Button>
// 			</div>
// 		</HarmonyModal>
// 	)
// }