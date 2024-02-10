'use client';
import { useHighlighter } from "./highlighter"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { ReactComponentIdentifier } from "./component-identifier";
import hotkeys from 'hotkeys-js';
import { SelectMode } from "../panel/harmony-panel";
import { getNumberFromString, round } from "@harmony/util/src";
import $ from 'jquery';
import interact from 'interactjs';
import {InteractEvent, Point} from '@interactjs/types'
import {Modifier} from '@interactjs/modifiers/types'
import {SnapPosition} from '@interactjs/modifiers/snap/pointer'

export const componentIdentifier = new ReactComponentIdentifier();

export type ResizeCoords = 'n' | 'e' | 's' | 'w';
export type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
export type ResizeValue = Partial<Record<ResizeCoords, number>>;
type ResizeRect = {x: number, y: number, direction: ResizeDirection} & Record<ResizeCoords, number>;
interface ResizeProps {
	onIsDragging?: (value: ResizeValue) => void;
	onDragFinish?: (value: ResizeValue) => void;
}
const useResize = ({onIsDragging, onDragFinish}: ResizeProps) => {
	const [rect, setRect] = useState<ResizeRect>();
	const [updates, setUpdates] = //useState<ResizeValue>();
	useState<ResizeValue>({});
	const [isDragging, setIsDragging] = useState(false);

	const doDrag = useEffectEvent((e: MouseEvent) => {
		if (!rect) return;

		const shift = e.shiftKey && rect.direction.length === 2;
		
		setIsDragging(true);
		const copy = {...updates};

		const calculateProportions = () => {
			const proportions: Record<string, number> = {};
		
			['n', 'e', 's', 'w'].forEach((direction) => {
				proportions[direction] = rect[direction as ResizeCoords] || 1;
			});
		
			const totalProportions = Object.values(proportions).reduce((sum, value) => sum + value, 0);
		
			return Object.fromEntries(
			  Object.entries(proportions).map(([dir, value]) => [dir, (value / totalProportions) * 100]),
			);
		};

		const originalProportions = calculateProportions();
		let valueX = 0;
		let valueY = 0;
		if (rect.direction.includes('n')) {
			valueY = rect.y - e.clientY;

			if (!shift)
				copy.n = rect.n + valueY;
		}
		if (rect.direction.includes('e')) {
			valueX = e.clientX - rect.x;

			if (!shift)
			copy.e = rect.e + valueX;
		}
		if (rect.direction.includes('s')) {
			valueY = e.clientY - rect.y;

			if (!shift)
			copy.s = rect.s + valueY;
		}
		if (rect.direction.includes('w')) {
			valueX = rect.x - e.clientX;

			if (!shift)
			copy.w = rect.w + valueX;
		}

		if (shift) {
			const value = Math.abs(valueX) > Math.abs(valueY) ? valueX : valueY;
			copy.s = rect.s + value;
			copy.w = (originalProportions.w / originalProportions.s) * copy.s;
			copy.e = (originalProportions.e / originalProportions.s) * copy.s;
			copy.n = (originalProportions.n / originalProportions.s) * copy.s;
		}

		onIsDragging && onIsDragging(copy);
		setUpdates(copy);
	});

	const stopDrag = useEffectEvent((e: MouseEvent) => {
		if (!updates) {
			throw new Error("There are no updates");
		}
		
		setIsDragging(false);
		document.documentElement.removeEventListener('mousemove', doDrag, false);    
    	document.documentElement.removeEventListener('mouseup', stopDrag, false);
		onDragFinish && onDragFinish(updates);
	});

	const onDrag = useEffectEvent((rect: ResizeRect): void => {
		setRect(rect);
		setUpdates({});
		document.documentElement.addEventListener('mousemove', doDrag, false);
		document.documentElement.addEventListener('mouseup', stopDrag, false);
	});

	return {onDrag, isDragging};
}

//Returns the element as understood from a designer (no nested containers with one child and no padding)
function selectDesignerElement(element: HTMLElement): HTMLElement {
	let target = element;
	const isSelectable = (element: HTMLElement | null): element is HTMLElement => {
		if (!element) return false;
	
		return element.children.length === 1 && ['Bottom', 'Top', 'Left', 'Right'].every(d => parseFloat($(element).css(`padding${d}`)) === 0);
	}

	while(isSelectable(target.parentElement)) {
		target = target.parentElement;
	}

	return target;
}

function isTextElement(element: HTMLElement): boolean {
	return Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE);
}

