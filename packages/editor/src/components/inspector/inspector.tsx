'use client';
import { useHighlighter } from "./highlighter"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { ReactComponentIdentifier } from "./component-identifier";
import hotkeys from 'hotkeys-js';
import { SelectMode } from "../panel/harmony-panel";
import { getNumberFromString, round } from "@harmony/util/src";
import $ from 'jquery';

import { ComponentUpdate } from "@harmony/ui/src/types/component";
import { ResizeValue, useResize, ResizeRect, ResizeDirection, ResizeCoords } from "@harmony/ui/src/hooks/resize";
import { FlexValues, MarginValues, useSnapping } from "../snapping/snapping";
import { usePrevious } from "@harmony/ui/src/hooks/previous";
import {Alert} from '@harmony/ui/src/components/core/alert';

export const componentIdentifier = new ReactComponentIdentifier();

//Returns the element as understood from a designer (no nested containers with one child and no padding)
export function selectDesignerElement(element: HTMLElement): HTMLElement {
	let target = element;
	
	const isSelectable = (element: HTMLElement | null): element is HTMLElement => {
		if (!element) return false;

		return element.children.length === 1 && ['Bottom', 'Top', 'Left', 'Right'].every(d => parseFloat($(element).css(`padding${d}`)) === 0) && element.children[0].clientWidth === element.clientWidth && element.children[0].clientHeight === element.clientHeight;
	}

	while(isSelectable(target.parentElement)) {
		target = target.parentElement;
	}

	return target;
}

export function selectDesignerElementReverse(element: HTMLElement): HTMLElement {
	const isDesignerSelected = element.children.length === 1 && selectDesignerElement(element.children[0] as HTMLElement) === element
	return isDesignerSelected ? element.children[0] as HTMLElement : element;
}

export function isTextElement(element: HTMLElement): boolean {
	return Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE);
}

export function isImageElement(element: Element): boolean {
	return ['img', 'svg'].includes(element.tagName.toLowerCase());
}

export function isSelectable(element: HTMLElement, scale: number): boolean {
	const style = getComputedStyle(element);
	if (style.position === 'absolute') {
		return false;
	}
	const sizeThreshold = 15;
	const rect = element.getBoundingClientRect();
	if (rect.height * scale < sizeThreshold || rect.width < sizeThreshold) {
		return false;
	}

	return true;
}

export function replaceTextContentWithSpans(element: HTMLElement) {
	const children = element.childNodes;
	for (let i = 0; i < children.length; i++) {
		const node = children[i] as HTMLElement;
		if (node.nodeType !== Node.TEXT_NODE) continue;
		if (!node.textContent?.trim()) return;
		const span = document.createElement('span');
		span.dataset.harmonyText = 'true';
		span.appendChild(node);

		const beforeNode = i < children.length - 1 ? children[i + 1] : undefined;
		if (beforeNode) {
			element.insertBefore(span, beforeNode);
		} else {
			element.appendChild(span);
		}
	}
}

export function removeTextContentSpans(element: HTMLElement) {
	const children = element.children;
	for (let i = 0; i < children.length; i++) {
		const node = children[i] as HTMLElement;
		if (node.dataset.harmonyText !== 'true') continue;
		if (!node.textContent) continue;

		const textNode = document.createTextNode(node.textContent);

		
		const beforeNode = i < children.length - 1 ? children[i + 1] : undefined;
		if (beforeNode) {
			element.insertBefore(textNode, beforeNode);
		} else {
			element.appendChild(textNode);
		}
		node.remove();
	}
}

