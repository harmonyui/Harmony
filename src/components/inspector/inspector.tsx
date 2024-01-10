'use client';
import { createPortal } from "react-dom"
import { useHighlighter } from "./highlighter"
import { useCallback, useEffect, useRef } from "react"
import { useEffectEvent } from "../../hooks/effect-event";
import { ReactComponentIdentifier } from "./component-identifier";
import { ComponentElement } from "../../types/component";
import hotkeys from 'hotkeys-js';
import { SelectMode } from "../panel/harmony-panel";

export const componentIdentifier = new ReactComponentIdentifier();

export interface InspectorProps {
	hoveredComponent: HTMLElement | undefined;
	selectedComponent: HTMLElement | undefined;
	onHover: (component: HTMLElement | undefined) => void;
	onSelect: (component: HTMLElement | undefined) => void;
	rootElement: HTMLElement | undefined;
	harmonyContainer: HTMLElement;
	mode: SelectMode;
}
export const Inspector: React.FunctionComponent<InspectorProps> = ({hoveredComponent, selectedComponent, onHover: onHoverProps, onSelect, rootElement, harmonyContainer, mode}) => {
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
		if (container === null) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container);
		}

		if (selectedComponent) {
			overlayRef.current.select(selectedComponent);
		} else {
			overlayRef.current.remove('select');
		}
	}, [selectedComponent])

	useEffect(() => {
		const container = containerRef.current;
		if (container === null) return;

		if (overlayRef.current === undefined) {
			overlayRef.current = new Overlay(container);
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
		noEvents: [harmonyContainer]
	});

	return (
		<div ref={containerRef} className="z-[10000000]">
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
	rects: Map<'select' | 'hover', OverlayRect>
  
	constructor(private container: HTMLElement) {
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
		const rect = this.rects.get(method);
		if (rect) {
			rect.remove();
			this.rects.delete(method);
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

	select(element: HTMLElement) {
		this.inspect(element, 'select');
	}

	inspect(element: HTMLElement, method: 'select' | 'hover') {
		// We can't get the size of text nodes or comment nodes. React as of v15
    // heavily uses comment nodes to delimit text.
		if (element.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const [box, dims] = this.getSizing(element);
		const rect = new OverlayRect(this.window.document, element, this.container);
		rect[method](box, dims, false);

		if (this.rects.has(method)) {
			this.rects.get(method)?.remove();
		}
		this.rects.set(method, rect);
	}

	getSizing(element: HTMLElement): [Rect, BoxSizing] {
    const outerBox = {
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
    }
    const box = getNestedBoundingClientRect(element, this.window)
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
  background: 'rgba(120, 170, 210, 0.7)',
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

    this.node.style.zIndex = '10000000'

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

		// if (this.parentElement) {
		// 	if (this.nextSiblingElement) {
		// 		this.parentElement.insertBefore(this.element, this.nextSiblingElement);
		// 	} else {
		// 		this.parentElement.appendChild(this.element);
		// 	}
		// }
		if (this.elementVisibleValue !== undefined) {
			this.element.style.visibility = this.elementVisibleValue;
		}
  }

	public hover(box: Rect, dims: BoxSizing, editText: boolean) {
		this.update(box, dims, 1, false, editText);
	}

	public select(box: Rect, dims: BoxSizing, editText: boolean) {
		if (editText) {
			const onBlur = (e: FocusEvent) => {
				const target = e.target as HTMLElement;
				for (let i = 0; i < target.childNodes.length; i++) {
					const node = target.childNodes[i];
					if (node.nodeType === Node.TEXT_NODE) {
						this.element.childNodes[i].textContent = node.textContent;
					}
				}
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

		this.update(box, dims, 2, true, editText);
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

			clonedElement.style[propertyName] = computedStyles.getPropertyValue(propertyName);
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
export function getNestedBoundingClientRect(node: HTMLElement, boundaryWindow: Window | HTMLElement): Rect
export function getNestedBoundingClientRect(node: HTMLElement): Rect {
  return node.getBoundingClientRect()
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