export interface InspectorProps {
	hoveredComponent: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onHover: (component: HTMLElement | undefined) => void;
	onSelect: (component: HTMLElement | undefined) => void;
	rootElement: HTMLElement | undefined;
	parentElement: HTMLElement | undefined;
	onElementTextChange: (value: string) => void;
	mode: SelectMode;
	onResize: (size: ResizeValue) => void;
	onReorder: (props: {from: number, to: number, element: HTMLElement}) => void;
	updateOverlay: number;
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, onElementTextChange, onResize, onReorder, rootElement, parentElement, mode, updateOverlay}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<Overlay>();

	const {onDrag, isDragging: isResizing} = useResize({onIsDragging(rect) {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, {onDrag});
		} else {
			overlayRef.current.remove('select');
		}

		onResize(rect);
	}});

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

	const {isDragging: isDraggingReal} = useSnapping({element: selectedComponent ? selectDesignerElement(selectedComponent) : undefined, onIsDragging() {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, {onDrag});
		} else {
			overlayRef.current.remove('select');
		}
	}});

	const isDragging = isResizing || isDraggingReal;

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || parentElement === undefined) return;
		
		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, {onDrag});
		} else {
			overlayRef.current.remove('select');
		}
		overlayRef.current.remove('hover');
	}, [updateOverlay]);

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

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent, {onTextChange: onElementTextChange, onDrag});
		} else {
			overlayRef.current.remove('select');
		}
	}, [selectedComponent])

	useEffect(() => {
		const container = containerRef.current;
		if (container === null || rootElement === undefined || parentElement === undefined) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container, parentElement);
		}
		if (hoveredComponent) {
			overlayRef.current.hover(hoveredComponent);
		} else {
			overlayRef.current.remove('hover');
		}
	}, [hoveredComponent])

	const isInteractableComponent = useCallback((component: HTMLElement) => {
		if (!Boolean(component.dataset.harmonyId)) {
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
	}, [selectedComponent, rootElement, mode]);

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

	const onHover = useEffectEvent((element: HTMLElement) => {
		const container = containerRef.current;
		if (container === null) return false;
		if (rootElement && !rootElement.contains(element)) return true;

		//const component: ComponentElement = componentIdentifier.getComponentFromElement(element);

		if (isDragging || !isInteractableComponent(element)) {
			onHoverProps(undefined);
			return false;
		}

		onHoverProps(element);

		return true;
	});
	const onClick = useEffectEvent((element: HTMLElement) => {
		const container = containerRef.current;
		if (container === null || isDragging) return false;
		if (rootElement && !rootElement.contains(element)) return true;
		//const component: ComponentElement = componentIdentifier.getComponentFromElement(element);

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

	return (
		<div ref={containerRef} className="hw-z-100" id="harmonyInspector">
			<div id="harmony-snap-guides"></div>
		</div>
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
			stuff.values.forEach(({rect}) => rect.remove());
			this.rects.delete(method);
			if (method === 'select') stuff.values[0].element.contentEditable = 'inherit';
			stuff.values[0].element.removeAttribute('data-selected')
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

	hover(element: HTMLElement) {
		this.inspect(element, 'hover');
	}

	select(element: HTMLElement, listeners: {onTextChange?: (value: string) => void, onDrag?: (box: ResizeRect) => void}) {
		this.inspect(element, 'select', listeners.onDrag);

		const stuff = this.rects.get('select');
		if (!stuff) throw new Error("What happend??");

		if (listeners.onTextChange && Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE)) {
			element.addEventListener('input', (e) => {
				const target = e.target as HTMLElement;
				listeners.onTextChange && listeners.onTextChange(target.textContent || '');
			}, {signal: stuff.aborter.signal});
		}

		//Select the parent too
		const designerElement = selectDesignerElement(element);
		const parent = designerElement.parentElement;
		if (parent) {
			const [box, dims] = this.getSizing(parent);
			const rect = new OverlayRect(this.window.document, parent, this.container);
			rect.update({box, dims, borderSize: 2, borderStyle: 'dashed', opacity: .5});
			stuff.values.push({rect, element: parent});
		}
	}

	inspect(element: HTMLElement, method: 'select' | 'hover', onDrag?: (rect: ResizeRect) => void) {
		// We can't get the size of text nodes or comment nodes. React as of v15
    	// heavily uses comment nodes to delimit text.
		if (element.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const [box, dims] = this.getSizing(element);
		const rect = new OverlayRect(this.window.document, element, this.container, onDrag);
		rect[method](box, dims);

		this.remove(method);

		let mutationObserver: ResizeObserver | undefined;
		const size = element.getBoundingClientRect();
		mutationObserver = new ResizeObserver((mutations) => {
			const newSize = element.getBoundingClientRect();
			const stuff = this.rects.get(method);
			if ((size.width !== newSize.width || size.height !== newSize.height) && stuff) {
				const [box, dims] = this.getSizing(element);
				stuff.values[0].rect.updateSize(box, dims);
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

		outerBox.top = Math.min(outerBox.top, box.top - dims.marginTop)
		outerBox.right = Math.max(
			outerBox.right,
			box.left + box.width + dims.marginRight,
		)
		outerBox.bottom = Math.max(
			outerBox.bottom,
			box.top + box.height + dims.marginBottom,
		)
		outerBox.left = Math.min(outerBox.left, box.left - dims.marginLeft)

		return [box, dims];
  	}
}

const overlayStyles = {
  background: '#0094FF',
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
	padding?: boolean,
	borderStyle?: 'dotted' | 'dashed'
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
		for (let i = 0; i < 8; i++) {
			this.resizeHandles.push(doc.createElement('div'));
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

	public updateSize(box: Rect, dims: BoxSizing) {
		this.update({box, dims, borderSize: 2});
	}

	public hover(box: Rect, dims: BoxSizing) {
		this.update({box, dims, borderSize: 2});
	}

	public select(box: Rect, dims: BoxSizing) {
		this.update({box, dims, borderSize: 2});
	}

  	public update({box, dims, borderSize, opacity=1, padding=false, borderStyle}: OverlayProps) {
		dims.borderBottom = borderSize;
		dims.borderLeft = borderSize;
		dims.borderRight = borderSize;
		dims.borderTop = borderSize;
	    boxWrap(dims, 'border', this.border)
		
		boxWrap(dims, 'margin', this.node)
		boxWrap(dims, 'padding', this.padding);

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
			const values = {
				n: parseFloat($(this.element).css('paddingTop')),
				e: parseFloat($(this.element).css('paddingRight')),
				s: parseFloat($(this.element).css('paddingBottom')),
				w: parseFloat($(this.element).css('paddingLeft')),
			}

			this.onDrag && this.onDrag({x, y, direction, ...values});
		}


		//NE -> SE -> SW -> NW
		//E -> S -> W -> N
		if (this.onDrag) {
			Object.assign(this.resizeHandles[0].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'se-resize',
				position: 'absolute',
				top: `${-dims.borderTop}px`,
				left: `${-dims.borderLeft}px`,
			})
			this.resizeHandles[0].addEventListener('mousedown', initFullDrag('nw'), false);

			Object.assign(this.resizeHandles[1].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'ne-resize',
				position: 'absolute',
				top: `${box.height - dims.borderTop - dims.borderBottom}px`,
				left: `${-dims.borderLeft}px`,
			})
			this.resizeHandles[1].addEventListener('mousedown', initFullDrag('sw'), false);

			Object.assign(this.resizeHandles[2].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'nw-resize',
				position: 'absolute',
				top: `${box.height - dims.borderTop - dims.borderBottom}px`,
				left: `${box.width - dims.borderLeft - dims.borderRight}px`,
			})
			this.resizeHandles[2].addEventListener('mousedown', initFullDrag('se'), false);

			Object.assign(this.resizeHandles[3].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'sw-resize',
				position: 'absolute',
				top: `${-dims.borderTop}px`,
				left: `${box.width - dims.borderLeft - dims.borderRight}px`,
			})
			this.resizeHandles[3].addEventListener('mousedown', initFullDrag('ne'), false);

			Object.assign(this.resizeHandles[4].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'e-resize',
				position: 'absolute',
				top: `${box.height / 2 - dims.borderTop}px`,
				left: `${-dims.borderLeft}px`,
			})
			this.resizeHandles[4].addEventListener('mousedown', initFullDrag('w'), false);

			Object.assign(this.resizeHandles[5].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 's-resize',
				position: 'absolute',
				top: `${box.height - dims.borderTop - dims.borderBottom}px`,
				left: `${box.width / 2 - dims.borderLeft}px`,
			})
			this.resizeHandles[5].addEventListener('mousedown', initFullDrag('s'), false);

			Object.assign(this.resizeHandles[6].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'w-resize',
				position: 'absolute',
				top: `${box.height / 2 - dims.borderTop}px`,
				left: `${box.width - dims.borderLeft - dims.borderRight}px`,
			})
			this.resizeHandles[6].addEventListener('mousedown', initFullDrag('e'), false);

			Object.assign(this.resizeHandles[7].style, {
				height: '6px',
				width: '6px',
				'pointer-events': 'auto',
				cursor: 'n-resize',
				position: 'absolute',
				top: `${-dims.borderTop}px`,
				left: `${box.width / 2 - dims.borderLeft}px`,
			})
			this.resizeHandles[7].addEventListener('mousedown', initFullDrag('n'), false);
		}

		this.border.style.borderColor = addAlpha(overlayStyles.background, opacity);
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
		top: `${box.top - dims.marginTop - borderSize}px`,
		left: `${box.left - dims.marginLeft - borderSize}px`,
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

interface OffsetHelper {
	getOffset: (element: HTMLElement) => {offsetX: number, offsetY: number} | undefined;
	setOffset: (element: HTMLElement, props: {offsetX: number, offsetY: number, dx: number, dy: number, rect: Rect}) => void;
}

const offsetTranslate: OffsetHelper = {
	getOffset(element) {
		const translate = element!.style.transform;
		const match = /translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)/.exec(translate);

		if (!match) return undefined;

		return {offsetX: parseFloat(match[1]), offsetY: parseFloat(match[2])}
	},
	setOffset(element, {offsetX, offsetY, dx, dy}) {
		const x = offsetX + dx;
		const y = offsetY + dy;
		element!.style.transform = `translate(${x}px, ${y}px)`
	}
}