export interface InspectorProps {
	hoveredComponent: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onHover: (component: HTMLElement | undefined) => void;
	onSelect: (component: HTMLElement | undefined) => void;
	rootElement: HTMLElement | undefined;
	parentElement: HTMLElement | undefined;
	onElementTextChange: (value: string, oldValue: string) => void;
	mode: SelectMode;
	onReorder: (props: {from: number, to: number, element: HTMLElement}) => void;
	onChange: (component: HTMLElement, update: ComponentUpdate[], execute?: boolean) => void;
	updateOverlay: number;
	scale: number;
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, onElementTextChange, onReorder, onChange, rootElement, parentElement, mode, updateOverlay, scale}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<Overlay>();
	const [error, setError] = useState<string | undefined>();
	const previousError = usePrevious(error);

	// const {onDrag, isDragging: isResizing} = useResize({onIsDragging(rect, oldRect) {
	// 	const container = containerRef.current;
	// 	if (container === null || parentElement === undefined) return false;

	// 	if (overlayRef.current === undefined) {
	// 		overlayRef.current = new Overlay(container, parentElement);
	// 	}

	// 	if (selectedComponent) {
	// 		overlayRef.current.select(selectedComponent, scale, Boolean(error), {onDrag});
	// 	} else {
	// 		overlayRef.current.remove('select');
	// 	}

	// 	const value = onResize(rect, oldRect);
	// 	setError(value);

	// 	return Boolean(value);
	// }, onDragFinish() {
	// 	const container = containerRef.current;
	// 	if (container === null || parentElement === undefined) return false;

	// 	if (overlayRef.current === undefined) {
	// 		overlayRef.current = new Overlay(container, parentElement);
	// 	}

	// 	if (selectedComponent) {
	// 		overlayRef.current.select(selectedComponent, scale, false, {onDrag});
	// 	} else {
	// 		overlayRef.current.remove('select');
	// 	}
	// 	setError(undefined);
	// }});

	// const {makeDraggable, isDragging: isDraggingReal} = useDraggableList({onIsDragging() {
	// 	const container = containerRef.current;
	// 	if (container === null || parentElement === undefined) return;

	// 	if (overlayRef.current === undefined) {
	// 		overlayRef.current = new Overlay(container, parentElement);
	// 	}

	// 	if (selectedComponent) {
	// 		overlayRef.current.select(selectedComponent, {onDrag});
	// 	} else {
	// 		overlayRef.current.remove('select');
	// 	}
	// }, onDragFinish({element, aborter, from, to}) {
	// 	aborter.abort();
	// 	element.draggable = false;

	// 	if (from === to) return;
		
	// 	onReorder({from, to, element})
	// }});

	const {isDragging: isDraggingSelf} = useSnapping({element: selectedComponent ? selectDesignerElement(selectedComponent) : undefined, onIsDragging(event, element) {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(element, scale, Boolean(error), {});
		} else {
			overlayRef.current.remove('select');
		}
	}, onDragFinish(element, oldValues) {
		if (!selectedComponent) return;

		const updates: ComponentUpdate[] = [];
			
		for (const oldValue of oldValues) {
			const [element, oldProperties] = oldValue;
			//Round all of the values;
			['marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'].forEach(property => {
				const propValue = element.style[property as unknown as number];
				if (!propValue || propValue === 'auto') return;

				// const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(propValue);
				// if (!match) throw new Error("Invalid property value " + propValue);
				const num = round(parseFloat(propValue), 1, true);
				const unit = 'px';//match[2];
				const value = `${num}${unit}`;

				element.style[property as unknown as number] = value;
			});

			const oldValues: string[] = [];
			const keys: (keyof MarginValues | keyof FlexValues | 'width' | 'height')[] = ['marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'display', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'gap', 'justifyContent', 'alignItems', 'width', 'height'];
			Object.keys(oldProperties).forEach(property => {
				const value = element.style[property as unknown as number];
				if (!value) return;

				const componentId = element.dataset.harmonyId || '';
				const parentId = element.dataset.harmonyParentId || '';
				const oldValue = oldProperties[property];

				if (!oldValue) {
					throw new Error("Why are you happneing?");
				}

				const childIndex = Array.from(element.parentElement!.children).indexOf(element);
				if (childIndex < 0) throw new Error("Cannot get right child index");

				const update: ComponentUpdate = {componentId, parentId, action: 'add', type: 'className', name: property, value, oldValue, childIndex};

				
				updates.push(update);
			});
		}

		onChange(element, updates, true);
		onSelect(undefined);
	}, onError(error) {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, scale, true, {});
		} else {
			overlayRef.current.remove('select');
		}
		setError(error);
	}, scale});

	const isDragging = isDraggingSelf;

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;
		
		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, scale, Boolean(error), {});
		} else {
			overlayRef.current.remove('select');
		}
		overlayRef.current.remove('hover');
	}, [updateOverlay, scale]);

	useEffect(() => {
		const onEscape = () => {
			const parent = selectedComponent?.parentElement;
			onSelect(rootElement?.contains(parent ?? null) ? parent ?? undefined : undefined);
		}
		hotkeys('esc', onEscape);

		return () => hotkeys.unbind('esc', onEscape);
	}, [selectedComponent, onSelect, rootElement]);

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || rootElement === undefined || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		//TODO: Hacky fix. Inline elements are not affected by vertical margin, so the only way to get them to move when next
		//to a block element is to change it to a block element.
		if (selectedComponent) {
			const parent = selectedComponent.parentElement!;
			const selfIndex = Array.from(parent.children).indexOf(selectedComponent);
			const prevSibling = selfIndex > 0 ? parent.children[selfIndex - 1] as HTMLElement : undefined;
			const nextSibling = selfIndex < parent.children.length - 1 ? parent.children[selfIndex + 1] as HTMLElement : undefined;

			const prevSiblingDisplay = prevSibling && isSelectable(prevSibling, scale) ? getComputedStyle(prevSibling).display : undefined;
			const nextSiblingDisplay = nextSibling && isSelectable(nextSibling, scale) ? getComputedStyle(nextSibling).display : undefined;

			const styles = getComputedStyle(selectedComponent);

			if (styles.display === 'inline' && (prevSiblingDisplay === 'block' || nextSiblingDisplay === 'block')) {
				selectedComponent.style.display = 'block';
				selectedComponent.style.marginTop = '0px';
				selectedComponent.style.marginBottom = '0px';
			} else if (styles.display === 'block') {
				if (prevSiblingDisplay === 'inline') {
					prevSibling!.style.display = 'block';
					prevSibling!.style.marginTop = '0px';
					prevSibling!.style.marginBottom = '0px';
				}
				if (nextSiblingDisplay === 'inline') {
					nextSibling!.style.display = 'block';
					nextSibling!.style.marginTop = '0px';
					nextSibling!.style.marginBottom = '0px';
				}
			}
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, scale, Boolean(error), {onTextChange: onElementTextChange});
		} else {
			overlayRef.current.remove('select');
		}
	}, [selectedComponent, scale])

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || rootElement === undefined || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}
		if (hoveredComponent && !isDragging) {
			overlayRef.current.hover(hoveredComponent, scale);
		} else {
			overlayRef.current.remove('hover');
		}
	}, [hoveredComponent, scale, isDragging]);

	useEffect(() => {
		if (error !== previousError && error) {
			//showAlert(error);
		}
	}, [error, previousError])

	const isInteractableComponent = useCallback((component: HTMLElement) => {
		//TODO: Get rid of dependency on harmonyText
		if (!Boolean(component.dataset.harmonyId) && !Boolean(component.dataset.harmonyText)) {
			return false;
		}
		
		if (!isSelectable(component, scale)) {
			return false;
		}

		if (mode === 'tweezer') return true;

		// The current component scope is determined by either the currently selected component or 
		// the parent of the root element (this is because we want the root element to be selectable) 
		const startingComponent = selectedComponent || (rootElement?.parentElement);
		if (startingComponent) {
			return Array.from(startingComponent.children).includes(component);
		}
		return true;
	}, [selectedComponent, rootElement, mode, scale]);

	useEffect(() => {
		if (rootElement) {
			// const mutationObserver = new MutationObserver((mutations) => {
			// 	for (const mutation of mutations) {
			// 		if (mutation.type === 'characterData') {
			// 			onElementTextChange(mutation.target.textContent || '')
			// 		}
			// 	}
			// })

			// mutationObserver.observe(rootElement, {
			// 	characterData: true,
    		// 	subtree: true,
			// })
		}
	}, [rootElement])

	const onHover = useEffectEvent((element: HTMLElement, x: number, y: number, event: MouseEvent) => {
		const container = containerRef.current;
		if (container === null) return false;
		if (rootElement && !rootElement.contains(element)) return true;

		//const component: ComponentElement = componentIdentifier.getComponentFromElement(element);

		if (isDragging || !isInteractableComponent(element) || event.altKey) {
			onHoverProps(undefined);
			return false;
		}

		onHoverProps(element);

		return true;
	});
	const onClick = useEffectEvent((element: HTMLElement, x: number, y: number, event: MouseEvent) => {
		const container = containerRef.current;
		if (container === null || isDragging) return false;
		if (rootElement && !rootElement.contains(element)) return true;
		//const component: ComponentElement = componentIdentifier.getComponentFromElement(element);

		//TODO: ctrlKey is kind of hacky. Find a better way to turn off selection
		if (event.altKey) return false;

		if (!isInteractableComponent(element)) {
			//If we get here, that means we have clicked outside of the parent, which means we should deselect
			onSelect(undefined);
			return false;
		}

		

		onSelect(element);
		
		return true;
	});

	const onHold = useEffectEvent((element: HTMLElement) => {
		// const target = selectDesignerElement(element);
		
		// target.draggable = true;
		// makeDraggable(target, new AbortController());
		// overlayRef.current?.remove('hover');

		return true;
	});

	useHighlighter({
		handlers: {
			onClick,
			onHover,
			onHold,
			onPointerUp(_, clientX, clientY) {
				if (selectedComponent) {
					if (!selectedComponent.dataset.selected) {
						selectedComponent.dataset.selected = 'true';
					} else if (!isDragging && isTextElement(selectedComponent) && selectedComponent.contentEditable !== 'true') {
						selectedComponent.contentEditable = "true";

						// Focus the selectedComponent
						selectedComponent.focus();

						// Insert the cursor at the end of the text
						const range = document.caretRangeFromPoint(clientX, clientY);

						if (range) {
							// Collapse the range to the start
							range.collapse(true);

							// Set the selection to the collapsed range
							const selection = window.getSelection();
							selection?.removeAllRanges();
							selection?.addRange(range);
						}
					}
				}

				return true;
			}
		},
		container: rootElement,
		noEvents: []
	});

	return (<>
		<div ref={containerRef} className="hw-z-100" id="harmonyInspector">
			<div id="harmony-snap-guides"></div>
		</div>
		<Alert label={error} setLabel={setError}/> 
		</>
	)
}

