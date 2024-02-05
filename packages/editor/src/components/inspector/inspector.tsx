'use client';
import { useHighlighter } from "./highlighter"
import { useCallback, useEffect, useRef, useState } from "react"
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { ReactComponentIdentifier } from "./component-identifier";
import hotkeys from 'hotkeys-js';
import { SelectMode } from "../panel/harmony-panel";
import { getNumberFromString } from "@harmony/util/src";
import $ from 'jquery';

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
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, onElementTextChange, onResize, rootElement, parentElement, mode}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<Overlay>();

	const {onDrag, isDragging} = useResize({onIsDragging(rect) {
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
	}, onDragFinish(rect) {
		
	}});

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
	})
	useHighlighter({
		handlers: {
			onClick,
			onHover,
			onHold(element) {
				return true;
			}
		},
		container: rootElement,
		noEvents: []
	});

	return (
		<div ref={containerRef} className="z-100">
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

class Overlay {
	window: Window
  	tipBoundsWindow: Window
	rects: Map<'select' | 'hover', {rect: OverlayRect, element: HTMLElement, observer: ResizeObserver | undefined}>
  
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
			stuff.rect.remove();
			this.rects.delete(method);
			if (method === 'select') stuff.element.contentEditable = 'inherit';
			stuff.observer?.disconnect();
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

		if (listeners.onTextChange && Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE)) {
			element.contentEditable = 'true';
			element.addEventListener('input', (e) => {
				const target = e.target as HTMLElement;
				listeners.onTextChange && listeners.onTextChange(target.textContent || '');
			})
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
		if (true) {
			const size = element.getBoundingClientRect();
			mutationObserver = new ResizeObserver((mutations) => {
				const newSize = element.getBoundingClientRect();
				const stuff = this.rects.get(method);
				for (const mutation of mutations) {
					if ((size.width !== newSize.width || size.height !== newSize.height) && stuff) {
						const [box, dims] = this.getSizing(element);
						stuff.rect.updateSize(box, dims);
					}
				}
			});
	
			mutationObserver.observe(element);
		}
		this.rects.set(method, {rect, element, observer: mutationObserver});
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
		this.update(box, dims, 2, false, false);
	}

	public hover(box: Rect, dims: BoxSizing) {
		this.update(box, dims, 2, false, false);
	}

	public select(box: Rect, dims: BoxSizing) {
		this.update(box, dims, 2, false, false);
	}


  	private update(box: Rect, dims: BoxSizing, borderSize: number, showPadding: boolean, editText: boolean) {
		dims.borderBottom = borderSize;
		dims.borderLeft = borderSize;
		dims.borderRight = borderSize;
		dims.borderTop = borderSize;
	    boxWrap(dims, 'border', this.border)
		
		if (!editText) {
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
		}

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

		this.border.style.borderColor = overlayStyles.background
    	this.padding.style.borderColor = overlayStyles.padding
		this.node.style.borderColor = overlayStyles.margin;
		if (!showPadding) {
			this.node.style.borderColor = 'transparent';
			this.padding.style.borderColor = 'transparent';
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