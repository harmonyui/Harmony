
/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/
/* eslint-disable import/no-cycle -- TODO: Fix later */
"use client";
import { MinimizeIcon } from "@harmony/ui/src/components/core/icons";
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { DEFAULT_HEIGHT as HEIGHT, DEFAULT_WIDTH as WIDTH } from '@harmony/util/src/constants';
import type { Font } from "@harmony/util/src/fonts";
import type { BehaviorType, ComponentUpdate } from "@harmony/util/src/types/component";
import type { UpdateRequest } from "@harmony/util/src/types/network";
import type { Environment } from '@harmony/util/src/utils/component';
import { getWebUrl, reverseUpdates, translateUpdatesToCss } from '@harmony/util/src/utils/component';
import hotkeys from 'hotkeys-js';
import $ from 'jquery';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveProject } from "../data-layer";
import { recurseElements } from "../utils/element-utils";
import type { ComponentUpdateWithoutGlobal, DisplayMode, SelectMode } from "./harmony-context";
import { HarmonyContext, viewModes } from "./harmony-context";
import type { Setup } from "./harmony-setup";
import { Inspector, isSelectable, replaceTextContentWithSpans, selectDesignerElement } from "./inspector/inspector";
import { HarmonyPanel } from "./panel/harmony-panel";
import { WelcomeModal } from "./panel/welcome/welcome-modal";
import { getBoundingRect } from "./snapping/calculations";
import { useHarmonyStore } from "./hooks/state";
import { GlobalUpdatePopup } from "./panel/global-change-popup";

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
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({ repositoryId, children, branchId, fonts, setup, environment = 'production' }) => {
	const [isToggled, setIsToggled] = useState(true);
	const [hoveredComponent, setHoveredComponent] = useState<HTMLElement>();
	const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
	const harmonyContainerRef = useRef<HTMLDivElement | null>(null);
	const [mode, setMode] = useState<SelectMode>('tweezer');
	const [scale, _setScale] = useState(.8);
	const [isDirty, setIsDirty] = useState(false);
	const [updateOverlay, setUpdateOverlay] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [displayMode, setDisplayMode] = useState<DisplayMode>();
	const [cursorX, setCursorX] = useState(0);
	const [cursorY, setCursorY] = useState(0);
	const [oldScale, setOldSclae] = useState(scale);
	const [forceSave, setForceSave] = useState(0);
	const [error, setError] = useState<string | undefined>();
	const [showGiveFeedback, setShowGiveFeedback] = useState(false);
	const [behaviors, setBehaviors] = useState<BehaviorType[]>([]);
	const [isGlobal, setIsGlobal] = useState(false);
	const harmonyComponents = useHarmonyStore((state) => state.harmonyComponents);
	const pullRequest = useHarmonyStore((state) => state.pullRequest);
	const componentUpdates = useHarmonyStore((state) => state.componentUpdates);
	const isInitialized = useHarmonyStore((state) => state.isInitialized);
	const publishState = useHarmonyStore(state => state.pullRequest);
	const globalUpdate = useHarmonyStore(state => state.globalUpdate);
	const onApplyGlobal = useHarmonyStore(state => state.onApplyGlobal);
	const initializeProject = useHarmonyStore(state => state.initializeProject);
	const updateComponentsFromIds = useHarmonyStore((state) => state.updateComponentsFromIds);
	const selectedComponent = useHarmonyStore(state => state.selectedComponent?.element);
	const setSelectedComponent = useHarmonyStore(state => state.selectElement);

	const { executeCommand, onUndo } = useComponentUpdator({
		isSaving, environment, setIsSaving, fonts, isPublished: Boolean(pullRequest), branchId, repositoryId, rootComponent, forceSave, behaviors, onChange() {
			setUpdateOverlay(updateOverlay + 1);
		}, onError: setError
	});

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

			await initializeProject({ branchId, repositoryId });
		}

		void initialize();

		window.addEventListener('popstate', onHistoryChange);


		return () => { window.removeEventListener('popstate', onHistoryChange); };
	}, []);

	useEffect(() => {
		if (displayMode?.includes('preview')) {
			setIsToggled(false);
			setScale(0.5, { x: 0, y: 0 });
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
		setScale(Math.min(scale + .25, 5), { x: cursorX, y: cursorY });
	})

	const onScaleOut = useEffectEvent((e: KeyboardEvent) => {
		e.preventDefault();
		setScale(Math.min(scale - .25, 5), { x: cursorX, y: cursorY });
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
		if (rootComponent && isInitialized) {
			const recurseAndUpdateElements = () => {
				const componentIds: string[] = [];
				recurseElements(rootComponent, [updateElements(componentUpdates, componentIds)]);

				void updateComponentsFromIds({ branchId, components: componentIds }, rootComponent);
			}
			const mutationObserver = new MutationObserver(() => {
				recurseAndUpdateElements();
			});
			const body = rootComponent.querySelector('body');
			mutationObserver.observe(body || rootComponent, {
				childList: true,
			});
			recurseAndUpdateElements();

			//Hacky fix for the toolbar zooming weird and the user does not have the updated editor
			const harmonyContainer = document.getElementById('harmony-container');
			if (harmonyContainer && harmonyContainer.className.includes('hw-h-full')) {
				harmonyContainer.classList.add('hw-w-full');
			}
		}
	}, [rootComponent, isInitialized]);

	const updateElements = (componentUpdates: ComponentUpdate[], componentIds: string[]) => (element: HTMLElement): void => {
		if (!rootComponent) return;

		let id = element.dataset.harmonyId;
		if (id && id !== 'undefined') {
			const split = id.split('#');
			const componentId = split[split.length - 1];
			element.dataset.harmonyComponentId = componentId;

			if (/pages\/_app\.(tsx|jsx|js)/.exec(atob(split[0]))) {
				id = split.slice(1).join('#');
				element.dataset.harmonyId = id;
			}

			componentIds.push(id);
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
			const updates = componentUpdates.filter(up => up.componentId === id && up.childIndex === childIndex);
			makeUpdates(element, updates, rootComponent, fonts);
		}
	}

	const setScale = useCallback((newScale: number, _: { x: number, y: number }) => {
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

		const componentId = selectedComponent.dataset.harmonyText === 'true' ? selectedComponent.parentElement!.dataset.harmonyId : selectedComponent.dataset.harmonyId;
		let index = 0;
		let childIndex = Array.from(selectedComponent.parentElement!.children).indexOf(selectedComponent);
		if (!componentId) {
			if (selectedComponent.dataset.harmonyText === 'true') {
				const element = selectedComponent.parentElement;
				if (!element) {
					throw new Error("Error when getting component parent in harmony text");
				}
				index = Array.from(element.children).indexOf(selectedComponent);
				childIndex = Array.from(element.parentElement!.children).indexOf(element)
			}

			if (!componentId || index < 0) {
				throw new Error("Error when getting component");
			}
		}

		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdateWithoutGlobal = { componentId, type: 'text', name: String(index), value, oldValue, childIndex }
		onAttributesChange([update], false);
	});

	const onReorder = useEffectEvent(({ from, to, element }: { from: number, to: number, element: HTMLElement }) => {
		const componentId = element.dataset.harmonyText === 'true' ? element.parentElement!.dataset.harmonyId : element.dataset.harmonyId;
		if (!componentId) throw new Error("Error when getting component");

		const value = `from=${from}:to=${to}`
		const oldValue = `from=${to}:to=${from}`;
		const childIndex = Array.from(element.parentElement!.children).indexOf(element);
		if (childIndex < 0) throw new Error("Cannot get right child index");

		const update: ComponentUpdateWithoutGlobal = { componentId, type: 'component', name: 'reorder', value, oldValue, childIndex };

		onAttributesChange([update], false);
	})

	const onAttributesChange = (updates: ComponentUpdateWithoutGlobal[], execute = true) => {
		let components = updates.map(update => harmonyComponents.find(component => component.id === update.componentId));
		let globalChange = false;
		components.forEach(component => {
			const updateType = updates.find(update => update.componentId === component?.id)?.type;
			const prop = component?.props.find(prop => prop.propName === updateType);
			if (prop && !prop.isStatic) globalChange = true;
		})

		executeCommand(updates.map(update => ({ ...update, isGlobal: false })), execute);

		if (globalChange) {
			const update: ComponentUpdate = {
				componentId: updates[0].componentId,
				type: updates[0].type,
				name: updates[0].name,
				value: updates[0].value,
				oldValue: updates[0].oldValue,
				childIndex: updates[0].childIndex,
				isGlobal: true
			}
			onApplyGlobal(update);
		}

		//setCurrUpdates({updates, execute});
	}

	const onElementChange = (element: HTMLElement, update: ComponentUpdateWithoutGlobal[], execute = true) => {
		onAttributesChange(update, execute);
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
			{<HarmonyContext.Provider value={{ isSaving, setIsSaving, displayMode: displayMode || 'designer', changeMode, fonts, onFlexToggle: onFlexClick, scale, onScaleChange: setScale, onClose, error, setError, environment, showGiveFeedback, setShowGiveFeedback, behaviors, setBehaviors, isGlobal, setIsGlobal, onComponentHover: setHoveredComponent, onComponentSelect: setSelectedComponent, selectedComponent, onAttributesChange }}>
				{displayMode && displayMode !== 'preview-full' ? <>
					<HarmonyPanel root={rootComponent} onAttributesChange={onAttributesChange} mode={mode} onModeChange={setMode} toggle={isToggled} onToggleChange={setIsToggled} isDirty={isDirty} setIsDirty={setIsDirty} >
						<div style={{ width: `${WIDTH * scale}px`, minHeight: `${HEIGHT * scale}px` }}>
							<div id="harmony-scaled" ref={(d) => {
								if (d && d !== harmonyContainerRef.current) {
									harmonyContainerRef.current = d
									setRootComponent(harmonyContainerRef.current);
								}
							}} style={{ width: `${WIDTH}px`, minHeight: `${HEIGHT}px`, transformOrigin: "0 0", transform: `scale(${scale})` }}>
								{isToggled ? <Inspector rootElement={rootComponent} parentElement={rootComponent} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent} onElementTextChange={onTextChange} onReorder={onReorder} mode={mode} updateOverlay={updateOverlay} scale={scale} onChange={onElementChange} /> : null}
								{children}
							</div>
						</div>
					</HarmonyPanel>
				</> : <div className="hw-fixed hw-z-[100] hw-group hw-p-2">
					<button className="hw-bg-[#11283B] hover:hw-bg-[#11283B]/80 hw-rounded-md hw-p-2" onClick={onMinimize}>
						<MinimizeIcon className="hw-h-5 hw-w-5 hw-fill-white hw-stroke-none" />
					</button>
				</div>}
				<WelcomeModal />
				<GlobalUpdatePopup onUndo={onUndo} executeCommand={executeCommand} />
			</HarmonyContext.Provider>}
		</>
	)
}