interface Box {
	x: number;
	y: number;
	height: number;
	width: number;
	lx: number; //The direction
	ly: number; //The direction
}

export interface Rect {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

export interface RectBox {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export interface BoxSizing {
  borderTop: number;
  borderBottom: number;
  borderLeft: number;
  borderRight: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}
interface InteractProps {
	values: {
		rect: OverlayRect,
		element: HTMLElement
	}[]
	observer: ResizeObserver | undefined, 
	aborter: AbortController
}
class Overlay {
	window: Window
  	tipBoundsWindow: Window
	rects: Map<'select' | 'hover', InteractProps>
  
	constructor(private container: HTMLElement, private parent: HTMLElement) {
		// Find the root window, because overlays are positioned relative to it.
		const currentWindow = (window as unknown as (Window & typeof globalThis & {__REACT_DEVTOOLS_TARGET_WINDOW__: Window | undefined})).__REACT_DEVTOOLS_TARGET_WINDOW__ || window
		this.window = currentWindow

		// When opened in shells/dev,
		// the tooltip should be bound by the app iframe, not by the topmost window.
		const tipBoundsWindow = (window as unknown as (Window & typeof globalThis & {__REACT_DEVTOOLS_TARGET_WINDOW__: Window | undefined})).__REACT_DEVTOOLS_TARGET_WINDOW__ || window
		this.tipBoundsWindow = tipBoundsWindow

		this.rects = new Map();
	}