const offsetProperty = (property: 'margin' | 'padding'): OffsetHelper => ({
	getOffset(element) {
		const propertyLeft = parseFloat($(element).css(`${property}Left`) || '0');
		const propertyTop = parseFloat($(element).css(`${property}Top`) || '0');
		const propertyRight = parseFloat($(element).css(`${property}Right`) || '0');
		const propertyBottom = parseFloat($(element).css(`${property}Bottom`) || '0');

		return {offsetX: propertyLeft, offsetY: propertyTop}
	},
	setOffset(element, {offsetX, offsetY, dx, dy}) {
		const x = offsetX + dx//round(offsetX + dx, 0);
		const y = offsetY + dy//round(offsetY + dy, 0);
		element!.style[`${property}Left`] = `${x}px`;
		element!.style[`${property}Top`] = `${y}px`;
		// if (y < 0) {
		// 	element.style[`${property}Bottom`] = `${-1 * y}px`;
		// } else {
			
		//  }
	}
});

const offsetPadding = offsetProperty('padding');

const close = (a: number, b: number, threshold: number): boolean => {
	return Math.abs(a-b) <= threshold;
}


type SnapPoint = {
	point: SnapPosition;
	offset: HTMLElement,
	guides?: {
		x0: number, y0: number, x1: number, y1: number, text?: number | string, relative: ('x0' | 'x1' | 'y0' | 'y1')[]
	}[]
}

function getElementHeight(element: HTMLElement): number {
	return $(element).outerHeight(true) || element.clientHeight;
}

function calculateFlexInfo(parent: HTMLElement): FlexInfo {
	const numChildren = parent.children.length;
	const firstChild = parent.children[0] as HTMLElement;
	const lastChild = parent.children[parent.children.length - 1] as HTMLElement;

	let gap = 0;
	let gapStart = 0;
	let gapEnd = 0;
	for (let i = 0; i < numChildren; i++) {
		const child = parent.children[i] as HTMLElement;

		if (i === 0) {
			gapStart = child.getBoundingClientRect().top - parent.getBoundingClientRect().top;
		}
		if (i === numChildren - 1) {
			gapEnd = parent.getBoundingClientRect().bottom - (child.getBoundingClientRect().bottom);
			continue;
		}
		const nextChild = parent.children[i + 1] as HTMLElement;

		// gap += nextChild.getBoundingClientRect().top - (child.getBoundingClientRect().bottom);
		//gap += nextChild.getBoundingClientRect().top - (child.getBoundingClientRect().top + getElementHeight(child));
		//gap += nextChild.getBoundingClientRect().top - (child.getBoundingClientRect().top + child.clientHeight);
		gap += nextChild.getBoundingClientRect().top - parseFloat($(nextChild).css('marginTop')) - (child.getBoundingClientRect().bottom);
	}

	const childrenMidpoint = firstChild.getBoundingClientRect().top + (lastChild.getBoundingClientRect().bottom - firstChild.getBoundingClientRect().top) / 2;
	const parentMidpoint = (parent.getBoundingClientRect().top + getElementHeight(parent) / 2);

	const childrenHeight = Array.from(parent.children).reduce((prev, curr) => prev + ($(curr).outerHeight(true) || curr.clientHeight), 0)
	const remainingSpace = parent.clientHeight - childrenHeight;
	const evenlySpace = remainingSpace / (numChildren + 1);
	const aroundSpace = remainingSpace / numChildren;
	const betweenSpace = remainingSpace / (numChildren - 1);
	const gapBetween = gap / (numChildren - 1);

	// const gapStart = firstChild.getBoundingClientRect().top - parent.getBoundingClientRect().top - 4;
	// const gapEnd = parent.getBoundingClientRect().bottom - lastChild.getBoundingClientRect().bottom;
	// const gapBetween = (remainingSpace - gapStart - gapEnd) / (numChildren - 1);

	console.log(`${gapStart}, ${gapBetween}, ${gapEnd}, ${remainingSpace}`)
	

	return {
		parentMidpoint,
		childrenCount: numChildren,
		childrenMidpoint,
		childrenHeight: lastChild.getBoundingClientRect().bottom - firstChild.getBoundingClientRect().top,
		gapBetween,
		gapStart,
		gapEnd,
		remainingSpace,
		evenlySpace,
		aroundSpace,
		betweenSpace,
	}
}
interface FlexInfo {
	parentMidpoint: number,
	childrenMidpoint: number,
	childrenHeight: number,
	gapBetween: number;
	gapStart: number;
	gapEnd: number;
	remainingSpace: number;
	childrenCount: number;
	evenlySpace: number;
	aroundSpace: number;
	betweenSpace: number;
}

interface FlexConditionInfo extends FlexInfo {
	y: number;
	dy: number;
}
interface TransitionCondition {
	name: string,
	in: {
		condition: (element: HTMLElement, info: FlexConditionInfo) => boolean,
		func: (element: HTMLElement, info: FlexConditionInfo) => void;
	},
	out: {
		condition: (element: HTMLElement, info: FlexConditionInfo) => boolean,
		func: (element: HTMLElement, info: FlexConditionInfo) => void;
	}
}
const conditions: TransitionCondition[] = [
	{
		name: 'center',
		in: {
			condition: (_, {parentMidpoint, childrenMidpoint}: FlexConditionInfo): boolean => parentMidpoint === childrenMidpoint,
			func: (element: HTMLElement, info: FlexConditionInfo) => {
				const parent = element.parentElement!;
				parent.style.paddingTop = '';
				parent.style.paddingBottom = '';
				parent.style.justifyContent = 'center';
			}
		},
		out: {
			condition: (element) => element.parentElement?.style.justifyContent === 'center',
			func: (element: HTMLElement, {y, dy, gapStart, gapEnd}) => {
				if (dy < 0) {
					element.parentElement!.style.justifyContent = 'flex-start';
					element.parentElement!.style.paddingTop = `${y - gapStart}px`;
					element.parentElement!.style.paddingBottom = '';
				} else if (dy > 0) {
					element.parentElement!.style.paddingTop = '';
					element.parentElement!.style.paddingBottom = `${gapEnd}px`;
					element.parentElement!.style.justifyContent = 'flex-end';
				} else {
					throw new Error("Children and parent midpoints should not equal");
				}
			}
		}
	}
]