export const usePinchGesture = ({ scale, onTouching }: { scale: number, onTouching: (scale: number, cursorPos: { x: number, y: number }) => void }) => {
	const onTouch = useEffectEvent((event: WheelEvent) => {
		if (!event.ctrlKey) return;
		event.preventDefault();

		const delta = event.deltaY;
		const scaleFactor = 0.01; // Adjust sensitivity as needed
		const newScale = scale - scaleFactor * delta;

		// Update the scale state, ensuring it doesn't go below a minimum value
		onTouching(Math.max(0.1, newScale), { x: event.clientX, y: event.clientY });
	});

	return { onTouch };
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
const useComponentUpdator = ({ onChange, branchId, repositoryId, isSaving, isPublished, setIsSaving, rootComponent, fonts, forceSave, onError, environment }: ComponentUpdatorProps) => {
	const [undoStack, setUndoStack] = useState<HarmonyCommand[]>([]);
	const [redoStack, setRedoStack] = useState<HarmonyCommand[]>([]);
	const [saveStack, setSaveStack] = useState<HarmonyCommand[]>([]);
	const [editTimeout, setEditTimeout] = useState(new Date().getTime());
	const addUpdates = useHarmonyStore(state => state.addComponentUpdates);

	const WEB_URL = useMemo(() => getWebUrl(environment), [environment]);

	const save = useEffectEvent(() => {
		return new Promise<void>((resolve) => {
			const copy = saveStack.slice();
			saveCommand(saveStack, { branchId, repositoryId }).then((errorUpdates) => {
				if (errorUpdates.length > 0) {
					change({ name: 'change', update: errorUpdates });
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
					change({ name: update.name, update: reverseUpdates(update.update) });
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

	const executeCommand = (update: ComponentUpdate[], execute = true): void => {
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
		addUpdates(newCommand.update);
		setUndoStack(newEdits);
		setSaveStack(newSaves);
		setRedoStack([]);
	}

	const change = ({ update }: HarmonyCommandChange): void => {
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

		const newUpdates = lastEdit.update.map(up => ({ ...up, value: up.oldValue, oldValue: up.value }))
		const newEdit: HarmonyCommand = { name: 'change', update: newUpdates };
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

		addUpdates(newEdit.update);
	}

	const onUndo = useEffectEvent(() => {
		changeStack([undoStack, setUndoStack], [redoStack, setRedoStack]);
	});

	const onRedo = useEffectEvent(() => {
		changeStack([redoStack, setRedoStack], [undoStack, setUndoStack]);
	});

	const saveCommand = async (commands: HarmonyCommand[], save: { branchId: string, repositoryId: string }) => {
		setIsSaving(true);
		const cmds = commands.map(cmd => ({ update: cmd.update }));
		const data: UpdateRequest = { values: cmds, repositoryId: save.repositoryId, branchId };
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


	return { executeCommand, onUndo };
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
		const update = { ...orig };
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


				const { oldValue, value } = update;
				const { parentId: oldParent, childIndex: oldChildIndex }: { parentId: string, childIndex: number } = JSON.parse(oldValue);
				const { parentId: newParent, childIndex: newChildIndex }: { parentId: string, childIndex: number } = JSON.parse(value);
				const error = `makeUpdates: Invalid reorder update componentId: ${update.componentId} oldParent: ${oldParent} newParent: ${newParent} oldChildIndex: ${oldChildIndex} newChildIndex: ${newChildIndex}`

				const validateId = (id: string) => {
					return id.trim().length > 0;
				}

				if (!validateId(update.componentId) || !validateId(oldParent) || !validateId(newParent)) {
					throw new Error(error);
				}

				const oldElement = findElementFromId(update.componentId, oldChildIndex);

				// Verify that we could find the old element to be deleted from the DOM
				if (!oldElement) {
					throw new Error(`makeUpdates: Cannot find from element with componentId ${update.componentId} and childIndex ${oldChildIndex}`);
				}

				oldElement.remove();

				// Add element to new parent
				const newElement = document.querySelector(`[data-harmony-id="${newParent}"]`);
				if (newElement) {
					const children = Array.from(newElement.children);
					if (newChildIndex >= 0 && newChildIndex < children.length) {
						newElement.insertBefore(oldElement, children[newChildIndex]);
					} else {
						newElement.appendChild(oldElement);
					}
				} else {
					throw new Error(`makeUpdates: Cannot find the elements parent with data-harmony-id: ${newParent}`);
				}
			}
		}

		//TODO: Need to figure out when a text component should update everywhere and where it should update just this element
		if (update.type === 'text') {
			const textNodes = Array.from(el.childNodes)
			const index = parseInt(update.name);
			if (isNaN(index)) {
				throw new Error(`Invalid update text element ${update.name}`);
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
					if (!font) throw new Error(`Invlaid font ${update.value}`);

					fonts.forEach(f => {
						htmlElement.className = htmlElement.className.replace(f.id, '');
					})

					htmlElement.classList.add(font.font.className);
				} else {
					htmlElement.style[update.name as unknown as number] = update.value;
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