	remove(method: 'select' | 'hover') {
		const stuff = this.rects.get(method);
		if (stuff) {
			stuff.values.forEach(({rect, element}) => {
				rect.remove();
				element.style.cursor = '';
			});
			this.rects.delete(method);
			if (method === 'select') {
				stuff.values[0].element.contentEditable = 'inherit';
				stuff.values[0].element.removeAttribute('data-selected')
			}
			stuff.observer?.disconnect();
			stuff.aborter.abort();
			if (stuff.values[0].element.draggable) {
				stuff.values[0].element.draggable = false;
			}
		}
	}

	name(element: HTMLElement) {
		let name = element.nodeName.toLowerCase()

		const node = element
		const hook = (node.ownerDocument.defaultView as unknown as (Window & typeof globalThis & {__REACT_DEVTOOLS_GLOBAL_HOOK__: any}) | undefined)?.__REACT_DEVTOOLS_GLOBAL_HOOK__
		if (hook?.rendererInterfaces) {
			let ownerName = null
			for (const rendererInterface of hook.rendererInterfaces.values()) {
				const id = rendererInterface.getFiberIDForNative(node, true)
				if (id !== null) {
					ownerName = rendererInterface.getDisplayNameForFiberID(id, true)
					break
				}
			}

			if (ownerName) {
				name += ` (in ${ownerName})`
			}
		}

		return name;
	}