const useFlexHelper = (): OffsetHelper => {
	return {
		getOffset(element) {
			return offsetTranslate.getOffset(element!);
		},
		setOffset(element, props) {
			//const {start, center, evenly, around, between, remainingSpace} = getFlexAnchorPoints(element);
			const posY = props.rect.top - element.parentElement!.getBoundingClientRect().top;
			const parent = element.parentElement as HTMLElement;
			const {
				parentMidpoint,
				childrenCount,
				childrenMidpoint,
				childrenHeight,
				gapBetween,
				gapStart,
				gapEnd,
				remainingSpace,
			} = calculateFlexInfo(parent);
			const end = parent.offsetTop + getElementHeight(parent);
			const numChildren = parent.children.length;
			const selfIndex = Array.from(parent.children).indexOf(element);
			if (selfIndex < 0) {
				throw new Error("Invalid self index");
			}
			const firstChild = parent.children[0] as HTMLElement;
			const lastChild = parent.children[parent.children.length - 1] as HTMLElement;

			const start = Array.from(parent.children).slice(0, selfIndex).reduce((prev, curr) => prev + ($(curr).outerHeight(true) || curr.clientHeight), 0)

			const position = selfIndex === 0 || selfIndex === numChildren - 1 ? 'edge' : 'middle';
			// const isExpanding = selfIndex === 0 && (props.dy < 0 || gapEnd === 0) || selfIndex === numChildren - 1 && (props.dy > 0 || gapStart === 0);

			const isExpanding = position === 'edge' && (gapBetween > 5 || (selfIndex === 0 && props.dy < 0 || selfIndex === numChildren - 1 && props.dy > 0));

			if (isExpanding) {
				// const direction = selfIndex === 0 ? 1 : -1;
				// const gap = parseFloat(parent.style.gap || '0') - direction * props.dy;
				// const padding = parseFloat(parent.style.paddingTop || '0') + direction * props.dy;
				// const p0 = element.getBoundingClientRect().top;
				// const p1s = parent.children[1].getBoundingClientRect().top;
				// console.log(`start p0: ${p0}`);
				// console.log(`diff p0: ${props.rect.top}`);
				// console.log(`start p1: ${p1s}`);
				
				const p1 = parent.children[1].getBoundingClientRect().top - parent.getBoundingClientRect().top;
				const p1b = parent.children[1].getBoundingClientRect().bottom - parent.getBoundingClientRect().top;
				// let gap = selfIndex === 0 ? p1 - (props.rect.bottom - parent.getBoundingClientRect().top) : posY - p1b;
				// if (parentMidpoint !== childrenMidpoint) {
				// 	gap -= 4;
				// }
				const gap = selfIndex === 0 ? p1 - (props.rect.bottom - parent.getBoundingClientRect().top) - 4 : posY - p1b - parseFloat($(element).css('marginTop') || '0');

				const padding = selfIndex === 0 ? posY : 2 * p1 - posY;

				parent.style.gap = `${gap}px`;

				if (!['center', 'space-evenly', 'space-around', 'space-between'].includes(parent.style.justifyContent)) {
					parent.style.paddingTop = `${padding}px`
					parent.style.justifyContent = '';
				}
				
				//TODO: Figure out why the middle item moves here
				// const gp0 = gap * 2 + 80 + padding + 8 + parent.getBoundingClientRect().top
				// const gp1 = gap + 40 + padding + parent.getBoundingClientRect().top + 4;
				// console.log(`guess p0: ${gp0}`)
				// console.log(`guess p1: ${gp1}`);
				// console.log(`end p0: ${element.getBoundingClientRect().top}`)
				// console.log(`end p1: ${parent.children[1].getBoundingClientRect().top}, ${parent.children[1].getBoundingClientRect().top - p1s}`)
			} else {
				parent.style.paddingTop = `${props.rect.top - (element.getBoundingClientRect().top - firstChild.getBoundingClientRect().top) - parent.getBoundingClientRect().top}px`
				parent.style.justifyContent = '';
			}
			

			let info = calculateFlexInfo(parent);


			if (close(info.parentMidpoint, info.childrenMidpoint, 2)) {
				parent.style.justifyContent = 'center';
				parent.style.paddingTop = '';
				parent.style.paddingBottom = '';

				info = calculateFlexInfo(parent);
				console.log(info.gapBetween);
				if (close(info.gapBetween, info.evenlySpace, 2)) {
					parent.style.justifyContent = 'space-evenly';
					parent.style.gap = '';
				} else if (info.gapBetween === info.aroundSpace) {
					parent.style.justifyContent = 'space-around';
					parent.style.gap = '';
				} else if (close(info.gapBetween, info.betweenSpace, 2)) {
					parent.style.justifyContent = 'space-between';
					parent.style.gap = '';
				}
			} else if (childrenMidpoint > parentMidpoint) {
				parent.style.paddingTop = '';
				parent.style.paddingBottom = `${info.gapEnd}px`;
				parent.style.justifyContent = 'flex-end';
			} else {
				parent.style.justifyContent = '';
			}

			// if (selfIndex === numChildren - 1) {
			// 	//If it is exanding
			// 	if (gapBetween > 5 || props.dy > 0) {
			// 		// const pos = posY - (gapStart + start + parseFloat($(element).css('marginTop')));
			// 		// parent.style.gap = `${pos / (numChildren - 1)}px`//`${props.rect.top - parent.children[1].getBoundingClientRect().bottom}px`;//(childrenMidpoint + parent.children[1].clientHeight / 2)}px`;//`${pos / (numChildren - 1)}px`;
			// 		// const padding = //props.rect.bottom - childrenHeight - parent.getBoundingClientRect().top;
			// 		// parseFloat(parent.style.paddingTop || '0') - props.dy;
			// 		// parent.style.paddingTop = `${padding}px`
			// 		const gap = parseFloat(parent.style.gap || '0') + props.dy;
			// 		const padding = parseFloat(parent.style.paddingTop || '0') - props.dy;

			// 		parent.style.gap = `${gap}px`;
			// 		parent.style.paddingTop = `${padding}px`
			// 	} else {
			// 		parent.style.paddingTop = `${props.rect.top - (element.getBoundingClientRect().top - firstChild.getBoundingClientRect().top) - parent.getBoundingClientRect().top}px`
			// 	}
			// } else if (selfIndex === 0) {
			// 	//Is expanding
			// 	if (gapBetween > 5 || props.dy < 0) {
			// 		// const pos = posY - (gapStart + start + parseFloat($(element).css('marginTop')));
			// 		// const gap = parseFloat(parent.style.gap || '0');
			// 		// parent.style.gap = `${props.rect.top - (childrenMidpoint + parent.children[1].clientHeight / 2)}px`;//`${gap - props.dy}px`;
			// 		// parent.style.paddingTop = `${posY}px`;
			// 		const gap = parseFloat(parent.style.gap || '0') - props.dy;
			// 		const padding = parseFloat(parent.style.paddingTop || '0') + props.dy;

			// 		parent.style.gap = `${gap}px`;
			// 		parent.style.paddingTop = `${padding}px`
			// 	} else {
			// 		parent.style.paddingTop = `${props.rect.top - (element.getBoundingClientRect().top - firstChild.getBoundingClientRect().top) - parent.getBoundingClientRect().top}px`
			// 	}
			// } else {
			// 	parent.style.paddingTop = `${props.rect.top - (element.getBoundingClientRect().top - firstChild.getBoundingClientRect().top) - parent.getBoundingClientRect().top}px`
			// }
			// if (isExpanding && selfIndex === numChildren - 1) { //&& childrenMidpoint < parentMidpoint) {
			// 	const prevHeights = Array.from(parent.children).slice(0, selfIndex).reduce((prev, curr) => prev + curr.clientHeight, 0);
			// 	const pos = posY - (gapStart + start + parseFloat($(element).css('marginTop')));
			// 	parent.style.gap = `${pos / (numChildren - 1)}px`;
			// } else if (false && selfIndex !== 0) {
			// 	parent.style.paddingBottom = `${(posY - end)}px`
			// } else if (isExpanding && selfIndex === 0) {
			// 	const pos = posY - (gapStart + start + parseFloat($(element).css('marginTop')));
			// 	const gap = parseFloat(parent.style.gap);
			// 	parent.style.gap = `${gap + Math.abs(props.dy) / (numChildren - 1)}px`;
			// 	parent.style.paddingTop = `${posY}px`;
			// } else if (!isExpanding && (childrenMidpoint < parentMidpoint || childrenMidpoint === parentMidpoint && props.dy < 0)) {
			// 	parent.style.paddingTop = `${props.rect.top - (element.getBoundingClientRect().top - firstChild.getBoundingClientRect().top) - parent.getBoundingClientRect().top}px`
			// } else if (!isExpanding && (childrenMidpoint > parentMidpoint || childrenMidpoint === parentMidpoint && props.dy > 0)) {
			// 	parent.style.paddingBottom = `${parent.getBoundingClientRect().bottom - props.rect.bottom - (lastChild.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom)}px`
			// }



			// const info = {...calculateFlexInfo(parent), dy: props.dy, y: posY};
			// conditions.forEach(transition => {
			// 	if (transition.in.condition(element, info)) {
			// 		console.log(`Transition in: ${transition.name}`);
			// 		transition.in.func(element, info);
			// 	} else if (transition.out.condition(element, info)) {
			// 		console.log(`Transition out: ${transition.name}`);
			// 		transition.out.func(element, info);
			// 	}
			// })
			
			// const checkY = round(posY, 10);
			// if (checkY < round(center, 10)) {
			// 	parent.style.justifyContent = '';
			// 	parent.style.gap = '';
				
			// 	offsetPadding.setOffset(parent, {offsetX: 0, offsetY: posY - start, dx: 0, dy: 0, rect: props.rect});
			// } else if (checkY >= round(center, 10) && checkY < round(evenly, 10)) {
			// 	parent.style.justifyContent = 'center';
			// 	offsetPadding.setOffset(parent, {offsetX: 0, offsetY: 0, dx: 0, dy: 0, rect: props.rect});
		 	// 	parent.style.gap = `${(posY - center)}px`;
			// } else if (checkY >= round(evenly, 10) && checkY < round(around, 10)) {
			// 	parent.style.justifyContent = 'space-evenly';
			// 	offsetPadding.setOffset(parent, {offsetX: 0, offsetY: 0, dx: 0, dy: 0, rect: props.rect});
		 	// 	parent.style.gap = `${(posY - evenly)}px`;
			// } else if (checkY >= round(around, 10) && checkY < round(between, 10)) {
			// 	parent.style.justifyContent = 'space-around';
			// 	offsetPadding.setOffset(parent, {offsetX: 0, offsetY: 0, dx: 0, dy: 0, rect: props.rect});
			// 	const gap = numChildren * (checkY - round(around, 10));
		 	// 	parent.style.gap = `${gap}px`;
			// } else if (checkY >= round(between, 10)) {
			// 	parent.style.justifyContent = 'space-between';
			// 	offsetPadding.setOffset(parent, {offsetX: 0, offsetY: 0, dx: 0, dy: 0, rect: props.rect});
			// 	parent.style.gap = '';
			// }
			//N = SR / C
			//N - SA = dy
			//SA = NSR / C
			//SR = NSR + SAG
			//SAG = C(dy + SA) - NSR
			//SAG = C(dy + NSR / C) - NSR
			//SAG = Cdy
		},
	};
}

