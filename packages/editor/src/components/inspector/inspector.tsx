'use client';
import { useHighlighter } from "./highlighter"
import { useCallback, useEffect, useRef } from "react"
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { ReactComponentIdentifier } from "./component-identifier";
import hotkeys from 'hotkeys-js';
import { SelectMode } from "../panel/harmony-panel";

export const componentIdentifier = new ReactComponentIdentifier();

export interface InspectorProps {
	hoveredComponent: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onHover: (component: HTMLElement | undefined) => void;
	onSelect: (component: HTMLElement | undefined) => void;
	rootElement: HTMLElement | undefined;
	parentElement: HTMLElement | undefined;
	onElementTextChange: (value: string) => void;
	mode: SelectMode;
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, onElementTextChange, rootElement, parentElement, mode}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<Overlay>();

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
			overlayRef.current.select(selectedComponent, onElementTextChange);
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

		if (!isInteractableComponent(element)) {
			onHoverProps(undefined);
			return false;
		}

		onHoverProps(element);

		return true;
	});
	const onClick = useEffectEvent((element: HTMLElement) => {
		const container = containerRef.current;
		if (container === null) return false;
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

	select(element: HTMLElement, onTextChange: (value: string) => void) {
		this.inspect(element, 'select');

		if (Array.from(element.children).every(child => child.nodeType === Node.TEXT_NODE)) {
			element.contentEditable = 'true';
			element.addEventListener('input', (e) => {
				const target = e.target as HTMLElement;
				onTextChange(target.textContent || '');
			})
		}
	}

	inspect(element: HTMLElement, method: 'select' | 'hover', onTextChange?: (value: string) => void) {
		// We can't get the size of text nodes or comment nodes. React as of v15
    // heavily uses comment nodes to delimit text.
		if (element.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const [box, dims] = this.getSizing(element);
		const rect = new OverlayRect(this.window.document, element, this.container);
		rect[method](box, dims, onTextChange);

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
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
}

export class OverlayRect {
  node: HTMLElement
  border: HTMLElement
  padding: HTMLElement
  content: HTMLElement
	// parentElement: HTMLElement | undefined | null;
	// nextSiblingElement: Element | undefined | null;
	elementVisibleValue: string | undefined;

  constructor(doc: Document, private element: HTMLElement, container: HTMLElement) {
    this.node = doc.createElement('div')
    this.border = doc.createElement('div')
    this.padding = doc.createElement('div')
    this.content = doc.createElement('div')

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

	public hover(box: Rect, dims: BoxSizing, onTextChange?: (value: string) => void) {
		this.update(box, dims, 2, false, false);
	}

	public select(box: Rect, dims: BoxSizing, onTextChange?: (value: string) => void) {
		if (onTextChange && Array.from(this.element.childNodes).some(n => n.nodeType === Node.TEXT_NODE)) {
			const onBlur = (e: FocusEvent) => {
				//if (!this.elementVisibleValue) return;

				const target = e.target as HTMLElement;
				let content = '';
				for (let i = 0; i < target.childNodes.length; i++) {
					const node = target.childNodes[i];
					if (node.nodeType === Node.TEXT_NODE) {
						//this.element.childNodes[i].textContent = node.textContent;
						content = node.textContent || '';
					}
				}
				this.element.style.visibility = 'visible';
				onTextChange(content);
				//this.element.textContent = target.textContent;
			}
			const clonedElement = this.cloneElement(this.element, ['-webkit-user-modify']);
			clonedElement.contentEditable = "true";
			clonedElement.addEventListener('blur', onBlur);

			this.content.appendChild(clonedElement);
			// this.parentElement = this.element.parentElement;
			// this.nextSiblingElement = this.element.nextElementSibling;
			this.elementVisibleValue = this.element.style.visibility;
			this.element.style.visibility = 'hidden';
		}

		this.update(box, dims, 2, false, false);
	}

	private cloneElement(element: HTMLElement, propertiesToSkip: string[] = []): HTMLElement {
		const clonedElement = element.cloneNode(true) as HTMLElement;//document.createElement(element.tagName);
		for (let i = 0; i < clonedElement.childNodes.length; i++) {
			const node = clonedElement.childNodes[i];
			if (node.nodeType !== Node.TEXT_NODE) {
				(node as HTMLElement).contentEditable = "false";
			}
		}
		// Copy text content
		//clonedElement.textContent = element.textContent;

		// Copy computed styles
		var computedStyles = window.getComputedStyle(element);
		for (var i = 0; i < computedStyles.length; i++) {
			var propertyName = computedStyles[i];
			if (propertiesToSkip.includes(propertyName)) continue;

			clonedElement.style[propertyName as unknown as number] = computedStyles.getPropertyValue(propertyName);
		}
		
		return clonedElement as HTMLElement;
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