	hover(element: HTMLElement, scale: number) {
		element.style.cursor = 'inherit';	
		this.inspect(element, 'hover', scale, false);
	}

	select(element: HTMLElement, scale: number, error: boolean, listeners: {onTextChange?: (value: string, oldValue: string) => void, onDrag?: (box: ResizeRect) => void}) {
		this.inspect(element, 'select', scale, error, listeners.onDrag);

		const stuff = this.rects.get('select');
		if (!stuff) throw new Error("What happend??");

		if (listeners.onTextChange && Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE)) {
			let lastTextValue = element.textContent || '';
			element.addEventListener('input', (e) => {
				const target = e.target as HTMLElement;
				const value = target.textContent || ''
				listeners.onTextChange && listeners.onTextChange(value, lastTextValue);
				lastTextValue = value;
			}, {signal: stuff.aborter.signal});
		}

		//Select the parent too
		const designerElement = selectDesignerElement(element);
		const parent = designerElement.parentElement;
		if (parent) {
			const [box, dims] = this.getSizing(parent);
			const rect = new OverlayRect(this.window.document, parent, this.container);
			rect.update({box, dims, borderSize: 2, borderStyle: 'dashed', opacity: .5}, scale);
			stuff.values.push({rect, element: parent});
		}
	}

	inspect(element: HTMLElement, method: 'select' | 'hover', scale: number, error: boolean, onDrag?: (rect: ResizeRect) => void) {
		// We can't get the size of text nodes or comment nodes. React as of v15
    	// heavily uses comment nodes to delimit text.
		if (element.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const [box, dims] = this.getSizing(element);
		const rect = new OverlayRect(this.window.document, element, this.container, onDrag);
		rect[method](box, dims, scale, error);

		this.remove(method);

		let mutationObserver: ResizeObserver | undefined;
		const size = element.getBoundingClientRect();
		mutationObserver = new ResizeObserver((mutations) => {
			const newSize = element.getBoundingClientRect();
			const stuff = this.rects.get(method);
			if ((size.width !== newSize.width || size.height !== newSize.height) && stuff) {
				const [box, dims] = this.getSizing(element);
				stuff.values[0].rect.updateSize(box, dims, scale, error);
			}
		});

		mutationObserver.observe(element);
		this.rects.set(method, {values: [{rect, element}], observer: mutationObserver, aborter: new AbortController()});
	}

	getSizing(element: HTMLElement): [Rect, BoxSizing] {
		const outerBox = {
		top: Number.POSITIVE_INFINITY,
		right: Number.NEGATIVE_INFINITY,
		bottom: Number.NEGATIVE_INFINITY,
		left: Number.POSITIVE_INFINITY,
		}
		const box = getNestedBoundingClientRect(element, this.parent)
		const dims = getElementDimensions(element)

		outerBox.top = Math.min(outerBox.top, box.top)
		outerBox.right = Math.max(
			outerBox.right,
			box.left + box.width,
		)
		outerBox.bottom = Math.max(
			outerBox.bottom,
			box.top + box.height,
		)
		outerBox.left = Math.min(outerBox.left, box.left)

		return [box, dims];
  	}
}

const overlayStyles = {
  background: '#0094FF',
  error: '#ef4444',
  resize: 'rgba(120, 170, 210, 1)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
}

function addAlpha(color: string, opacity: number): string {
    // coerce values so ti is between 0 and 1.
    const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
    return color + _opacity.toString(16).toUpperCase();
}


interface OverlayProps {
	box: Rect,
	dims: BoxSizing,
	borderSize: number,
	opacity?: number,
	error?: boolean,
	padding?: boolean,
	borderStyle?: 'dotted' | 'dashed',
	drag?: boolean
}
export class OverlayRect {
	node: HTMLElement
	border: HTMLElement
	padding: HTMLElement
	content: HTMLElement
	elementVisibleValue: string | undefined;
	resizeHandles: HTMLElement[] = []