type SnappableProps = Pick<DraggableProps, 'element' | 'onIsDragging'>;
const useSnapping = ({element, onIsDragging}: SnappableProps) => {
	const [shiftPressed, setShiftPressed] = useState(false);
	const snappings = useMemo<DraggableProps['snapPoints']>(() => {
		
		const targets: SnapPoint[] = [];
		let relativePoints: Point[] = [{x: 0, y: 0}];
		if (element) {
			//const {start, center, evenly, around, between, remainingSpace} = getFlexAnchorPoints(element);
			// const parent = element.parentElement!;
			// const childCount = parent.children.length;
			// const dcenter = remainingSpace / (childCount - 1);
			// const devenly = remainingSpace / (childCount + 1);
			// const daround = remainingSpace / childCount;
			// const dbetween = dcenter;

			// const snapGuides: SnapPoint[] = [
			// 	{
			// 		point: {y: center, range: 10},
			// 		offset: parent,
			// 		// guides: [
			// 		// 	{y0: 0, x0: .5, y1: dcenter, x1: .5, text: dcenter, relative: ['x0', 'x1']}, 
			// 		// 	{y0: parent.clientHeight - (dcenter), x0: .5, y1: 1, x1: .5, text: dcenter, relative: ['x0', 'x1', 'y1']}
			// 		// ]
			// 	},
			// 	{
			// 		point: {y: evenly, range: 10},
			// 		offset: parent,
			// 		guides: [
			// 			{y0: 0, x0: .5, y1: devenly, x1: .5, text: devenly, relative: ['x0', 'x1']},
			// 			{y0: 40 + devenly, x0: .5, y1: 2 * devenly + 40, x1: .5, text: devenly, relative: ['x0', 'x1']},
			// 			{y0: 84 + devenly * 2, x0: .5, y1: 84 + devenly * 3, x1: .5, text: devenly, relative: ['x0', 'x1']},
			// 			{y0: parent.clientHeight - devenly, x0: .5, y1: 1, x1: .5, text: devenly, relative: ['x0', 'x1', 'y1']},
			// 		]
			// 	},
			// 	{
			// 		point: {y: around, range: 10},
			// 		offset: parent,
			// 		guides: [
			// 			{y0: 0, x0: .5, y1: daround / 2, x1: .5, text: daround/2, relative: ['x0', 'x1']},
			// 			{y0: 40 + daround/2, x0: .5, y1: 1.5 * daround + 40, x1: .5, text: daround, relative: ['x0', 'x1']},
			// 			{y0: 84 + 1.5*daround, x0: .5, y1: 84 + 2.5*daround, x1: .5, text: daround, relative: ['x0', 'x1']},
			// 			{y0: parent.clientHeight - (daround / 2), x0: .5, y1: 1, x1: .5, text: daround/2, relative: ['x0', 'x1', 'y1']},
			// 		]
			// 	},
			// 	{
			// 		point: {y: between, range: 10},
			// 		offset: parent,
			// 		guides: [
			// 			{y0: 40, x0: .5, y1: dbetween + 40, x1: .5, text: dbetween, relative: ['x0', 'x1']},
			// 			{y0: 84 + dbetween, x0: .5, y1: 84 + dbetween * 2, x1: .5, text: dbetween, relative: ['x0', 'x1']},
			// 		]
			// 	},
			// ];
			// targets.push({point: {y: start, range: 10}, offset: parent});
			// targets.push(...snapGuides);
		}
		return targets;
	}, [element, shiftPressed]);
	const offsetHelper = useFlexHelper();

	const result = useDraggable({element, onIsDragging, restrictToParent: true, snapPoints: snappings, offsetHelper});

	// const onShift = useEffectEvent(() => {
	// 	console.log("Setting shift...");
	// 	setShiftPressed(true);
	// })

	// useEffect(() => {
	// 	hotkeys('shift+a', onShift)
	// }, []);

	return result;
}

