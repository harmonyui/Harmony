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
import { ComponentUpdate } from "@harmony/ui/src/types/component";
import { ResizeValue, useResize, ResizeRect, ResizeDirection } from "@harmony/ui/src/hooks/resize";

export const componentIdentifier = new ReactComponentIdentifier();

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
	onElementTextChange: (value: string, oldValue: string) => void;
	mode: SelectMode;
	onResize: (size: ResizeValue) => void;
	onReorder: (props: {from: number, to: number, element: HTMLElement}) => void;
	onChange: (component: HTMLElement, update: ComponentUpdate[], execute?: boolean) => void;
	updateOverlay: number;
	scale: number;
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, onElementTextChange, onResize, onReorder, onChange, rootElement, parentElement, mode, updateOverlay, scale}) => {
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
	}, onDragFinish(parent, oldProperties) {
		if (!selectedComponent) return;

		//Round all of the values;
		['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'gap'].forEach(property => {
			const propValue = parent.style[property as unknown as number];
			if (!propValue) return;

			const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(propValue);
			if (!match) throw new Error("Invalid property value " + propValue);
			const num = round(parseFloat(match[1]));
			const unit = match[2];
			const value = `${num}${unit}`;

			parent.style[property as unknown as number] = value;
		});

		const updates: ComponentUpdate[] = [];
		const oldValues: string[] = [];
		const keys: (keyof FlexValues)[] = ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'gap', 'justifyContent', 'alignItems'];
		(keys).forEach(property => {
			const value = parent.style[property as unknown as number];
			if (!value) return;

			const componentId = parent.dataset.harmonyId || '';
			const parentId = parent.dataset.harmonyParentId || '';
			const oldValue = oldProperties[property];

			const update: ComponentUpdate = {componentId, parentId, action: 'add', type: 'className', name: property, value, oldValue};

			
			updates.push(update);
			oldValues.push(oldValue);
		});

		onChange(parent, updates, true);
		onSelect(undefined);
	}, scale});

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
		//TODO: Get rid of dependency on harmonyText
		if (!Boolean(component.dataset.harmonyId) && !Boolean(component.dataset.harmonyText)) {
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

	hover(element: HTMLElement) {
		this.inspect(element, 'hover');
	}

	select(element: HTMLElement, listeners: {onTextChange?: (value: string, oldValue: string) => void, onDrag?: (box: ResizeRect) => void}) {
		this.inspect(element, 'select', listeners.onDrag);

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

const getExtra = (element: HTMLElement, axis: Axis, type: Exclude<BoundingType, 'size' | 'size-full'>) => {
	if (axis === 'x') {
		switch (type) {
			case 'close':
				return getExtraD(element, 'left');
			case 'far':
				return getExtraD(element, 'right');
		}
	} else {
		switch (type) {
			case 'close':
				return getExtraD(element, 'top');
			case 'far':
				return getExtraD(element, 'bottom');
		}
	}
}

const getExtraD = (element: HTMLElement, type: 'top' | 'bottom' | 'left' | 'right') => {
	const upper = `${type[0].toUpperCase()}${type.slice(1)}`;
	return parseFloat($(element).css(`margin${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
}


type SnapPoint = {
	point: SnapPosition;
	offset?: HTMLElement,
	guides?: {
		x0: number, y0: number, x1: number, y1: number, text?: number | string, offset?: HTMLElement, 
		relative: ('x0' | 'x1' | 'y0' | 'y1')[],
		rotate?: boolean
	}[]
}

function getElementHeight(element: HTMLElement): number {
	return $(element).outerHeight(true) || element.clientHeight;
}

type BoundingType = 'close' | 'far' | 'size' | 'size-full';

function getBoundingClientRect(element: HTMLElement, axis: Axis, type: BoundingType, scale: number): number {
	const rect = element.getBoundingClientRect();

	if (axis === 'y') {
		switch (type) {
			case 'close':
				return rect.top / scale;
			case 'far':
				return rect.bottom / scale;
			case 'size':
				return rect.height / scale;
			case 'size-full':
				return $(element).outerHeight(true) || (rect.height) / scale;
		}
	} else {
		switch (type) {
			case 'close':
				return rect.left / scale;
			case 'far':
				return rect.right / scale;
			case 'size':
				return rect.width / scale;
			case 'size-full':
				return $(element).outerWidth(true) || (rect.width) / scale;
		}
	}
	throw new Error("Invalid params");
}

function getBoundingClientRectParent(parent: HTMLElement, axis: Axis, type: BoundingType, scale: number) {
	const rect = parent.getBoundingClientRect();

	if (axis === 'y') {
		const top = rect.top / scale + parseFloat($(parent).css('borderTop') || '0')
		const bottom = rect.bottom / scale - parseFloat($(parent).css('borderBottom') || '0')
		const height = (rect.bottom - rect.top) / scale - (parseFloat($(parent).css('borderBottom') || '0') + parseFloat($(parent).css('borderTop') || '0'));
		switch (type) {
			case 'close':
				return top;
			case 'far':
				return bottom;
			case 'size':
				return height;
			case 'size-full':
				return (height + getExtra(parent, axis, 'close') + getExtra(parent, axis, 'far'));
		}
	} else {
		const left = rect.left / scale + parseFloat($(parent).css('borderLeft') || '0')
		const right = rect.right / scale - parseFloat($(parent).css('borderRight') || '0')
		const height = (rect.right - rect.left) / scale - (parseFloat($(parent).css('borderLeft') || '0') + parseFloat($(parent).css('borderRight') || '0'));
		switch (type) {
			case 'close':
				return left;
			case 'far':
				return right;
			case 'size':
				return height;
			case 'size-full':
				return (height + getExtra(parent, axis, 'close') + getExtra(parent, axis, 'far'));
		}
	}
	throw new Error("Invalid params");
}

type Axis = 'x' | 'y';

function calculateFlexInfo(parent: HTMLElement, axis: Axis, scale: number): FlexInfo {
	const numChildren = parent.children.length;
	const firstChild = parent.children[0] as HTMLElement;
	const lastChild = parent.children[parent.children.length - 1] as HTMLElement;

	let gap = 0;
	let gapStart = 0;
	let gapEnd = 0;
	for (let i = 0; i < numChildren; i++) {
		const child = parent.children[i] as HTMLElement;

		if (i === 0) {
			gapStart = getBoundingClientRect(child, axis, 'close', scale) - getBoundingClientRectParent(parent, axis, 'close', scale);
		}
		if (i === numChildren - 1) {
			gapEnd = getBoundingClientRectParent(parent, axis, 'far', scale) - (getBoundingClientRect(child, axis, 'far', scale));
			continue;
		}
		const nextChild = parent.children[i + 1] as HTMLElement;

		gap += getBoundingClientRect(nextChild, axis, 'close', scale) - getExtra(nextChild, axis, 'close') - (getBoundingClientRect(child, axis, 'far', scale));
	}

	const childrenMidpoint = (getBoundingClientRect(lastChild, axis, 'far', scale) + getBoundingClientRect(firstChild, axis, 'close', scale)) / 2;
	const parentMidpoint = (getBoundingClientRectParent(parent, axis, 'close', scale) + getBoundingClientRectParent(parent, axis, 'size', scale) / 2);
	
	const childrenHeight = Array.from(parent.children).reduce((prev, curr) => prev + getBoundingClientRect(curr as HTMLElement, axis, 'size-full', scale), 0)
	const remainingSpace = getBoundingClientRectParent(parent, axis, 'size', scale) - childrenHeight;
	const evenlySpace = remainingSpace / (numChildren + 1);
	const aroundSpace = remainingSpace / numChildren;
	const betweenSpace = remainingSpace / (numChildren - 1);
	const gapBetween = gap / (numChildren - 1);
	const centerSpace = remainingSpace / 2;

	return {
		parentMidpoint,
		childrenCount: numChildren,
		childrenMidpoint,
		childrenHeight,
		gapBetween,
		gapStart,
		gapEnd,
		remainingSpace,
		evenlySpace,
		aroundSpace,
		betweenSpace,
		centerSpace
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
	centerSpace: number;
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

const minGap = 8;

function setDragPosition(element: HTMLElement, props: {dx: number, dy: number, rect: Rect}, axis: Axis, scale: number) {
	const parent = element.parentElement as HTMLElement;
	const startPos = axis === 'y' ? props.rect.top : props.rect.left;
	const posY = startPos - getBoundingClientRectParent(parent, axis, 'close', scale);
	const closePadding = axis === 'y' ? 'paddingTop' : 'paddingLeft';
	const farPadding = axis === 'y' ? 'paddingBottom' : 'paddingRight';

	const {
		childrenMidpoint,
		gapBetween,
	} = calculateFlexInfo(parent, axis, scale);
	const numChildren = parent.children.length;
	const selfIndex = Array.from(parent.children).indexOf(element);
	if (selfIndex < 0) {
		throw new Error("Invalid self index");
	}
	const firstChild = parent.children[0] as HTMLElement;
	const lastChild = parent.children[parent.children.length - 1] as HTMLElement;
	const ds = axis === 'y' ? props.dy : props.dx;
	const axisGap = axis === 'y' ? 'gap' : 'gap';

	const position = selfIndex === 0 || selfIndex === numChildren - 1 ? 'edge' : 'middle';
	
	const isExpanding = position === 'edge' && (gapBetween > minGap || (selfIndex === 0 && ds < 0 || selfIndex === numChildren - 1 && ds > 0));

	if (isExpanding) {
		const p0o = getBoundingClientRect(firstChild, axis, 'close', scale) - getBoundingClientRectParent(parent, axis, 'close', scale);
		const p1o = getBoundingClientRect(lastChild, axis, 'close', scale) - (getBoundingClientRectParent(parent, axis, 'close', scale));
		const p0 = p1o + p0o - posY;
		const childrenBeforeHeight = Array.from(parent.children).slice(0, parent.children.length - 1).reduce((prev, curr) => prev + getBoundingClientRect(curr as HTMLElement, axis, 'size-full', scale), 0);
		const gap = selfIndex === 0 ? (2*(childrenMidpoint - getBoundingClientRectParent(parent, axis, 'close', scale)) - (2 * posY + getBoundingClientRect(lastChild, axis, 'size-full', scale) + childrenBeforeHeight)) / (numChildren - 1) : (posY - (p0 + childrenBeforeHeight + getExtra(lastChild, axis, 'close'))) / (numChildren - 1);
		
		let padding = selfIndex === 0 ? posY : p0;

		//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
		if (padding < 0) {
			padding = 0;
		}

		
		parent.style[axisGap] = `${gap}px`;
		
		if (!['center', 'space-evenly', 'space-around', 'space-between'].includes(parent.style.justifyContent)) {
			parent.style[closePadding] = `${padding}px`
			parent.style.justifyContent = 'normal';
			parent.style[farPadding] = '0px';
		}
	} else {
		//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
		let padding = startPos - (getBoundingClientRect(element, axis, 'close', scale) - getBoundingClientRect(firstChild, axis, 'close', scale)) - getBoundingClientRectParent(parent, axis, 'close', scale);
		if (padding < 0) {
			padding = 0;
		}
		parent.style[closePadding] = `${padding}px`
		parent.style.justifyContent = 'normal';
		parent.style.gap = `${gapBetween}px`;
		parent.style[farPadding] = '0px';
	}
	

	let info = calculateFlexInfo(parent, axis, scale);


	if (close(info.parentMidpoint, info.childrenMidpoint, 0.1)) {
		parent.style.justifyContent = 'center';
		parent.style[closePadding] = '0px';
		parent.style[farPadding] = '0px';

		info = calculateFlexInfo(parent, axis, scale);
		if (close(info.gapBetween, info.evenlySpace, 0.1)) {
			parent.style.justifyContent = 'space-evenly';
			parent.style[axisGap] = '0px';
		} else if (close(info.gapBetween, info.aroundSpace, 0.1)) {
			parent.style.justifyContent = 'space-around';
			parent.style[axisGap] = '0px';
		} else if (close(info.gapBetween, info.betweenSpace, 0.1)) {
			parent.style.justifyContent = 'space-between';
			parent.style[axisGap] = '0px';
		}
	} else if (info.childrenMidpoint > info.parentMidpoint) {
		parent.style[closePadding] = '0px';
		parent.style[farPadding] = `${info.gapEnd}px`;
		parent.style.justifyContent = 'flex-end';
	} else {
		parent.style.justifyContent = 'normal';
	}

	if (close(info.gapBetween, minGap, 1)) {
		parent.style.gap = `${minGap}px`;
	}
}

function setDragPositionOtherAxis(element: HTMLElement, props: {dx: number, dy: number, rect: Rect}, axis: Axis, scale: number) {
	const parent = element.parentElement as HTMLElement;
	const startPos = axis === 'y' ? props.rect.top : props.rect.left;
	const posY = startPos - getBoundingClientRectParent(parent, axis, 'close', scale);
	const closePadding = axis === 'y' ? 'paddingTop' : 'paddingLeft';
	const farPadding = axis === 'y' ? 'paddingBottom' : 'paddingRight';

	const {gapStart, gapEnd} = calculateFlexInfo(parent, axis, scale);

	//Only deal with align-items axis if there is space to move
	if (gapEnd === 0 && gapStart === 0) return;

	const selfIndex = Array.from(parent.children).indexOf(element);
	if (selfIndex < 0) {
		throw new Error("Invalid self index");
	}
	const firstChild = parent.children[0] as HTMLElement;
	//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
	let padding = startPos - (getBoundingClientRect(element, axis, 'close', scale) - getBoundingClientRect(firstChild, axis, 'close', scale)) - getBoundingClientRectParent(parent, axis, 'close', scale)
	if (padding < 0) {
		padding = 0;
	}
	
	parent.style[closePadding] = `${padding}px`
		parent.style.alignItems = '';
		parent.style[farPadding] = '';
	

	let info = calculateFlexInfo(parent, axis, scale);

	if (close(info.parentMidpoint, info.childrenMidpoint, .1)) {
		parent.style.alignItems = 'center';
		parent.style[closePadding] = '';
		parent.style[farPadding] = '';
	} else if (info.childrenMidpoint > info.parentMidpoint) {
		parent.style[closePadding] = '';
		parent.style[farPadding] = `${info.gapEnd}px`;
		parent.style.alignItems = 'flex-end';
	} else {
		parent.style.alignItems = '';
	}
}

type SnappableProps = Pick<DraggableProps, 'element' | 'onIsDragging' | 'scale' | 'onDragFinish'>;
const useSnapping = ({element, onIsDragging, onDragFinish, scale}: SnappableProps) => {
	const [shiftPressed, setShiftPressed] = useState(false);

	const result = useDraggable({element, onIsDragging, onDragFinish, restrictToParent: true, scale});

	// const onShift = useEffectEvent(() => {
	// 	console.log("Setting shift...");
	// 	setShiftPressed(true);
	// })

	// useEffect(() => {
	// 	hotkeys('shift+a', onShift)
	// }, []);

	return result;
}



function createSnapGuides(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', scale: number) {
	const parent = element.parentElement!;
	const _scale = 1;
	const {childrenMidpoint, parentMidpoint, gapEnd, gapStart, gapBetween, evenlySpace, aroundSpace, betweenSpace, centerSpace} = calculateFlexInfo(parent, type, scale);
	const {evenlySpace: evenlyText, aroundSpace: aroundText, betweenSpace: betweenText, gapBetween: gapBetweenText} = calculateFlexInfo(parent, type, scale);

	const _ = getBoundingClientRect(element, type, 'close', _scale) - getBoundingClientRect(parent, type, 'close', _scale);
	const posY = _;
	const dy = pos + getBoundingClientRect(parent, type, 'close', _scale) - current;

	const selfIndex = Array.from(parent.children).indexOf(element);
	const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= minGap;
	const direction = selfIndex === 0 ? -1 : 1;
	const threshold = 5;
	const range = 10;

	const centerDiff = parentMidpoint - childrenMidpoint;
	if (Math.abs(centerDiff) <= threshold && isMoving) {
		const firstChild = parent.children[0] as HTMLElement;
		const lastChild = parent.children[parent.children.length - 1] as HTMLElement || firstChild;

		const snapPoints: SnapPoint[] = [{
			point: {y: posY + centerDiff, range},
			offset: parent,
			guides: [
				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
			]
		},]
		return {y: posY + centerDiff, range, snapPoints};
	}

	const evenlyDiff = evenlySpace - gapBetween;
	if (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(evenlyDiff) <= threshold) {
		const guides: SnapPoint['guides'] = [];
		for (let i = 0; i < parent.children.length; i++) {
			const child = parent.children[i] as HTMLElement;
			if (i === parent.children.length - 1) {
				const marginBottom = getExtra(child, type, 'far')
				guides.push({rotate: type === 'x', y0: 1, x0: .5, y1: evenlySpace + child.clientHeight + marginBottom, x1: .5, text: evenlyText, relative: ['x0', 'x1', 'y0'], offset: child})
			}

			const marginTop = getExtra(child, type, 'close');
			guides.push({rotate: type === 'x', y0: -(evenlySpace + marginTop), x0: .5, y1: 0, x1: .5, text: evenlyText, relative: ['x0', 'x1'], offset: child})
		}
		const snapPoints: SnapPoint[] = [{
			point: {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range},
			offset: parent,
			guides
		},];
		return {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range, snapPoints}
	}

	const aroundDiff = aroundSpace - gapBetween;
	if (false || (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(aroundDiff) <= threshold)) {
		const guides: SnapPoint['guides'] = [];
		const newPos = posY + aroundDiff * direction * (parent.children.length - 1) / 2;
		for (let i = 0; i < parent.children.length; i++) {
			const child = parent.children[i] as HTMLElement;
			if (i === parent.children.length - 1) {
				const marginBottom = getExtra(child, type, 'far')
				guides.push({rotate: type === 'x', y0: 1, x0: .5, y1: aroundSpace / 2 + child.clientHeight + marginBottom, x1: .5, text: aroundText / (2), relative: ['x0', 'x1', 'y0'], offset: child})
			}

			const marginTop = getExtra(child, type, 'close');
			const amount = i === 0 ? aroundSpace / 2 : aroundSpace;
			const amountText = i === 0 ? aroundText / 2 : aroundText;
			guides.push({rotate: type === 'x', y0: -(amount + marginTop), x0: .5, y1: 0, x1: .5, text: amountText, relative: ['x0', 'x1'], offset: child})
		}
		const snapPoints: SnapPoint[] = [{
			point: {y: newPos, range},
			offset: parent,
			guides
		},]
		return {y: newPos, range, snapPoints}
	}

	const betweenDiff = betweenSpace - gapBetween;
	if (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(betweenDiff) <= threshold) {
		const guides: SnapPoint['guides'] = [];
		for (let i = 1; i < parent.children.length; i++) {
			const child = parent.children[i] as HTMLElement;
			const marginTop = getExtra(child, type, 'close');
			guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
		}
		const snapPoints: SnapPoint[] = [{
			point: {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range},
			offset: parent,
			guides
		},]
		return {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range, snapPoints}
	}

	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
		let snapPoints: SnapPoint[] = [];
		if (gapStart === 0) {
			const guides: SnapPoint['guides'] = [];
			for (let i = 1; i < parent.children.length; i++) {
				const child = parent.children[i] as HTMLElement;
				const marginTop = getExtra(child, type, 'close');
				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
			}
			snapPoints = [{
				point: {y: posY + betweenDiff * direction, range},
				offset: parent,
				guides
			},]
		}
		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapPoints};
	}

	
	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
		let snapPoints: SnapPoint[] = [];
		if (gapEnd === 0) {
			const guides: SnapPoint['guides'] = [];
			for (let i = 1; i < parent.children.length; i++) {
				const child = parent.children[i] as HTMLElement;
				const marginTop = getExtra(child, type, 'close');
				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
			}
			snapPoints = [{
				point: {y: posY + betweenDiff * direction, range},
				offset: parent,
				guides
			},]
		}
		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapPoints};
	}

	// const gapDiff = minGap - gapBetween;
	// if (Math.abs(gapDiff) <= 10 && (!isMoving)) {
	// 	console.log(posY + gapDiff * direction);
	// 	return {y: posY + (gapDiff * direction * (parent.children.length - 1)), range, snapPoints: []};
	// }

	return undefined;
}

function createSnapGuidesOtherAxis(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', _scale: number) {
	const parent = element.parentElement!;
	const {childrenMidpoint, parentMidpoint, gapEnd, gapStart, gapBetween, evenlySpace, aroundSpace, betweenSpace, centerSpace} = calculateFlexInfo(parent, type, 1);
	
	//Only show snap points if there is space to move
	if (gapEnd === 0 && gapStart === 0) return;
	
	const _ = getBoundingClientRect(element, type, 'close', 1) - getBoundingClientRect(parent, type, 'close', 1);
	const posY = _;
	const dy = pos + getBoundingClientRect(parent, type, 'close', 1) - current;

	const selfIndex = Array.from(parent.children).indexOf(element);
	const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= minGap;
	const direction = selfIndex === 0 ? -1 : 1;
	const threshold = 10;
	const range = 15;

	const centerDiff = parentMidpoint - childrenMidpoint;
	if (Math.abs(centerDiff) <= threshold && isMoving) {
		const firstChild = parent.children[0] as HTMLElement;
		const lastChild = parent.children[parent.children.length - 1] as HTMLElement || firstChild;

		const snapPoints: SnapPoint[] = [{
			point: {y: posY + centerDiff, range},
			offset: parent,
			guides: [
				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
			]
		},]
		return {y: posY + centerDiff, range, snapPoints};
	}

	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
		let snapPoints: SnapPoint[] = [];
		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapPoints};
	}

	
	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
		let snapPoints: SnapPoint[] = [];
		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapPoints};
	}

	return undefined;
}

interface FlexValues {
	paddingLeft: string;
	paddingRight: string;
	paddingTop: string;
	paddingBottom: string;
	justifyContent: string;
	alignItems: string;
	gap: string;
}
interface DraggableProps {
	element: HTMLElement | undefined;
	onIsDragging?: () => void;
	//TODO: Do something better to not have a dependency on FlexValues
	onDragFinish?: (parent: HTMLElement, oldValues: FlexValues) => void;
	snapPoints?: SnapPoint[],
	restrictToParent?: boolean;
	scale: number;
}
const useDraggable = ({element, onIsDragging, onDragFinish, restrictToParent=false, scale}: DraggableProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const [offsetX, setOffsetX] = useState<number>(0);
	const [offsetY, setOffsetY] = useState<number>(0);
	const refX = useRef(0);
	const refY = useRef(0);
	const snapGuidesX = useRef<SnapPoint[]>([]);
	const snapGuidesY = useRef<SnapPoint[]>([]);
	const $parent = $('#harmony-snap-guides');
	const [oldValues, setOldValues] = useState<FlexValues>({paddingLeft: '', paddingRight: '', paddingTop: '', paddingBottom: '', justifyContent: '', alignItems: '', gap: ''});
		
	useEffect(() => {
		if (element) {
			refY.current = getBoundingClientRect(element, 'y', 'close', scale)
			refX.current = getBoundingClientRect(element, 'x', 'close', scale);
			setOffsetX(refX.current);
			setOffsetY(refY.current);

			//TODO: This is breaking all dependencies. Bad
			setOldValues({
				paddingLeft: element.parentElement!.style.paddingLeft || '', 
				paddingRight: element.parentElement!.style.paddingRight || '', 
				paddingTop: element.parentElement!.style.paddingTop || '', 
				paddingBottom: element.parentElement!.style.paddingBottom || '', 
				justifyContent: element.parentElement!.style.justifyContent || '', 
				alignItems: element.parentElement!.style.alignItems || '',
				gap: element.parentElement!.style.gap || '',
			});
			const modifiers: Modifier[] = [
				interact.modifiers.snap({
					targets: [interact.createSnapGrid({x: 2, y: 2})],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{x: 0, y: 0}],
					offset: 'self',
				}),
				interact.modifiers.snap({
					targets: [function(x, y, interaction, offset, index) {
						const style = getComputedStyle(element.parentElement!);

						const resX = style.flexDirection === 'column' ? createSnapGuidesOtherAxis(element, x, refX.current * scale, 'x', scale) : createSnapGuides(element, x, refX.current * scale, 'x', scale);
						const resY = style.flexDirection === 'column' ? createSnapGuides(element, y, refY.current * scale, 'y', scale) : createSnapGuidesOtherAxis(element, y, refY.current * scale, 'y', scale);
						if (!resX) {
							snapGuidesX.current = [];
						}
						if (!resY) {
							snapGuidesY.current = [];
						}

						let result: {x?: number, y?: number, range?: number} | undefined;

						if (resX) {
							result = {};
							result.x = resX.y;
							result.range = resX.range;
							snapGuidesX.current = resX.snapPoints;
						}

						if (resY) {
							result = result || {};
							result.y = resY.y;
							result.range = resY.range;
							snapGuidesY.current = resY.snapPoints;
						}

						return result;
					}],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
					offset: 'parent'//{x: element.parentElement!.getBoundingClientRect().x / scale, y: element.parentElement!.getBoundingClientRect().y / scale}
				}),
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
			});

			document.addEventListener('keydown', onKeyDown);
		}

		return () => document.removeEventListener('keydown', onKeyDown)
	}, [element, scale]);

	const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
		//TODO: Dependency on contentEditable. This hook should not know about that
		if (!element || element.contentEditable === 'true') return;

		let axis: Axis | undefined = undefined;
		let amount = 5;
		switch (e.key) {
			case 'ArrowLeft':
				amount *= -1;
				axis = 'x';
				break;
			case 'ArrowRight':
				axis = 'x';
				break;
			case 'ArrowUp':
				amount *= -1;
				axis = 'y';
				break;
			case 'ArrowDown':
				axis = 'y';
				break;
		}
		if (axis === undefined) return;
		
		e.preventDefault();
		setOffsetX(axis === 'x' ? offsetX + amount : offsetX);
		setOffsetY(axis === 'y' ? offsetY + amount : offsetY);
		const rect = element.getBoundingClientRect();
		changeByAmount(element, {
			left: axis === 'x' ? offsetX + amount : offsetX, 
			top: axis === 'y' ? offsetY + amount : offsetY, 
			width: rect.width, 
			height: rect.height,
		}, setIsDragging);
	});

	const handleGuides = useEffectEvent((posY: number, snapPoints: SnapPoint[], axis: Axis) => {
		const createGuide = (rect: {x0: number, y0: number, y1: number, x1: number, text?: string | number}) => {
			const height = rect.y1 - rect.y0 || 1;
			const width = rect.x1 - rect.x0 || 1;

			const lineTemplate = `<div name="harmony-guide-0" class="hw-bg-primary hw-absolute hw-z-[100]" style="top: ${rect.y0}px; left: ${rect.x0}px; height: ${height}px; width: ${width}px">
				${rect.text && height > 1 ? `<div class="hw-bg-primary hw-rounded-full hw-absolute hw-text-[8px] hw-p-1 hw-text-white hw-top-1/2 -hw-translate-y-1/2 hw-left-1">
					${typeof rect.text === 'number' ? round(rect.text, 2) : rect.text}
				</div>` : rect.text && width > 1 ? `<div class="hw-bg-primary hw-rounded-full hw-absolute hw-text-[8px] hw-p-1 hw-text-white hw-left-1/2 -hw-translate-x-1/2 hw-top-1">
				${typeof rect.text === 'number' ? round(rect.text, 2) : rect.text}
			</div>` : ''}
			</div>`
			
			const $line = $(lineTemplate);
			$line.appendTo($parent);
			return $line;
		}

		const setOffset = (element: HTMLElement): {x: number, y: number, w: number, h: number} => {
			return {
				x: element.offsetLeft,
				y: element.offsetTop,
				w: element.clientWidth,
				h: element.clientHeight,
			}
		}

		snapPoints.forEach(snapPoint => {
			const {point, guides} = snapPoint;
			const offsetParent = snapPoint.offset ? setOffset(snapPoint.offset) : undefined;

			const top = (point.y as number) / scale + (getBoundingClientRect(element!.parentElement!, axis, 'close', scale) as number);
			if (close(top, posY, 0.1)) {
				guides && guides.forEach((guide) => {
					const offset = guide.offset ? setOffset(guide.offset) : offsetParent || {x: 0, y: 0, w: 0, h: 0};
					const copy = {...guide};
					copy.relative.forEach(p => {
						const sizeY = guide.rotate ? offset.w : offset.h;
						const sizeX = guide.rotate ? offset.h : offset.w;
						const sizeOffset = p.includes('y') ? sizeY : sizeX;
						copy[p] *= sizeOffset;
					});

					if (guide.rotate) {
						const temp0 = copy.x0;
						copy.x0 = copy.y0;
						copy.y0 = temp0;
						const temp1 = copy.x1;
						copy.x1 = copy.y1;
						copy.y1 = temp1;
					}

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
		// setOffsetX(event.clientX0);
		// setOffsetY(event.clientY0);
	});

	const handleTheDragging = (event: {dx: number, dy: number, rect: Rect}) => {
		!isDragging && setIsDragging(true);
		event.rect.top /= scale;
		event.rect.left /= scale;
		event.rect.right /= scale;
		event.rect.bottom /= scale;
		event.rect.height /= scale;
		event.rect.width /= scale;
		event.dy /= scale;
		event.dx /= scale;
		
		refY.current = event.rect.top;
		refX.current = event.rect.left;
		
		const style = getComputedStyle(element!.parentElement!);

		if (style.flexDirection === 'column') {
			setDragPosition(element!, event, 'y', scale);
			setDragPositionOtherAxis(element!, event, 'x', scale);
		} else {
			setDragPosition(element!, event, 'x', scale);
			setDragPositionOtherAxis(element!, event, 'y', scale);
		}

		$parent.children().remove();
		handleGuides(event.rect.top, snapGuidesY.current, 'y');
		handleGuides(event.rect.left, snapGuidesX.current, 'x');

		
		onIsDragging && onIsDragging();
	}
	  
	const drag = useEffectEvent((event: InteractEvent<'drag', 'move'>) => {
		//TODO: Remove dependency on selected
		if (element?.contentEditable === 'true') return;
		handleTheDragging({dx: event.dx, dy: event.dy, rect: event.rect});
	});
	
	const stopDragging = useEffectEvent((e: InteractEvent<'drag', 'move'>) => {
		setIsDragging(false);
		// setOffsetX(refX.current);
		// setOffsetY(refY.current);
		$parent.children().remove();
		onDragFinish && onDragFinish(element!.parentElement!, oldValues);
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

  export const changeByAmount = (element: HTMLElement, eventRect: Omit<Rect, 'bottom' | 'right'>, setIsDragging?: (isDragging: boolean) => void) => {
	const rect = element.getBoundingClientRect();
	
	const start = new PointerEvent('pointermove', {clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerType: 'mouse', bubbles: true});;
	const down = new PointerEvent('pointerdown', {clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerType: 'mouse', bubbles: true});
	const move = new PointerEvent('pointermove', {clientX: eventRect.left + eventRect.width / 2, clientY: eventRect.top + eventRect.height / 2, pointerType: 'mouse', bubbles: true});
	const up = new PointerEvent('pointerup', {clientX: eventRect.left + eventRect.width / 2, clientY: eventRect.top + eventRect.height / 2, pointerType: 'mouse', bubbles: true});
	setIsDragging && setIsDragging(true);
	element.dispatchEvent(start);
	element.dispatchEvent(down);
	element.dispatchEvent(move);
	element.dispatchEvent(up);
	setIsDragging && setIsDragging(false);
}