  	constructor(doc: Document, private element: HTMLElement, container: HTMLElement, private onDrag?: (rect: ResizeRect) => void) {
		this.node = doc.createElement('div')
		this.border = doc.createElement('div')
		this.padding = doc.createElement('div')
		this.content = doc.createElement('div')

		//const handles = $('[name="resize-handle"]').remove();
			
		for (let i = 0; i < 8; i++) {
			const handle = $('<div name="resize-handle"></div>');
			this.resizeHandles.push(handle[0]);
			this.resizeHandles[i].style.backgroundColor = overlayStyles.resize;
		}

		this.border.style.borderColor = overlayStyles.background
		this.padding.style.borderColor = overlayStyles.padding
		//this.content.style.backgroundColor = overlayStyles.background

		Object.assign(this.node.style, {
		borderColor: overlayStyles.margin,
		pointerEvents: 'none',
		position: 'fixed',
		})

		this.node.style.zIndex = '100'

		this.node.appendChild(this.border)
		this.border.appendChild(this.padding)
		this.padding.appendChild(this.content)
		for (const handle of this.resizeHandles) {
			handle.dataset.nonSelectable = 'true'; //TODO: find a better way to have this pass the isInteractable method so that the element does not deselect when we select a handle.
			this.content.appendChild(handle);
		}

		// ensure OverlayRect dom always before OverlayTip dom rather than cover OverlayTip
		container.prepend(this.node)
	}

	remove() {
		if (this.node.parentNode) {
			this.node.parentNode.removeChild(this.node)
		}
		
		if (this.elementVisibleValue !== undefined) {
			this.element.style.visibility = this.elementVisibleValue;
		}
	}

	public updateSize(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
		this.update({box, dims, borderSize: 2, error}, scale);
	}

	public hover(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
		this.update({box, dims, borderSize: 2, error}, scale);
	}

	public select(box: Rect, dims: BoxSizing, scale: number, error: boolean) {
		this.update({box, dims, borderSize: 2, error, drag: true}, scale);
	}