interface DraggableProps {
	element: HTMLElement | undefined;
	onIsDragging?: () => void;
	snapPoints?: SnapPoint[],
	// snappings?: {
	// 	parent: {targets: SnapTarget[], relativePoints?: Point[]},
	// 	self: {targets: SnapTarget[], relativePoints?: Point[]}
	// },
	restrictToParent?: boolean;
	offsetHelper: OffsetHelper
}
const useDraggable = ({element, onIsDragging, offsetHelper, snapPoints=[], restrictToParent=false}: DraggableProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const [offsetX, setOffsetX] = useState<number | null>(null);
	const [offsetY, setOffsetY] = useState<number | null>(null);
	const ref = useRef(0);
	const snapGuides = useRef<SnapPoint[]>([]);
	const $parent = $('#harmony-snap-guides');
		
	useEffect(() => {
		if (element) {
			ref.current = element.getBoundingClientRect().top - element.parentElement!.getBoundingClientRect().top;
			const parentSnappings = snapPoints.filter(point => point.offset === element.parentElement);
			const modifiers: Modifier[] = [
				interact.modifiers.snap({
					targets: [function(x, y, interaction, offset, index) {
						const parent = element.parentElement!;
						const {childrenMidpoint, parentMidpoint, gapEnd, gapStart, gapBetween, evenlySpace, aroundSpace, betweenSpace} = calculateFlexInfo(parent);
						const _ = element.getBoundingClientRect().top - parent.getBoundingClientRect().top;
						const posY = _;
						const dy = y + parent.getBoundingClientRect().top - ref.current;
					
						const selfIndex = Array.from(parent.children).indexOf(element);
						const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= 5;
						const direction = selfIndex === 0 ? -1 : 1;

						const centerDiff = parentMidpoint - childrenMidpoint;
						//console.log(centerDiff);
						if (Math.abs(centerDiff) <= 5 && isMoving) {
							snapGuides.current = [{
								point: {y: posY + centerDiff, range: 10},
								offset: parent,
								guides: [
									{y0: 0, x0: .5, y1: betweenSpace, x1: .5, text: betweenSpace, relative: ['x0', 'x1']}, 
									{y0: parent.clientHeight - (betweenSpace), x0: .5, y1: 1, x1: .5, text: betweenSpace, relative: ['x0', 'x1', 'y1']}
								]
							},]
							return {y: posY + centerDiff, range: 10};
						}

						const evenlyDiff = evenlySpace - gapBetween;
						if (centerDiff === 0 && !isMoving && Math.abs(evenlyDiff) <= 5) {
							snapGuides.current = [{
								point: {y: posY + evenlyDiff * direction, range: 10},
								offset: parent,
								guides: [
									{y0: 0, x0: .5, y1: evenlySpace, x1: .5, text: evenlySpace, relative: ['x0', 'x1']},
									{y0: 40 + evenlySpace, x0: .5, y1: 2 * evenlySpace + 40, x1: .5, text: evenlySpace, relative: ['x0', 'x1']},
									{y0: 84 + evenlySpace * 2, x0: .5, y1: 84 + evenlySpace * 3, x1: .5, text: evenlySpace, relative: ['x0', 'x1']},
									{y0: parent.clientHeight - evenlySpace, x0: .5, y1: 1, x1: .5, text: evenlySpace, relative: ['x0', 'x1', 'y1']},
								]
							},]
							return {y: posY + evenlyDiff * direction, range: 10}
						}

						const aroundDiff = aroundSpace - gapBetween;
						if (centerDiff === 0 && !isMoving && Math.abs(aroundDiff) <= 5) {
							snapGuides.current = [{
								point: {y: posY + aroundDiff * direction, range: 10},
								offset: parent,
								guides: [
									{y0: 0, x0: .5, y1: aroundSpace / 2, x1: .5, text: aroundSpace/2, relative: ['x0', 'x1']},
									{y0: 40 + aroundSpace/2, x0: .5, y1: 1.5 * aroundSpace + 40, x1: .5, text: aroundSpace, relative: ['x0', 'x1']},
									{y0: 84 + 1.5*aroundSpace, x0: .5, y1: 84 + 2.5*aroundSpace, x1: .5, text: aroundSpace, relative: ['x0', 'x1']},
									{y0: parent.clientHeight - (aroundSpace / 2), x0: .5, y1: 1, x1: .5, text: aroundSpace/2, relative: ['x0', 'x1', 'y1']},
								]
							},]
							return {y: posY + aroundDiff * direction, range: 10}
						}

						const betweenDiff = betweenSpace - gapBetween;
						if (centerDiff === 0 && !isMoving && Math.abs(betweenDiff) <= 5) {
							snapGuides.current = [{
								point: {y: posY + betweenDiff * direction, range: 10},
								offset: parent,
								guides: [
									{y0: 40, x0: .5, y1: betweenSpace + 40, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
									{y0: 84 + betweenSpace, x0: .5, y1: 84 + betweenSpace * 2, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
								]
							},]
							return {y: posY + betweenDiff * direction, range: 10}
						}

						if (Math.abs(gapEnd) <= 5 && (selfIndex === parent.children.length - 1 || isMoving)) {
							if (gapStart === 0) {
								snapGuides.current = [{
									point: {y: posY + gapEnd, range: 10},
									offset: parent,
									guides: [
										{y0: 40, x0: .5, y1: betweenSpace + 40, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
										{y0: 84 + betweenSpace, x0: .5, y1: 84 + betweenSpace * 2, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
									]
								},]
							}
							return {y: posY + gapEnd, range: 10};
						}

						
						if (Math.abs(gapStart) <= 5 && (selfIndex === 0 || isMoving)) {
							if (gapEnd === 0) {
								snapGuides.current = [{
									point: {y: posY - gapStart, range: 10},
									offset: parent,
									guides: [
										{y0: 40, x0: .5, y1: betweenSpace + 40, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
										{y0: 84 + betweenSpace, x0: .5, y1: 84 + betweenSpace * 2, x1: .5, text: betweenSpace, relative: ['x0', 'x1']},
									]
								},]
							}
							return {y: posY - gapStart, range: 10};
						}

						snapGuides.current = [];

						return interact.createSnapGrid({x: 2, y: 2})(x, y, interaction, offset, index);
						
						// const parent = element.parentElement as HTMLElement;
						// const selfIndex = Array.from(parent.children).indexOf(element);
						// if (selfIndex < 0) {
						// 	throw new Error("Invalid self index");
						// }
						// const dy = y - ref.current;
						// const numChildren = parent.children.length;
						// const gapStart = parent.children[0].getBoundingClientRect().top - parent.getBoundingClientRect().top;
						// const gapEnd = parent.getBoundingClientRect().top + getElementHeight(parent) - (parent.children[parent.children.length - 1].getBoundingClientRect().top + getElementHeight(parent.children[parent.children.length - 1] as HTMLElement));
						
						// const isExpanding = selfIndex === 0 && (dy < 0 || gapEnd === 0) || selfIndex === numChildren - 1 && (dy > 0 || gapStart === 0)
						// const {start, end, center, evenly, around, between, remainingSpace} = getFlexAnchorPoints(element, isExpanding);
						
						// const posY = y - element.parentElement!.getBoundingClientRect().top;
						// //const end = parent.offsetTop + getElementHeight(parent);
						

						// const firstChild = parent.children[0] as HTMLElement;
						// const lastChild = parent.children[parent.children.length - 1] as HTMLElement;

						// const childrenMidpoint = firstChild.getBoundingClientRect().top + (lastChild.getBoundingClientRect().bottom - firstChild.getBoundingClientRect().top) / 2;
						// const parentMidpoint = (parent.getBoundingClientRect().top + getElementHeight(parent) / 2);
						// let gap = 0;
						// //let gapEnd = 0;
						// for (let i = 0; i < numChildren; i++) {
						// 	const child = parent.children[i] as HTMLElement;

						// 	// if (i === 0) {
						// 	// 	gapStart = child.getBoundingClientRect().top - parent.getBoundingClientRect().top;
						// 	// }
						// 	if (i === numChildren - 1) {
						// 		// gapEnd = parent.getBoundingClientRect().top + getElementHeight(parent) - (child.getBoundingClientRect().top + getElementHeight(child));
						// 		continue;
						// 	}
						// 	const nextChild = parent.children[i + 1] as HTMLElement;

						// 	gap += nextChild.getBoundingClientRect().top - (child.getBoundingClientRect().top + getElementHeight(child));
						// }

						// const gapBetween = gap / (numChildren - 1)
						// // const info: FlexConditionInfo = {
						// // 	parentMidpoint,
						// // 	childrenCount: numChildren,
						// // 	childrenMidpoint,
						// // 	gapBetween,
						// // 	gapStart,
						// // 	gapEnd,
						// // 	remainingSpace,
						// // 	y: posY,
						// // 	dy
						// // }

						// const direction = (num: number): 1 | -1 => {
						// 	return num > 0 ? 1 : -1;
						// }
						// const distances: number[] = [(center - y), (end - y)];
						// const points: number[] = [center, end];
						// // if (evenly) {
						// // 	distances.push(Math.abs(y - evenly));
						// // 	points.push(evenly);
						// // }
						// // if (around) {
						// // 	distances.push(Math.abs(y - around));
						// // 	points.push(around);
						// // }
						// // if (between) {
						// // 	distances.push(Math.abs(y - between));
						// // 	points.push(between);
						// // }
						// const min = Math.min(...distances.filter(dist => direction(dist) === direction(dy)).map(d => Math.abs(d)));
						// const index = distances.findIndex(d => Math.abs(d) === min);
						// if (index < 0 && min !== Infinity) throw new Error("Something went wrong")

						// console.log(index > -1 ? points[index] : 'none');
						// return index > -1 ? {y: points[index], range: 10} : undefined;
						//return {y: 90, range: 10};
					// 	const snapGuides: SnapPoint[] = [
					// 	{
					// 		point: {y: center, range: 10},
					// 		offset: parent,
					// 		// guides: [
					// 		// 	{y0: 0, x0: .5, y1: dcenter, x1: .5, text: dcenter, relative: ['x0', 'x1']}, 
					// 		// 	{y0: parent.clientHeight - (dcenter), x0: .5, y1: 1, x1: .5, text: dcenter, relative: ['x0', 'x1', 'y1']}
					// 		// ]
					// 	},
					// 	{
					// 		point: {y: evenly, range: 10},
					// 		offset: parent,
					// 		guides: [
					// 			{y0: 0, x0: .5, y1: devenly, x1: .5, text: devenly, relative: ['x0', 'x1']},
					// 			{y0: 40 + devenly, x0: .5, y1: 2 * devenly + 40, x1: .5, text: devenly, relative: ['x0', 'x1']},
					// 			{y0: 84 + devenly * 2, x0: .5, y1: 84 + devenly * 3, x1: .5, text: devenly, relative: ['x0', 'x1']},
					// 			{y0: parent.clientHeight - devenly, x0: .5, y1: 1, x1: .5, text: devenly, relative: ['x0', 'x1', 'y1']},
					// 		]
					// 	},
					// 	{
					// 		point: {y: around, range: 10},
					// 		offset: parent,
					// 		guides: [
					// 			{y0: 0, x0: .5, y1: daround / 2, x1: .5, text: daround/2, relative: ['x0', 'x1']},
					// 			{y0: 40 + daround/2, x0: .5, y1: 1.5 * daround + 40, x1: .5, text: daround, relative: ['x0', 'x1']},
					// 			{y0: 84 + 1.5*daround, x0: .5, y1: 84 + 2.5*daround, x1: .5, text: daround, relative: ['x0', 'x1']},
					// 			{y0: parent.clientHeight - (daround / 2), x0: .5, y1: 1, x1: .5, text: daround/2, relative: ['x0', 'x1', 'y1']},
					// 		]
					// 	},
					// 	{
					// 		point: {y: between, range: 10},
					// 		offset: parent,
					// 		guides: [
					// 			{y0: 40, x0: .5, y1: dbetween + 40, x1: .5, text: dbetween, relative: ['x0', 'x1']},
					// 			{y0: 84 + dbetween, x0: .5, y1: 84 + dbetween * 2, x1: .5, text: dbetween, relative: ['x0', 'x1']},
					// 		]
					// 	},
					// ];
					// targets.push({point: {y: start, range: 10}, offset: parent});
					// targets.push(...snapGuides);
					}],//parentSnappings.map(snapping => snapping.point),
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
					offset: 'parent'
				}),
				// interact.modifiers.snap({
				// 	targets: [interact.createSnapGrid({x: 2, y: 2})],
				// 	// Control the snapping behavior
				// 	range: Infinity, // Snap to the closest target within the entire range
				// 	relativePoints: [{x: 0, y: 0}],
				// 	offset: 'self',
				// })
			];
			if (restrictToParent) {
				modifiers.push(interact.modifiers.restrict({
					restriction: 'parent',
					elementRect: { top: 0, left: 0, bottom: 1, right: 1 }, // Restrict to the parent element
					//endOnly: true, // Only snap when dragging ends
				}))
			}
			interact(element).draggable({
				listeners: {
					start: startDragging,
					move: drag,
					end: stopDragging
				},
				modifiers,
				//inertia: true
			})
		}
	}, [element, snapPoints]);

	const handleGuides = useEffectEvent((posY: number, snapPoints: SnapPoint[]) => {
		const createGuide = (rect: {x0: number, y0: number, y1: number, x1: number, text?: string | number}) => {
			const lineTemplate = `<div name="harmony-guide-0" class="hw-bg-primary hw-w-[1px] hw-absolute hw-z-[100]" style="top: ${rect.y0}px; left: ${rect.x0}px; height: ${rect.y1 - rect.y0}px;">
				${rect.text ? `<div class="hw-bg-primary hw-rounded-full hw-absolute hw-text-[8px] hw-p-1 hw-text-white hw-top-1/2 -hw-translate-y-1/2 hw-left-1">
					${typeof rect.text === 'number' ? round(rect.text, 2) : rect.text}
				</div>` : ''}
			</div>`
			
			const $line = $(lineTemplate);
			$line.appendTo($parent);
			return $line;
		}

		$parent.children().remove();
		snapPoints.forEach(snapPoint => {
			const {point, guides} = snapPoint;
			const offset = {x: 0, y: 0, w: 0, h: 0};
			if ('offset' in snapPoint) {
				//TODO: Figure out how to use getboundingclientrect
				//const box = snapPoint.offset.getBoundingClientRect();

				offset.x = snapPoint.offset.offsetLeft;
				offset.y = snapPoint.offset.offsetTop;
				offset.w = snapPoint.offset.clientWidth;
				offset.h = snapPoint.offset.clientHeight;
			}

			const top = (point.y as number) + (element!.parentElement?.getBoundingClientRect().top as number);
			if (top === posY) {
				guides && guides.forEach((guide) => {
					const copy = {...guide};
					'relative' in copy && copy.relative.forEach(p => {
						const sizeOffset = p.includes('y') ? offset.h : offset.w;
						copy[p] *= sizeOffset;
					});

					copy.x0 += offset.x;
					copy.y0 += offset.y;
					copy.y1 += offset.y;
					copy.x1 += offset.x;

					createGuide(copy);
				});
			}
		})
	})

	const startDragging = useEffectEvent((event: InteractEvent<'drag', 'start'>) => {
		setOffsetX(event.clientX0);
		setOffsetY(event.clientY0);
	});
	  
	const drag = useEffectEvent((event: InteractEvent<'drag', 'move'>) => {
		!isDragging && setIsDragging(true);
		
		const offset = offsetHelper.getOffset(element!);
		const offsetX = offset ? offset.offsetX : 0;
		const offsetY = offset ? offset.offsetY : 0;
		ref.current = event.rect.top;

		handleGuides(event.rect.top, snapGuides.current);

		offsetHelper.setOffset(element!, {offsetX, offsetY: event.clientY - event.clientY0, dx: event.dx, dy: event.dy, rect: event.rect});
		onIsDragging && onIsDragging();
	});
	
	const stopDragging = useEffectEvent(() => {
		setIsDragging(false);
		$parent.children().remove();
	});

	return {isDragging};
}

interface DraggableListProps {
	onDragFinish?: (props: {element: HTMLElement, aborter: AbortController, from: number, to: number}) => void;
	onIsDragging?: () => void;
}
const useDraggableList = ({ onDragFinish, onIsDragging }: DraggableListProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const fromRef = useRef(-1);
	const toRef = useRef(-1);
  
	const makeDraggable = (element: HTMLElement, aborter: AbortController): void => {
		//element.draggable = true;
	
		const onDragOver = (event: DragEvent) => {
			//event.preventDefault();
			onDragEnter(event);
		};
	
		const onDragEnter = (event: DragEvent) => {
			const draggedElement = document.querySelector('.dragging');
			const target = selectDesignerElement(event.target as HTMLElement);
			if (draggedElement && target.parentElement === draggedElement.parentElement) {
				const boundingRect = target.getBoundingClientRect();
				const midY = boundingRect.top + boundingRect.height / 2;
	
				if (event.clientY < midY) {
					// Place dragged element before the current target
					target.parentElement!.insertBefore(draggedElement, target);
				} else {
					// Place dragged element after the current target
					target.parentElement!.children.length;
					target.parentElement!.insertBefore(draggedElement, target.nextSibling);
				}
				toRef.current = Array.from(draggedElement.parentElement!.children).indexOf(draggedElement);
				onIsDragging && onIsDragging();
			} else {
			}
		};

		const onDragEnd = () => {
			const draggedElement = document.querySelector('.dragging');
			if (draggedElement) {
				draggedElement.classList.remove('dragging');
				setIsDragging(false);
				onDragFinish && onDragFinish({element, aborter, from: fromRef.current, to: toRef.current});
			}
		};

		const onDragStart = (event: DragEvent) => {
			event.dataTransfer!.setData('text/plain', ''); // Required for Firefox
			if (!(event.target instanceof HTMLElement)) return;

			event.target!.classList.add('dragging');
	
			const parent = event.target.parentElement;
	
			if (!parent) return;
	
			for (const sibling of Array.from(parent.children)) {
				if (sibling !== element) {
					(sibling as HTMLElement).addEventListener('dragover', onDragOver, {signal: aborter.signal});
					(sibling as HTMLElement).addEventListener('dragenter', onDragEnter, {signal: aborter.signal});
				}
			}

			fromRef.current = Array.from(event.target.parentElement.children).indexOf(event.target);
			setIsDragging(true);
		};
	
		element.addEventListener('dragstart', onDragStart, {signal: aborter.signal});
	
		element.addEventListener('dragover', onDragOver, {signal: aborter.signal});
	
		element.addEventListener('dragenter', onDragEnter, {signal: aborter.signal});
	
		element.addEventListener('dragend', onDragEnd, {signal: aborter.signal});
	}
  
	return { isDragging, makeDraggable };
  };