  	public update({box, dims, borderSize, opacity=1, padding=false, borderStyle, error=false, drag=false}: OverlayProps, scale: number) {
		dims.borderBottom = borderSize / scale;
		dims.borderLeft = borderSize / scale;
		dims.borderRight = borderSize / scale;
		dims.borderTop = borderSize / scale;
	    boxWrap(dims, 'border', this.border)
		
		//boxWrap(dims, 'margin', this.node)
		boxWrap(dims, 'padding', this.padding);

		const resizeThreshold = 30;

		Object.assign(this.content.style, {
			height:
				`${
					box.height
					- dims.borderTop
					- dims.borderBottom
					- dims.paddingTop
					- dims.paddingBottom
				}px`,
			width:
				`${
					box.width
					- dims.borderLeft
					- dims.borderRight
					- dims.paddingLeft
					- dims.paddingRight
				}px`,
		})

		const initFullDrag = (direction: ResizeDirection) => (e: MouseEvent) => {
			const x = e.clientX;
			const y = e.clientY;
			let values = {
				n: parseFloat($(this.element).css('paddingTop')),
				e: parseFloat($(this.element).css('paddingRight')),
				s: parseFloat($(this.element).css('paddingBottom')),
				w: parseFloat($(this.element).css('paddingLeft')),
			}
			if (isImageElement(this.element)) {
				values.n = this.element.clientHeight;
				values.s = values.n;
				values.e = this.element.clientWidth;
				values.w = values.e;
			}

			this.onDrag && this.onDrag({x, y, direction, ...values});
		}


		//NE -> SE -> SW -> NW
		//E -> S -> W -> N
		if (drag) {
			Object.assign(this.resizeHandles[0].style, {
				height: `${6 / scale}px`,
				width: `${6 / scale}px`,
				'pointer-events': 'none',
				cursor: 'nwse-resize',
				position: 'absolute',
				top: `${-dims.borderTop}px`,
				left: `${-dims.borderLeft}px`,
			})
			//this.resizeHandles[0].addEventListener('mousedown', initFullDrag('nw'), false);

			Object.assign(this.resizeHandles[1].style, {
				height: `${6 / scale}px`,
				width: `${6 / scale}px`,
				'pointer-events': 'none',
				cursor: 'nesw-resize',
				position: 'absolute',
				top: `${box.height - dims.borderTop - dims.borderBottom}px`,
				left: `${-dims.borderLeft}px`,
			})
			//this.resizeHandles[1].addEventListener('mousedown', initFullDrag('sw'), false);

			Object.assign(this.resizeHandles[2].style, {
				height: `${6 / scale}px`,
				width: `${6 / scale}px`,
				'pointer-events': 'none',
				cursor: 'nwse-resize',
				position: 'absolute',
				top: `${box.height - dims.borderTop - dims.borderBottom}px`,
				left: `${box.width - dims.borderLeft - dims.borderRight}px`,
			})
			//this.resizeHandles[2].addEventListener('mousedown', initFullDrag('se'), false);

			Object.assign(this.resizeHandles[3].style, {
				height: `${6 / scale}px`,
				width: `${6 / scale}px`,
				'pointer-events': 'none',
				cursor: 'nesw-resize',
				position: 'absolute',
				top: `${-dims.borderTop}px`,
				left: `${box.width - dims.borderLeft - dims.borderRight}px`,
			})
			//this.resizeHandles[3].addEventListener('mousedown', initFullDrag('ne'), false);

			const boxHeight = box.height * scale;
			if (boxHeight >= resizeThreshold) {
				Object.assign(this.resizeHandles[4].style, {
					height: `${6 / scale}px`,
					width: `${6 / scale}px`,
					'pointer-events': 'none',
					cursor: 'ew-resize',
					position: 'absolute',
					top: `${box.height / 2 - dims.borderTop}px`,
					left: `${-dims.borderLeft}px`,
				})
				//this.resizeHandles[4].addEventListener('mousedown', initFullDrag('w'), false);

				Object.assign(this.resizeHandles[6].style, {
					height: `${6 / scale}px`,
					width: `${6 / scale}px`,
					'pointer-events': 'none',
					cursor: 'ew-resize',
					position: 'absolute',
					top: `${box.height / 2 - dims.borderTop}px`,
					left: `${box.width - dims.borderLeft - dims.borderRight}px`,
				})
				//this.resizeHandles[6].addEventListener('mousedown', initFullDrag('e'), false);
			}

			const boxWidth = box.width * scale;
			if (boxWidth >= resizeThreshold) {
				Object.assign(this.resizeHandles[5].style, {
					height: `${6 / scale}px`,
					width: `${6 / scale}px`,
					'pointer-events': 'none',
					cursor: 'ns-resize',
					position: 'absolute',
					top: `${box.height - dims.borderTop - dims.borderBottom}px`,
					left: `${box.width / 2 - dims.borderLeft}px`,
				})
				//this.resizeHandles[5].addEventListener('mousedown', initFullDrag('s'), false);

				Object.assign(this.resizeHandles[7].style, {
					height: `${6 / scale}px`,
					width: `${6 / scale}px`,
					'pointer-events': 'none',
					cursor: 'ns-resize',
					position: 'absolute',
					top: `${-dims.borderTop}px`,
					left: `${box.width / 2 - dims.borderLeft}px`,
				});
				//this.resizeHandles[7].addEventListener('mousedown', initFullDrag('n'), false);
			}
		}

		this.border.style.borderColor = addAlpha(error ? overlayStyles.error : overlayStyles.background, opacity);
    	this.padding.style.borderColor = overlayStyles.padding
		this.node.style.borderColor = overlayStyles.margin;
		if (!padding) {
			this.node.style.borderColor = 'transparent';
			this.padding.style.borderColor = 'transparent';
		}

		if (borderStyle) {
			this.border.style.borderStyle = borderStyle;
		}

		Object.assign(this.node.style, {
		top: `${box.top - borderSize}px`,
		left: `${box.left - borderSize}px`,
		})
	}
}

function boxWrap(dims: BoxSizing, what: 'margin' | 'padding' | 'border', node: HTMLElement) {
  Object.assign(node.style, {
    borderTopWidth: `${dims[`${what}Top`]}px`,
    borderLeftWidth: `${dims[`${what}Left`]}px`,
    borderRightWidth: `${dims[`${what}Right`]}px`,
    borderBottomWidth: `${dims[`${what}Bottom`]}px`,
    borderStyle: 'solid',
  })
}

// Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.
export function getNestedBoundingClientRect(node: HTMLElement, boundaryWindow?: HTMLElement): Rect {
	const targetRect = node.getBoundingClientRect();

	if (boundaryWindow) {
		const boundaryRect = boundaryWindow.getBoundingClientRect();

		// let scalingAncestor: HTMLElement | null = boundaryWindow;
		// let scaleX = 1;
		// let scaleY = 1;
		// while (scalingAncestor !== null && scalingAncestor !== document.body) {
		// 	const style = window.getComputedStyle(scalingAncestor);
		// 	const transformMatrix = new DOMMatrix(style.transform);
			
		// 	// Check if the ancestor has a scaling transformation
		// 	if (transformMatrix.a !== 1 || transformMatrix.d !== 1) {
		// 		scaleX = transformMatrix.a;
		// 		scaleY = transformMatrix.b;
		// 		break;
		// 	}

		// 	scalingAncestor = scalingAncestor.parentElement;
		// }
		const boundaryStyle = window.getComputedStyle(boundaryWindow);
		const transformMatrix = new DOMMatrix(boundaryStyle.transform);

		// Extract the scaling factors from the transform matrix
		const scaleX = transformMatrix.a;
		const scaleY = transformMatrix.d;
	
		// Calculate the relative position
		const relativePosition = {
			top: (targetRect.top - boundaryRect.top) / scaleY,
			left: (targetRect.left - boundaryRect.left) / scaleX,
			right: (targetRect.right - boundaryRect.left) / scaleX,
			bottom: (targetRect.bottom - boundaryRect.top) / scaleY,
			width: targetRect.width / scaleX,
			height: targetRect.height / scaleY,
		};
	
		return relativePosition;
	}

	return targetRect;
}

export function getElementDimensions(domElement: Element) {
  const calculatedStyle = window.getComputedStyle(domElement)
  return {
    borderLeft: Number.parseInt(calculatedStyle.borderLeftWidth, 10),
    borderRight: Number.parseInt(calculatedStyle.borderRightWidth, 10),
    borderTop: Number.parseInt(calculatedStyle.borderTopWidth, 10),
    borderBottom: Number.parseInt(calculatedStyle.borderBottomWidth, 10),
    marginLeft: Number.parseInt(calculatedStyle.marginLeft, 10),
    marginRight: Number.parseInt(calculatedStyle.marginRight, 10),
    marginTop: Number.parseInt(calculatedStyle.marginTop, 10),
    marginBottom: Number.parseInt(calculatedStyle.marginBottom, 10),
    paddingLeft: Number.parseInt(calculatedStyle.paddingLeft, 10),
    paddingRight: Number.parseInt(calculatedStyle.paddingRight, 10),
    paddingTop: Number.parseInt(calculatedStyle.paddingTop, 10),
    paddingBottom: Number.parseInt(calculatedStyle.paddingBottom, 10),
  }
}

