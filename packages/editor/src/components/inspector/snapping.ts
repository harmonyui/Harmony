import { capitalizeFirstLetter, groupBy, groupByDistinct, round } from "@harmony/util/src";
import interact from "interactjs";
import { useState, useEffect, useRef, useMemo } from "react";
import { Rect, RectBox, isImageElement, isSelectable, isTextElement, selectDesignerElement, selectDesignerElementReverse } from "./inspector";
import { useEffectEvent } from "../../../../ui/src/hooks/effect-event";
import {InteractEvent, ResizeEvent} from '@interactjs/types'
import {Modifier} from '@interactjs/modifiers/types'
import {AspectRatioOptions, AspectRatioState} from '@interactjs/modifiers/aspectRatio'
import {SnapPosition} from '@interactjs/modifiers/snap/pointer'
import $ from 'jquery';
import { info } from "console";

const close = (a: number, b: number, threshold: number): boolean => {
	return Math.abs(a-b) <= threshold;
}

const getMinGap = (parent: HTMLElement): number => {
	const minGapStr = parent.dataset.minGap;
	let minGap = 0;
	if (!minGapStr) {
		const style = getComputedStyle(parent);
		minGap = parseFloat($(parent).css('gap') || '0');
		if (isNaN(minGap)) {
			minGap = 0;
		}
		parent.dataset.minGap = `${minGap}`;
	} else {
		minGap = parseFloat(minGapStr);
	}

	return Math.min(minGap, 8);
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
	const upper = capitalizeFirstLetter(type);
	return parseFloat($(element).css(`margin${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
}

const getProperty = (element: HTMLElement, property: 'margin' | 'border' | 'padding', type: 'top' | 'bottom' | 'left' | 'right') => {
	const upper = capitalizeFirstLetter(type);
	return parseFloat($(element).css(`${property}${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
}

type RelativePoint = 'x0' | 'x1' | 'y0' | 'y1';
type SnapPoint = {
    point: SnapPosition;
	offset?: HTMLElement,
	guides?: {
		x0: number, y0: number, x1: number, y1: number, text?: number | string, offset?: HTMLElement, 
		relative: RelativePoint[],
		rotate?: boolean
	}[]
}

function getElementHeight(element: HTMLElement): number {
	return $(element).outerHeight(true) || element.clientHeight;
}

type BoundingType = 'close' | 'far' | 'size' | 'size-full';

const getOffsetRect = (element: HTMLElement, includeBorder=true): Rect => {
    const border = includeBorder ? {
        left: parseFloat($(element).css('borderLeft') || '0'),
        right: parseFloat($(element).css('borderRight') || '0'),
        top: parseFloat($(element).css('borderTop') || '0'),
        bottom: parseFloat($(element).css('borderBottom') || '0'),
    } : {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    }
    return {
        left: element.offsetLeft,
        right: element.offsetLeft + element.clientWidth + border.left + border.right,
        top: element.offsetTop,
        bottom: element.offsetTop + element.clientHeight + border.top + border.bottom,
        width: element.clientWidth + border.left + border.right,
        height: element.clientHeight + border.top + border.bottom
    }
}

const getBoundingRect = (element: HTMLElement): Rect => {
	const rect = element.getBoundingClientRect();
	return {
		left: rect.left,
		right: rect.right,
		top: rect.top,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height
	}
}
function getBoundingClientRect(element: HTMLElement, axis: Axis, type: BoundingType, scale: number, rectOverride?: Rect): number {
    const rect = rectOverride || element.getBoundingClientRect();

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

function getBoundingClientRectParent(parent: HTMLElement, axis: Axis, type: BoundingType, scale: number, rectOverride?: Rect) {
	const rect = rectOverride || parent.getBoundingClientRect();

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

type Side = 'close' | 'far';
type RectSide = 'bottom' | 'top' | 'left' | 'right';
type Axis = 'x' | 'y';

const getSibling = (element: HTMLElement, children: HTMLElement[], side: RectSide, scale: number, rectOverride?: Rect) => {
	const otherSideClose = side === 'left' || side === 'right' ? 'top' : 'left';
	const otherSideFar = otherSideClose === 'top' ? 'bottom' : 'right';
	const axis = side === 'left' || side === 'right' ? 'x' : 'y';
	const type = side === 'left' || side === 'top' ? 'close' : 'far';
	const otherAxis = axis === 'x' ? 'y' : 'x';
	const otherSide = side === 'left' ? 'right' : side === 'top' ? 'bottom' : side === 'right' ? 'left' : 'top';

	const selfLocationCloseOther = getBoundingClientRect(element, otherAxis, 'close', scale, rectOverride);
	const selfLocationFarOther = getBoundingClientRect(element, otherAxis, 'far', scale, rectOverride);
	const selfLocation = getBoundingClientRect(element, axis, type, scale, rectOverride);

	let minLocation: {value: number, element: HTMLElement} | undefined = undefined;
	for (const sibling of children) {
		if (sibling === element) continue;

		const rect = getBoundingRect(sibling);
		if (!(rect[otherSideClose] < selfLocationCloseOther && rect[otherSideFar] < selfLocationCloseOther || rect[otherSideClose] > selfLocationFarOther && rect[otherSideFar] > selfLocationFarOther)) {//(rect[otherSideClose] >= selfLocationCloseOther && rect[otherSideClose] <= selfLocationFarOther || rect[otherSideFar] >= selfLocationCloseOther && rect[otherSideFar] <= selfLocationFarOther) {
			const isCorrectDirection = side === 'left' || side === 'top' ? rect[otherSide] <= selfLocation : rect[otherSide] > selfLocation;
			const isCloser = side === 'left' || side === 'top' ? rect[otherSide] > (minLocation?.value || -Infinity) : rect[otherSide] < (minLocation?.value || Infinity);
			if (isCorrectDirection && isCloser) {
				minLocation = {
					value: rect[otherSide],
					element: sibling
				}
			}
		}
	}

	return minLocation?.element;
}

function getGapTypesToParent(element: HTMLElement, parent: HTMLElement, axis: Axis, side: Side, scale: number) {
	const otherSide = side === 'close' ? 'far' : 'close';
	const gap = side === 'close' ? getBoundingClientRect(element, axis, side, scale) - getBoundingClientRectParent(parent, axis, side, scale) : getBoundingClientRectParent(parent, axis, side, scale) - getBoundingClientRect(element, axis, side, scale); 
    return getGapTypes(element, parent, axis, side, ['margin', 'other-padding'], gap);
}

function getGapTypesToSibiling(element: HTMLElement, sibling: HTMLElement, axis: Axis, side: Side, scale: number) {
	const otherSide = side === 'close' ? 'far' : 'close';
	const gap = side === 'close' ? getBoundingClientRect(element, axis, side, scale) - getBoundingClientRect(sibling, axis, otherSide, scale) : getBoundingClientRect(sibling, axis, otherSide, scale) - getBoundingClientRect(element, axis, side, scale); 
    return getGapTypes(element, sibling, axis, side, ['margin', 'other-otherside-margin'], gap);
}

type GapType = `${'other-' | ''}${'otherside-' | ''}${'margin' | 'padding'}`
interface GapInfo {
    type: GapType | 'empty',
    value: number,
    element: HTMLElement,
    style: string | undefined,
}
interface EdgeInfo {
    gap: number,
    relation: 'parent' | 'sibling',
    edgeElement: HTMLElement,
    edgeLocation: number,
    edgeLocationRelative: number,
    gapTypes: GapInfo[],
}

function getGapTypes(fromElement: HTMLElement, toElement: HTMLElement, axis: Axis, side: Side, types: GapType[], gap: number): GapInfo[] {
    const getRectSide = (axis: Axis, side: Side): RectSide => {
        const mapping: Record<Axis, Record<Side, RectSide>> = {
            x: {
                close: 'left',
                far: 'right'
            },
            y: {
                close: 'top',
                far: 'bottom'
            }
        }

        return mapping[axis][side];
    }

	//Margin of the parent can be affected by the child margin if its the first layer and a single child
	const secondNephi667 = (element: HTMLElement, numSoFar: number, style: string): {value: number, element: HTMLElement}[] => {
		const getValue = (element: HTMLElement, style: string): number => {
			const styleValue = $(element).css(style);
			if (!styleValue) return numSoFar;
	
			let value: number = parseFloat(styleValue);
			if (isNaN(value)) {
				return 0;
			} 
	
			return value;
		}
		
		const ret: {value: number, element: HTMLElement}[] = [];
		let value = getValue(element, style);
		if (element.children.length === 1) {
			const child = element.children[0] as HTMLElement;
			const childValue = getValue(child, style);
			value = value - childValue;
			if (value > 0) {
				ret.push({value, element});
			}
			ret.push({value: childValue, element: child});
		} else {
			ret.push({value, element});
		}

		return ret;
	}

	if (gap < 0) return [];

    const otherSide = side === 'close' ? 'far' : 'close';
    
    const gapTypes: GapInfo[]  = [];
    for (const type of types) {
        //Referencing the 'toElement'
        const isOther = type.includes('other-');

        //if true then that means we use otherSide
        const isOtherSide = type.includes('otherside-');
        const curr = isOther ? toElement : fromElement;
        const rawType = type.replace('other-', '').replace('otherside-', '');
        
        const style = `${rawType}${capitalizeFirstLetter(getRectSide(axis, isOtherSide ? otherSide : side))}`

		const values = secondNephi667(curr, 0, style);
		
        gapTypes.push(...values.map(({value, element}) => ({type, value, element, style})));
    }

	const totalSoFar = gapTypes.reduce((prev, curr) => prev + curr.value, 0);
	const remainingGap = gap - totalSoFar;
	if (remainingGap > 0) {
		gapTypes.push({element: fromElement, type: 'empty', style: undefined, value: remainingGap})
	} else if (!close(remainingGap, 0, 0.1) && remainingGap < 0.1) {
		//throw new Error("The gaps do not add up")
		
	}

    return gapTypes;
}

interface ElementEdgeInfo {
    elementLocation: number;
    elementLocationRelative: number;
    element: HTMLElement;
    parentMidpoint: number;
    parentMidpointRelative: number;
    parentEdge: EdgeInfo,
    siblingEdge: EdgeInfo | undefined,
}

interface ChildEdgeInfo {
    element: HTMLElement,
	index: number,
	minWidth: number,
	minHeight: number,
	widthType: 'content' | 'expand' | 'fixed',
	heightType: 'content' | 'expand' | 'fixed',
	width: number,
	height: number,
    midpointX: number,
    midpointY: number,
    left: ElementEdgeInfo,
    right: ElementEdgeInfo,
    top: ElementEdgeInfo,
    bottom: ElementEdgeInfo
}

interface ParentEdgeInfo {
	element: HTMLElement,
	children: HTMLElement[],
    childEdgeInfo: ChildEdgeInfo[],
    midpointX: number;
    midpointY: number;
    midpointXRelative: number;
    midpointYRelative: number;
	minGapBetweenX: number;
	minGapBetweenY: number;
	gapBetweenX: number | undefined;
	gapBetweenY: number | undefined;
	childrenMidpointX: number;
	childrenMidpointY: number;
	childrenWidth: number;
	childrenHeight: number;
	minWidth: number,
	minHeight: number,
	widthType: 'content' | 'expand' | 'fixed',
	heightType: 'content' | 'expand' | 'fixed',
	width: number,
	height: number,
    edges: {
        left: ElementEdgeInfo & {info: ChildEdgeInfo},
        right: ElementEdgeInfo & {info: ChildEdgeInfo},
        top: ElementEdgeInfo & {info: ChildEdgeInfo},
        bottom: ElementEdgeInfo & {info: ChildEdgeInfo},
    }
}

function calculateEdgesInfo(element: HTMLElement, scale: number, scaleActual: number, axis: Axis, updates: UpdateRect[]=[]): ChildEdgeInfo {
    const parent = element.parentElement!;
	const elementReal = element;
	element = updates.find(update => update.element === element)?.proxyElement || element;

	const otherAxis = axis === 'x' ? 'y' : 'x';
	const children = Array.from(parent.children).filter(child => isSelectable(child as HTMLElement, scaleActual)) as HTMLElement[];
	const index = children.indexOf(elementReal)

    const left = calculateAxisEdgeInfo(element, parent, axis, 'close', scale, index, children, updates);
    const right = calculateAxisEdgeInfo(element, parent, axis, 'far', scale, index, children, updates);
    const top = calculateAxisEdgeInfo(element, parent, otherAxis, 'close', scale, index, children, updates);
    const bottom = calculateAxisEdgeInfo(element, parent, otherAxis, 'far', scale, index, children, updates);
    const rectOverride = updates.find(update => update.element === element)?.rect;
    const parentOverride = updates.find(update => update.element === parent)?.rect;
    const midpointX = (getBoundingClientRect(element, axis, 'close', scale, rectOverride) + getBoundingClientRect(element, axis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, axis, 'close', scale, parentOverride);
    const midpointY = (getBoundingClientRect(element, otherAxis, 'close', scale, rectOverride) + getBoundingClientRect(element, otherAxis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, otherAxis, 'close', scale, parentOverride);
    //TODO: We are doing lots of hacky stuff with images. Stop that.
	
	let minWidth = 20;
	let minHeight = 20;
	let minWidthContent = 20;
	let minHeightContent = 20;	

	//TODO: I'm sure this logic will break in other scenarios, but we essentially want the sizing
	//stuff to happen at the lower level
	const sizingElement = selectDesignerElementReverse(element);
	if (sizingElement instanceof HTMLImageElement) {
		minWidth = sizingElement.naturalWidth;
		minWidth = sizingElement.naturalHeight;
		minWidthContent = minWidth;
		minHeightContent = minHeight;
	} else if (!isImageElement(sizingElement)) {
		const {width: _minWidth, height: _minHeight} = getFitContentSize(sizingElement);
		const {width: _minWidthContent, height: _minHeightContent} = getFitContentSize(sizingElement, true);
		minWidth = _minWidth;
		minHeight = _minHeight;
		minWidthContent = _minWidthContent;
		minHeightContent = _minHeightContent;
	} //Basically svg's will have a min width and height of 20
	
	const height = bottom.elementLocation - top.elementLocation;
	const width = right.elementLocation - left.elementLocation;
	let widthType: 'content' | 'expand' | 'fixed' = !isImageElement(sizingElement) && isElementFluid(sizingElement, 'width') ? 'expand' : close(width, minWidthContent, 0.1) ? 'content' : 'fixed';
	let heightType: 'content' | 'expand' | 'fixed' = !isImageElement(sizingElement) && isElementFluid(sizingElement, 'height') ? 'expand' : close(height, minHeightContent, 0.1) ? 'content' : 'fixed';

	if (isImageElement(sizingElement) || isImageElement(selectDesignerElementReverse(sizingElement))) {
		heightType = 'fixed';
		widthType = 'fixed';
	}
	

    return {
        element,
        left,
        right,
        top,
        bottom,
        midpointX,
        midpointY,
        index,
		minWidth,
		minHeight,
		widthType,
		heightType,
		height,
		width,
    }
}

function calculateAxisEdgeInfo(element: HTMLElement, parent: HTMLElement, axis: Axis, side: Side, scale: number, selfIndex: number, children: HTMLElement[], updates: UpdateRect[]=[]): ElementEdgeInfo {
   if (!parent) throw new Error("Element does not have a parent");
    
    const otherSide = side === 'close' ? 'far' : 'close';
    const otherAxis = axis === 'x' ? 'y' : 'x';

    const getRectOverride = (element: HTMLElement): Rect | undefined => {
        const updateRect = updates.find(update => update.element === element || update.proxyElement === element);
        return updateRect?.rect;
    }

    const myStart = getBoundingClientRect(element, otherAxis, side, scale, getRectOverride(element));
	const myEnd = getBoundingClientRect(element, otherAxis, otherSide, scale, getRectOverride(element));
	const parentGap = side === 'close' ? getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) : getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) - getBoundingClientRect(element, axis, side, scale, getRectOverride(element))
	const parentEdge: EdgeInfo = side === 'close' ? {
        gap: parentGap,
        relation: 'parent',
        edgeElement: parent,
        gapTypes: getGapTypesToParent(element, parent, axis, side, scale),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: 0,
    } : {
        gap: parentGap,
        relation: 'parent',
        edgeElement: parent,
        gapTypes: getGapTypesToParent(element, parent, axis, side, scale),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) - getBoundingClientRectParent(parent, axis, otherSide, scale, getRectOverride(parent)),
    }

    // if (axis === 'x') {
    //     return {close, far};
    // }
    let siblingEdge: EdgeInfo | undefined = undefined;
	// const rectSide = axis === 'x' ? (side === 'close' ? 'left' : 'right') : (side === 'close' ? 'top' : 'bottom');
	// const sibling = getSibling(element, children, rectSide, scale, getRectOverride(element));
	// if (sibling) {
	// 	siblingEdge = side === 'close' ? {
	// 		gap: getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
	// 		relation: 'sibling',
	// 		edgeElement: sibling,
	// 		gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scale),
	// 		edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
	// 		edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
	// 	} : {
	// 		gap: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - getBoundingClientRect(element, axis, side, scale, getRectOverride(element)),
	// 		relation: 'sibling',
	// 		edgeElement: sibling,
	// 		gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scale),
	// 		edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
	// 		edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
	// 	}
	// }
    if (selfIndex > 0 && side === 'close') {
        const sibling = children[selfIndex - 1] as HTMLElement;
        const newStart = getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling));
        siblingEdge = {
            gap: newStart,
            relation: 'sibling',
            edgeElement: sibling,
            gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scale),
            edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
            edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
        };
    }

    if (selfIndex < children.length - 1 && side === 'far') {
        const sibling = children[selfIndex + 1] as HTMLElement;
        const newEnd = getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - getBoundingClientRect(element, axis, side, scale, getRectOverride(element));
        siblingEdge = {
            gap: newEnd,
            relation: 'sibling',
            edgeElement: sibling,
            gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scale),
            edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
            edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
        };
    }

    const parentMidpoint = (getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent)) + getBoundingClientRectParent(parent, axis, 'size', scale, getRectOverride(parent)) / 2) + (side === 'close' ? -1 : 1) * getBoundingClientRect(element, axis, 'size', scale, getRectOverride(element)) / 2;
    const parentMidpointRelative = parentMidpoint - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent));
	const elementLocation = getBoundingClientRect(element, axis, side, scale, getRectOverride(element));
    const elementLocationRelative = elementLocation - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent))
    return {parentEdge, siblingEdge, elementLocation, elementLocationRelative, parentMidpoint, parentMidpointRelative, element}
}

function calculateParentEdgeInfo(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentEdgeInfo {
    const childEdgeInfo: ChildEdgeInfo[] = [];
	const children = Array.from(parent.children).filter(child => isSelectable(child as HTMLElement, scaleActual)) as HTMLElement[];

	const firstChild = children[0] as HTMLElement | undefined;
	const lastChild = children[children.length - 1] as HTMLElement | undefined;
	const leftSide = axis === 'x' ? 'left' : 'top';
	const rightSide = axis === 'x' ? 'right' : 'bottom';
	const topSide = axis === 'x' ? 'top' : 'left';
	const bottomSide = axis === 'x' ? 'bottom' : 'right'; 
	const otherAxis = axis === 'x' ? 'y' : 'x';

	
	
	const getRectOverride = (element: HTMLElement): Rect | undefined => {
        const updateRect = updates.find(update => update.element === element);
        return updateRect?.rect;
    }

    //If we want to use the client properties instead of boudning box, add an override to everything that doesn't already have an override
    if (useRectOffset) {
        if (!updates.find(update => update.element === parent)) {
            updates.push({element: parent, rect: getOffsetRect(parent)})
        }

        for (const child of children) {
            if (!updates.find(update => update.element === child)) {
                updates.push({element: child as HTMLElement, rect: getOffsetRect(child as HTMLElement)})
            }
        }
    }
    for (const child of children) {
        childEdgeInfo.push(calculateEdgesInfo(child as HTMLElement, scale, scaleActual, axis, updates));
    }

    const copy = childEdgeInfo.slice();
    const left = copy.sort((a, b) => a[leftSide].parentEdge.gap - b[leftSide].parentEdge.gap)[0];
    const right = copy.sort((a, b) => a[rightSide].parentEdge.gap - b[rightSide].parentEdge.gap)[0];
    const top = copy.sort((a, b) => a[topSide].parentEdge.gap - b[topSide].parentEdge.gap)[0];
    const bottom = copy.sort((a, b) => a[bottomSide].parentEdge.gap - b[bottomSide].parentEdge.gap)[0];

    const midpointX = (getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent)) + getBoundingClientRectParent(parent, axis, 'size', scale, getRectOverride(parent)) / 2);
	const midpointY = (getBoundingClientRectParent(parent, otherAxis, 'close', scale, getRectOverride(parent)) + getBoundingClientRectParent(parent, otherAxis, 'size', scale, getRectOverride(parent)) / 2);
	const midpointXRelative = midpointX - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent));
    const midpointYRelative = midpointY - getBoundingClientRectParent(parent, otherAxis, 'close', scale, getRectOverride(parent));
	const childrenWidth = children.reduce((prev, curr) => prev + curr.clientWidth, 0);
	const childrenHeight = children.reduce((prev, curr) => prev + curr.clientHeight, 0);
	const childrenMidpointX = lastChild && firstChild ? (getBoundingClientRect(lastChild, axis, 'far', scale, getRectOverride(lastChild)) + getBoundingClientRect(firstChild, axis, 'close', scale, getRectOverride(firstChild))) / 2 : 0;
	const childrenMidpointY = lastChild && firstChild ? (getBoundingClientRect(lastChild, otherAxis, 'far', scale, getRectOverride(lastChild)) + getBoundingClientRect(firstChild, otherAxis, 'close', scale, getRectOverride(firstChild))) / 2 : 0;
	
	let minGapBetweenX = Infinity;
	let minGapBetweenY = Infinity;
	let gapBetweenX: number | undefined = undefined;
	let gapBetweenY: number | undefined = undefined;
	if (childEdgeInfo.length > 1) {
		minGapBetweenX = childEdgeInfo[1][leftSide].elementLocationRelative - (childEdgeInfo[0][rightSide].elementLocationRelative);
		minGapBetweenY = childEdgeInfo[1][topSide].elementLocationRelative - (childEdgeInfo[0][bottomSide].elementLocationRelative);
		gapBetweenX = minGapBetweenX;
		gapBetweenY = minGapBetweenY;
		for (let i = 2; i < childEdgeInfo.length; i++) {
			const currBetweenX = childEdgeInfo[i][leftSide].elementLocationRelative - (childEdgeInfo[i - 1][rightSide].elementLocationRelative);
			const currBetweenY = childEdgeInfo[i][topSide].elementLocationRelative - (childEdgeInfo[i - 1][bottomSide].elementLocationRelative);
			
			if (currBetweenX < minGapBetweenX) {
				minGapBetweenX = currBetweenX;
			}

			if (gapBetweenX !== undefined && !close(currBetweenX, gapBetweenX, 0.1)) {
				gapBetweenX = undefined;
			}

			if (currBetweenY < minGapBetweenY) {
				minGapBetweenY = currBetweenY;
			}

			if (gapBetweenY !== undefined && !close(currBetweenY, gapBetweenY, 0.1)) {
				gapBetweenY = undefined;
			}
		}
	}

	if (minGapBetweenX === Infinity) {
		minGapBetweenX = 0;
	}

	if (minGapBetweenY === Infinity) {
		minGapBetweenY = 0;
	}
	
	const {width: minWidth, height: minHeight} = getFitContentSize(parent, true);
	const rect = getBoundingRect(parent);
	const height = rect.height;//bottom.bottom.parentEdge.edgeLocation - top.top.parentEdge.edgeLocation;
	const width = rect.width//right.right.parentEdge.edgeLocation - left.left.parentEdge.edgeLocation;
	const widthType = close(width, minWidth, 0.1) ? 'content' : isElementFluid(parent, 'width') ? 'expand' : 'fixed';
	const heightType = close(height, minHeight, 0.1) ? 'content' : isElementFluid(parent, 'height') ? 'expand' : 'fixed';
	const proxy = updates.find(update => update.element === parent)?.proxyElement || parent;

    return {
		element: proxy,
		children,
        childEdgeInfo,
        midpointX,
        midpointY,
        midpointXRelative,
        midpointYRelative,
		minGapBetweenX,
		minGapBetweenY,
		gapBetweenX,
		gapBetweenY,
		childrenWidth,
		childrenHeight,
		childrenMidpointX,
		childrenMidpointY,
        edges: {
            left: {info: left, ...left.left}, 
            right: {info: right, ...right.right},
            top: {info: top, ...top.top},
            bottom: {info: bottom, ...bottom.bottom}
        },
		minWidth,
		minHeight,
		widthType,
		heightType,
		width,
		height,
    }
}

type ParentFlexEdgeInfo = ParentEdgeInfo & {
	childrenCount: number;

	remainingSpaceX: number;
	evenlySpaceX: number;
	aroundSpaceX: number;
	betweenSpaceX: number;
	centerSpaceX: number;

	remainingSpaceY: number;
	evenlySpaceY: number;
	aroundSpaceY: number;
	betweenSpaceY: number;
	centerSpaceY: number;
}
function calculateFlexParentEdgeInfo(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentFlexEdgeInfo {
	const parentInfo = calculateParentEdgeInfo(parent, scale, scaleActual, useRectOffset, axis, updates);

	const getRectOverride = (element: HTMLElement): Rect | undefined => {
        const updateRect = updates.find(update => update.element === element);
        return updateRect?.rect;
    }

	const numChildren = parentInfo.children.length;

	
	const remainingSpaceX = getBoundingClientRect(parent, 'x', 'size', scale, getRectOverride(parent)) - parentInfo.childrenWidth;
	const evenlySpaceX = remainingSpaceX / (numChildren + 1);
	const aroundSpaceX = remainingSpaceX / numChildren;
	const betweenSpaceX = remainingSpaceX / (numChildren - 1);
	const centerSpaceX = remainingSpaceX / 2;

	const remainingSpaceY = getBoundingClientRect(parent, 'y', 'size', scale, getRectOverride(parent)) - parentInfo.childrenHeight;
	const evenlySpaceY = remainingSpaceY / (numChildren + 1);
	const aroundSpaceY = remainingSpaceY / numChildren;
	const betweenSpaceY = remainingSpaceY / (numChildren - 1);
	const centerSpaceY = remainingSpaceY / 2;



	return {
		...parentInfo,
		evenlySpaceX,
		aroundSpaceX,
		betweenSpaceX,
		centerSpaceX,
		remainingSpaceX,
		evenlySpaceY,
		aroundSpaceY,
		betweenSpaceY,
		centerSpaceY,
		remainingSpaceY,
		childrenCount: numChildren
	}
}

const setSpaceForElement = (element: HTMLElement, space: 'margin' | 'padding', side: RectSide, value: number | string) => {
	const propertyValue = typeof value === 'number' ? `${value}px` : value;
	element.style[`${space}${capitalizeFirstLetter(side)}` as unknown as number] = propertyValue;
}

const getNonWorkableGap = (gapInfo: GapInfo[]): number => {
	return gapInfo.reduce((prev, curr) => curr.type === 'empty' ? prev + curr.value : prev, 0);
}

const getSiblingGap = (gap: number, gapInfo: GapInfo[]): number => {
	// const totalGap = gapInfo.reduce((prev, curr) => prev + curr.value, 0);
	// if (totalGap !== gap) throw new Error("Gap value and gap info do not match");

	// return gapInfo.reduce((prev, curr) => curr.type !== 'empty' ? prev + curr.value : prev, 0);
	const nonWorkableGap = getNonWorkableGap(gapInfo);
	const diff = gap - nonWorkableGap;
	if (diff < 0) {
		return 0; //TODO: This should be not allowed in our restrictions
	}

	return diff;
}

interface UpdateRect {
    element: HTMLElement,
	proxyElement?: HTMLElement;
    rect: Rect
}
interface UpdateRectsProps {
    parentUpdate: UpdateRect,
    childrenUpdates: UpdateRect[]
}
function updateRects({parentUpdate, childrenUpdates}: UpdateRectsProps, scale: number, scaleActual: number) {
    const parentInfo = calculateParentEdgeInfo(parentUpdate.element, scale, scaleActual, false, 'x', [parentUpdate, ...childrenUpdates]);
	const left = 'left';
	const right = 'right';
	const top = 'top';
	const bottom = 'bottom';

	setSpaceForElement(parentInfo.element, 'padding', left, 0);
	setSpaceForElement(parentInfo.element, 'padding', right, 0);
	setSpaceForElement(parentInfo.element, 'padding', top, 0);
	setSpaceForElement(parentInfo.element, 'padding', bottom, 0);
	for (const info of parentInfo.childEdgeInfo) {
		setSpaceForElement(info.element, 'margin', left, 0);
		setSpaceForElement(info.element, 'margin', right, 0);
		setSpaceForElement(info.element, 'margin', top, 0);
		setSpaceForElement(info.element, 'margin', bottom, 0);

		const isBlock = getComputedStyle(info.element).display === 'block';

		const isChildXCenter = close(info.midpointX, parentInfo.midpointXRelative, 0.1) && close(parentInfo.edges.left.parentEdge.gap, parentInfo.edges.right.parentEdge.gap, 0.1);
		const startXSide: RectSide = !isBlock || info.midpointX <= parentInfo.midpointXRelative ? left : right;
		const endXSide = startXSide === left ? right : left;
		// const startYSide = info.midpointY <= parentInfo.midpointY ? top : bottom;
		// const endYSide = startYSide === top ? bottom : top;

		//left 
		if (startXSide === right) {
			setSpaceForElement(info[endXSide].element, 'margin', endXSide, 'auto');
		}
		const parentGap = Math.max(getSiblingGap(parentInfo.edges[startXSide].parentEdge.gap, parentInfo.edges[startXSide].parentEdge.gapTypes), 0);
		const remainingGap = info[startXSide].parentEdge.gap - parentGap
		setSpaceForElement(info[startXSide].element, 'margin', startXSide, remainingGap);
		setSpaceForElement(parentInfo.element, 'padding', startXSide, parentGap);
		if (isChildXCenter && isBlock && remainingGap > 0 && info.widthType !== 'expand') {
			setSpaceForElement(info[left].element, 'margin', left, 'auto');
			setSpaceForElement(info[right].element, 'margin', right, 'auto');
		}
		

		//right - width naturally expands in div block
		if (info.widthType === 'fixed') {
			const toResize = selectDesignerElementReverse(info.element);
			toResize.style.width = `${info.width}px`
		} else if (info.widthType === 'expand') {
			const parentGap = Math.max(getSiblingGap(parentInfo.edges[endXSide].parentEdge.gap, parentInfo.edges[endXSide].parentEdge.gapTypes), 0);
			const remainingGap = info[endXSide].parentEdge.gap - parentGap;
			setSpaceForElement(info[endXSide].element, 'margin', endXSide, remainingGap);
			setSpaceForElement(parentInfo.element, 'padding', endXSide, parentGap);
		} else {
			info.element.style.width = 'auto';
		}

		//top
		if (info.index === 0) {
			const parentGap = getSiblingGap(parentInfo.edges[top].parentEdge.gap, parentInfo.edges[top].parentEdge.gapTypes);
			setSpaceForElement(parentInfo.element, 'padding', top, parentGap);
		} else {
			if (!info.top.siblingEdge) throw new Error("Non first child should have a sibling");

			let gap = getSiblingGap(info.top.siblingEdge.gap, info.top.siblingEdge.gapTypes);
			let foundGap = false;
			for (const type of info.top.siblingEdge.gapTypes) {
				if (type.type === 'empty') continue;

				if (type.type.includes('margin')) {
					if (gap - type.value >= 0) {
						type.element.style[type.style as unknown as number] = '0px';
					} else {
						type.element.style[type.style as unknown as number] = `${gap}px`;
						foundGap = true;
						break;
					}
				}
			}
			if (!foundGap) {
				setSpaceForElement(info.element, 'margin', top, gap);
			}
		}

		//bottom - height fits content naturally
		if (info.heightType === 'fixed') {
			//TODO: hacky fix to resize the image but not the wrapper
			const toResize = selectDesignerElementReverse(info.element);
			toResize.style.height = `${info.height}px`
		} else {
			info.element.style.height = 'auto';
		}
	}

	//parent edges for sizing
	if (parentInfo.widthType === 'content') {
		setSpaceForElement(parentInfo.element, 'padding', left, getSiblingGap(parentInfo.edges[left].parentEdge.gap, parentInfo.edges[left].parentEdge.gapTypes));
		setSpaceForElement(parentInfo.element, 'padding', right, getSiblingGap(parentInfo.edges[right].parentEdge.gap, parentInfo.edges[right].parentEdge.gapTypes));
	}

	if (parentInfo.heightType === 'content') {
		setSpaceForElement(parentInfo.element, 'padding', top, getSiblingGap(parentInfo.edges[top].parentEdge.gap, parentInfo.edges[top].parentEdge.gapTypes));
		setSpaceForElement(parentInfo.element, 'padding', bottom, getSiblingGap(parentInfo.edges[bottom].parentEdge.gap, parentInfo.edges[bottom].parentEdge.gapTypes));
	}
}

function updateRectFlex({parentUpdate, childrenUpdates}: UpdateRectsProps, scale: number, scaleActual: number) {
	const parentReal = parentUpdate.element;
	const style = getComputedStyle(parentReal);
	const axis = style.flexDirection !== 'column' ? 'x' : 'y';
	const left = axis === 'x' ? 'left' : 'top';
	const right = axis === 'x' ? 'right' : 'bottom';
	const top = axis === 'x' ? 'top' : 'left';
	const bottom = axis === 'x' ? 'bottom' : 'right'; 
	const otherAxis = axis === 'x' ? 'y' : 'x';
	const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY';
	const evenlySpace = axis === 'x' ? 'evenlySpaceX' : 'evenlySpaceY';
	const aroundSpace = axis === 'x' ? 'aroundSpaceX' : 'aroundSpaceY';
	const betweenSpace = axis === 'x' ? 'betweenSpaceX' : 'betweenSpaceY';
	const gapBetween = axis === 'x' ? 'gapBetweenX' : 'gapBetweenY';
	const minGap = getMinGap(parentReal);
	const height = axis === 'x' ? 'height' : 'width';
	const width = axis === 'x' ? 'width' : 'height';
	const minHeight = axis === 'x' ? 'minHeight' : 'minWidth';
	const minWidth = axis === 'x' ? 'minWidth' : 'minHeight';
	const heightType = axis === 'x' ? 'heightType' : 'widthType';
	const widthType = axis === 'x' ? 'widthType' : 'heightType';


	const updates: UpdateRect[] = childrenUpdates;
	updates.push(parentUpdate);
	//updates.push(...Array.from(parentReal.children).map(child => ({element: child as HTMLElement, rect: getBoundingRect(child as HTMLElement)})));
	const parentInfo = calculateFlexParentEdgeInfo(parentReal, scale, scale, false, 'x', updates);
	if (!close(parentInfo[minGapBetweenX], 0, 0.1) && parentInfo[minGapBetweenX] < 0.1) {
		throw new Error("mingap cannot be less than zero")
	}


	const childrenWidthFixed = parentInfo.childEdgeInfo.every(child => child[widthType] !== 'expand');
	const childrenHeightFixed = parentInfo.childEdgeInfo.every(child => child[heightType] !== 'expand');
	
	let startXSide: RectSide = parentInfo.edges[left].parentEdge.gap <= parentInfo.edges[right].parentEdge.gap ? left : right;
	//Start X Side being right assumes we will have a flex-end, but that won't happen if one of the children has
	//expand width
	if (!childrenWidthFixed) {
		startXSide = left;
	}
	const endXSide = startXSide === left ? right : left;
	const startYSide = parentInfo.edges[top].parentEdge.gap <= parentInfo.edges[bottom].parentEdge.gap ? top : bottom;
	const endYSide = startYSide === top ? bottom : top;
	

	//If all the items are on the y center line and there is space between the top and bottom
	const isYCenter = parentInfo.childEdgeInfo.every(info => info[top].elementLocationRelative === info[top].parentMidpointRelative) && (parentInfo.edges[top].parentEdge.gap > 0 && parentInfo.edges[bottom].parentEdge.gap > 0 && close(parentInfo.edges[top].parentEdge.gap, parentInfo.edges[bottom].parentEdge.gap, 0.1)) && childrenHeightFixed;
	const isXCenter = close(parentInfo.edges[left].parentEdge.gap, parentInfo.edges[right].parentEdge.gap, 0.1) && childrenWidthFixed;
	const alignStart = parentInfo.childEdgeInfo.some(child => close(child[height], child[minHeight], 0.1)) ? 'flex-start' : 'normal';

	setSpaceForElement(parentInfo.element, 'padding', left, 0);
	setSpaceForElement(parentInfo.element, 'padding', right, 0);
	setSpaceForElement(parentInfo.element, 'padding', top, 0);
	setSpaceForElement(parentInfo.element, 'padding', bottom, 0);
	parentInfo.element.style.justifyContent = 'normal';

	for (const info of parentInfo.childEdgeInfo) {
		setSpaceForElement(info.element, 'margin', left, 0);
		setSpaceForElement(info.element, 'margin', right, 0);
		setSpaceForElement(info.element, 'margin', top, 0);
		setSpaceForElement(info.element, 'margin', bottom, 0);

		//top
		if (!isYCenter) { //Top is determined by parent padding
			const parentGap = parentInfo.edges[startYSide].parentEdge.gap;
			const remainingGap = info[startYSide].parentEdge.gap - parentGap;
			setSpaceForElement(info[startYSide].element, 'margin', startYSide, remainingGap);
			setSpaceForElement(parentInfo.element, 'padding', startYSide, parentGap);

			if (childrenHeightFixed) {
				if (startYSide === top) {
					parentInfo.element.style.alignItems = alignStart;
				}
				if (startYSide === bottom) {
					parentInfo.element.style.alignItems = 'flex-end';
				}
			} else {
				parentInfo.element.style.alignItems = 'normal';
			}

		} else if (parentInfo[heightType] !== 'content' && childrenHeightFixed) {
			parentInfo.element.style.alignItems = 'center';
			setSpaceForElement(parentInfo.element, 'padding', top, 0);
			setSpaceForElement(parentInfo.element, 'padding', bottom, 0);
		}

		//bottom - set by height or align-items (to fit content)
		if (info[heightType] === 'expand') {
			const parentGap = parentInfo.edges[endYSide].parentEdge.gap;
			const remainingGap = info[endYSide].parentEdge.gap - parentGap;
			setSpaceForElement(info[endYSide].element, 'margin', endYSide, remainingGap);
			setSpaceForElement(parentInfo.element, 'padding', endYSide, parentGap);
		}	
		else if (info[heightType] === 'fixed') {
			const toResize = selectDesignerElementReverse(info.element);
			toResize.style[height] = `${info[height]}px`;
		} else if (close(info[height], info[minHeight], 0.1) && parentInfo.element.style.alignItems === 'normal') {
			parentInfo.element.style.alignItems = 'flex-start';
		}

		//left
		if (info.index === 0) {
			if (!isXCenter) {
				const parentGap = parentInfo.edges[startXSide].parentEdge.gap;
				setSpaceForElement(parentInfo.element, 'padding', startXSide, parentGap);
			}
		} else {
			const minSpace = parentInfo[minGapBetweenX];
			if (!info[left].siblingEdge) throw new Error("A non 0 index item should have a sibling");

			const spaceDiff = info[left].siblingEdge!.gap - minSpace;
			parentInfo.element.style.gap = `${minSpace}px`;
			setSpaceForElement(info[left].element, 'margin', left, spaceDiff);
		}
		if (isXCenter && parentInfo[widthType] !== 'content') {
			parentInfo.element.style.justifyContent = 'center';
			if (close(parentInfo[gapBetween]!, parentInfo[aroundSpace], 0.1)) {
				parentInfo.element.style.justifyContent = 'space-around';
				parentInfo.element.style.gap = '0px';
			} else if (close(parentInfo[gapBetween]!, parentInfo[evenlySpace], 0.1)) {
				parentInfo.element.style.justifyContent = 'space-evenly';
				parentInfo.element.style.gap = '0px';
			} else if (close(parentInfo[gapBetween]!, parentInfo[betweenSpace], 0.1)) {
				parentInfo.element.style.justifyContent = 'space-between';
				parentInfo.element.style.gap = '0px';
			}
		}
		if (!isXCenter && startXSide === left) {
			parentInfo.element.style.justifyContent = 'normal';
		}
		if (!isXCenter && startXSide === right && childrenWidthFixed) {
			parentInfo.element.style.justifyContent = 'flex-end';
		} 

		//right - width
		if (info[widthType] === 'fixed') {
			const toResize = selectDesignerElementReverse(info.element);
			toResize.style[width] = `${info[width]}px`;
		} 
		// else if (info[widthType] === 'expand') {
		// 	//If we are expanding the width, that means we have some sort of flex grow or something
		// 	//TODO: let's deal with that later
		// 	info.element.style[width] = `${info[width]}px`
		// 	info.element.style.flexGrow = 'inherit';
		// 	info.element.style.flexShrink = 'inherit';
		// }
	}

	//parent edges for sizing
	if (parentInfo[widthType] === 'content') {
		setSpaceForElement(parentInfo.element, 'padding', left, parentInfo.edges[left].parentEdge.gap);
		setSpaceForElement(parentInfo.element, 'padding', right, parentInfo.edges[right].parentEdge.gap);
	}

	if (parentInfo[heightType] === 'content') {
		setSpaceForElement(parentInfo.element, 'padding', top, parentInfo.edges[top].parentEdge.gap);
		setSpaceForElement(parentInfo.element, 'padding', bottom, parentInfo.edges[bottom].parentEdge.gap);
	}
}



interface StyleValue {
	name: string;
	value: string;
}
interface UpdateRectInfo {
	width: StyleValue;
	height: StyleValue;
	spacingTop: StyleValue;
	spacingBottom: StyleValue;
	spacingLeft: StyleValue;
	spacingRight: StyleValue;
	childrenGaps: StyleValue[]
}

function isElementFluid(elm: Element, side: 'width' | 'height', useFlexForHeight=true){
    var wrapper, clone = elm.cloneNode(true) as HTMLElement, ow, p1, p2;
    let value;
    if( window.getComputedStyle ) {
      value = window.getComputedStyle(clone,null)[side];
    }
    /// the browsers that fail to work as Firefox does
    /// return an empty width value, so here we fall back.
    if ( !value ) {
      /// remove styles that can get in the way
	  const padding = clone.style.padding;
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style[`max${capitalizeFirstLetter(side)}` as 'maxWidth'] = 'none';
      clone.style[`min${capitalizeFirstLetter(side)}` as 'minWidth'] = 'none';
      /// create a wrapper that we can control, my reason for
      /// using an unknown element is that it stands less chance
      /// of being affected by stylesheets - this could be improved
      /// to avoid possible erroneous results by overriding more css
      /// attributes with inline styles.
      wrapper = document.createElement('wrapper');
	  //Flex will make the height stretch
      wrapper.style.display = side === 'height' && useFlexForHeight ? 'flex' : 'block';
      wrapper.style[side] = '500px';
      wrapper.style.padding = '0';
      wrapper.style.margin = '0';
      wrapper.appendChild(clone);
      /// insert the element in the same location as our target
      elm.parentNode?.insertBefore(wrapper,elm);
      /// store the clone's calculated width
      ow = clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'];
      /// change the wrapper size once more
      wrapper.style[side] = '600px';
      /// if the new width is the same as before, most likely a fixed width
      if( clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'] == ow ){
		clone.style.padding = padding;
		if (clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'] != ow ) {
			elm.parentElement?.removeChild(wrapper);
			return true;
		}

        /// tidy up
        elm.parentNode?.removeChild(wrapper);
        return false;
      }
      /// otherwise, calculate the percentages each time - if they
      /// match then it's likely this is a fluid element
      else {
        p1 = Math.floor(100/500*ow);
        p2 = Math.floor(100/600*clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth']);
        /// tidy up
        elm.parentNode?.removeChild(wrapper);
        return (p1 == p2) ? Math.round(p1)+'%' : false;
      }
    }
    else {
      p1 = (value && String(value).indexOf('%') != -1);
      return p1 ? value : false;
    }
}

function getFitContentSize(element: HTMLElement, keepPadding=false): {width: number, height: number} {
	var wrapper, clone = element.cloneNode(true) as HTMLElement, ow, p1, p2;
	const padding = clone.style.padding;
	clone.style.margin = '0';
	if (!keepPadding)
		clone.style.padding = '0';
	clone.style.maxWidth = 'none';
	clone.style.minWidth = 'none';
	clone.style.maxHeight = 'none';
	clone.style.minHeight = 'none';
	clone.style.height = 'auto';
	clone.style.width = 'auto';
	/// create a wrapper that we can control, my reason for
	/// using an unknown element is that it stands less chance
	/// of being affected by stylesheets - this could be improved
	/// to avoid possible erroneous results by overriding more css
	/// attributes with inline styles.
	wrapper = document.createElement('wrapper');
	wrapper.style.display = 'flex';
	wrapper.style.alignItems = 'center';
	wrapper.style.width = `${element.clientWidth + 500}px`
	wrapper.style.height = `${element.clientHeight + 500}px`
	wrapper.style.padding = '0';
	wrapper.style.margin = '0';
	wrapper.appendChild(clone);
	/// insert the element in the same location as our target
	const container = document.getElementById("harmonyInspector"); 
	if (!container) throw new Error("cannot find container")
	container.appendChild(wrapper)

	const rect = getBoundingRect(clone);
	const width = rect.width;
	const height = rect.height;

	container.removeChild(wrapper);

	return {width, height};
}

interface GuidePoint {
    relativeTo: HTMLElement,
    value: number
}
interface GuidePosition {
    x: GuidePoint | number;
    y: GuidePoint | number;
}

interface AddGuide {
    start?: GuidePosition,
    end?: GuidePosition,
    length?: {
        value: number,
        axis: Axis
    },
    text?: number
}

interface AddNewSnapProps {
	point: number, 
	axis: Axis, 
	from?: RectSide, 
	snapSide?: RectSide, 
	range: number | undefined
}
function Snapping({parent, element, parentEdgeInfo, resultsX, resultsY}: {parent: HTMLElement, element: HTMLElement, parentEdgeInfo: ParentEdgeInfo, resultsX: SnappingResult[], resultsY: SnappingResult[]}) {
    const addSnapToParent = ({point, axis, from, snapSide, range}: AddNewSnapProps) => {
        function createGuide({start, end, length, text}: AddGuide) {
            const offset = parent.getBoundingClientRect();
            let x0 = 0;
            let x1 = 0;
            let y0 = 0;
            let y1 = 0;
            const relative: RelativePoint[] = [];
            const calculatePoints = (point: GuidePoint | number, axis: Axis) => {
                let p = 0;
                if (typeof point === 'number') {
                    p = point;
                } else {
                    const offsetRect = point.relativeTo.getBoundingClientRect();
                    const sizeIdent = axis === 'x' ? 'width' : 'height';
                    const sideIdent = axis === 'x' ? 'left' : 'top';
                    const width = offsetRect[sizeIdent] * point.value;
                    p = width + offsetRect[sideIdent] - offset[sideIdent];
                }

                return p;
            }

            const calculatePosition = (position: GuidePosition, direction: 1 | -1) => {
                let x0 = calculatePoints(position.x, 'x');
                let x1 = x0;
                let y0 = calculatePoints(position.y,'y');
                let y1 = y0;

                if (length) {
                    if (length.axis === 'x') {
                        x1 = x0 + length.value * direction;
                    } else {
                        y1 = y0 + length.value * direction;
                    }
                }

                return {fromX: x0, toX: x1, fromY: y0, toY: y1};
            }

            if (start) {
                const {fromX, toX, fromY, toY} = calculatePosition(start, 1);
                x0 = fromX;
                x1 = toX;
                y0 = fromY;
                y1 = toY;
            }

            if (end) {
                const {fromX, toX, fromY, toY} = calculatePosition(end, -1);
                if (!start) {
                    x1 = fromX;
                    x0 = toX;
                    y1 = fromY;
                    y0 = toY;
                } else {
                    x1 = fromX;
                    y1 = fromY;
                }
            }

            return ({
                point: {[axis]: point},
                offset: parent,
                guides: [{
                    x0,x1,y0,y1,relative,text,
                }]
            })
        }
        
        const results = axis === 'x' ? resultsX : resultsY;
        if (from && from !== 'left' && from !== 'top') {
            point = parentEdgeInfo.edges[from].parentEdge.edgeLocationRelative - point;
        }

        if (snapSide) {
            if (snapSide === 'right') {
                point = point - getBoundingClientRect(element, 'x', 'size', 1);
            } else if (snapSide === 'bottom') {
                point = point - getBoundingClientRect(element, 'y', 'size', 1);
            }
        }

        const newResult: SnappingResult = {
            snapGuides: [],
            range,
            [axis]: point
        }
        results.push(newResult);

		function addGuide(props: AddGuide) {
			const result = createGuide(props);
			newResult.snapGuides.push(result);
		}

        return {
            addGuide,
			addCenterAxisGuide({axis}: {axis: Axis}) {
				const otherAxis = axis === 'x' ? 'y' : 'x'
				addGuide({
					start: {
						[otherAxis as 'y']: {
							relativeTo: parent,
							value: 0.5
						},
						[axis as 'x']: {
							relativeTo: parent,
							value: 0
						}
					},
					end: {
						[otherAxis as 'y']: {
							relativeTo: parent,
							value: 0.5
						},
						[axis as 'x']: {
							relativeTo: parent,
							value: 1
						}
					},
				})
			}
            // addGuideFunction(func: () => AddGuide) {
            //     const callback = () => {
            //         const props = func();
            //         const result = createGuide(props);

            //         return result;
            //     }
            //     newResult.snapGuides.push(callback);
            // }
        }
    }

    return {addSnapToParent};
}

interface SnapBehavior {
	getOldValues: (element: HTMLElement) => [HTMLElement, Record<string, string>][];
	isDraggable: (element: HTMLElement) => string | undefined;
	onUpdate: (element: HTMLElement, event: DraggingEvent, scale: number, isResize: boolean) => void;
	onCalculateSnapping: (element: HTMLElement, posX: number, posY: number, dx: number, dy: number, scale: number, isResize: boolean) => {resultsX: SnappingResult[], resultsY: SnappingResult[]};
	onFinish: (element: HTMLElement) => HTMLElement;
    getRestrictions: (element: HTMLElement, scale: number) => RectBox[];
}

const elementSnapBehavior: SnapBehavior = {
	getOldValues(element) {
		const parent = element.parentElement!;
		const parentStyle = getComputedStyle(parent);
		const oldValues: [HTMLElement, Record<string, string>][] = [
			[parent,
			{
				paddingLeft: parentStyle.paddingLeft || '', 
				paddingRight: parentStyle.paddingRight || '', 
				paddingTop: parentStyle.paddingTop || '', 
				paddingBottom: parentStyle.paddingBottom || '', 
			}]
		];

		for (const child of Array.from(parent.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
				oldValues.push([child as HTMLElement, {
					paddingLeft: style.paddingLeft || '', 
					paddingRight: style.paddingRight || '', 
					paddingTop: style.paddingTop || '', 
					paddingBottom: style.paddingBottom || '', 
					marginLeft: style.marginLeft || '', 
					marginRight: style.marginRight || '', 
					marginTop: style.marginTop || '', 
					marginBottom: style.marginBottom || '', 
					height: style.height || '',
					width: style.width || ''
				}])
			}
		}

		for (const child of Array.from(element.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
				oldValues.push([child as HTMLElement, {
					paddingLeft: style.paddingLeft || '', 
					paddingRight: style.paddingRight || '', 
					paddingTop: style.paddingTop || '', 
					paddingBottom: style.paddingBottom || '', 
					marginLeft: style.marginLeft || '', 
					marginRight: style.marginRight || '', 
					marginTop: style.marginTop || '', 
					marginBottom: style.marginBottom || '', 
					height: style.height || '',
					width: style.width || ''
				}])
			}
		}

		return oldValues;
	},
	isDraggable(element) {
		const style = element ? getComputedStyle(element.parentElement!) : undefined;
		return ['block', 'list-item'].includes(style?.display || '') ? undefined : 'This is not a block element';
	},
	onUpdate(element, event, scale) {
        if (!element.parentElement) {
            throw new Error("Element does not have a parent");
        }
		const parent = element.parentElement;

        const childrenUpdates: UpdateRect[] = [{
            element,
            rect: event.eventRect
        }];
		updateRects({
            parentUpdate: {
                element: parent,
                rect: getBoundingRect(parent)
            },
            childrenUpdates
        }, scale, scale);
	},
	onCalculateSnapping(element, poxX, posY, dx, dy, scale) {
        const parent = element.parentElement!;
        const parentEdgeInfo = calculateParentEdgeInfo(parent, 1, scale, false, 'x');
        const parentEdgeInfoScaled = calculateParentEdgeInfo(parent, scale, scale, false, 'x');
        const resultsX: SnappingResult[] = [];
        const resultsY: SnappingResult[] = [];
        const myChildInfo = parentEdgeInfo.childEdgeInfo.find(info => info.element === element);
        if (!myChildInfo) {
            throw new Error("Cannot find my child info");
        }

        const range = 10;

        const snapping = Snapping({parent, element, parentEdgeInfo, resultsX, resultsY});

        const addSnapsForParentEdges = () => {
            const currParentEdges = Object.entries(parentEdgeInfo.edges).filter(([_, edge]) => edge.element === element);
            const addSnapForEdges = (side: RectSide, otherSide: RectSide) => {
                const addGuideForSide = (side: RectSide) => {
                    const axis = side === 'left' || side === 'right' ? 'x' : 'y';
                    const oppositeAxis = axis === 'x' ? 'y' : 'x';
                    if (side === 'left' || side === 'top') {
                        result.addGuide({
                            start: {
                                [axis as 'x']: {
                                    value: 0,
                                    relativeTo: parent
                                },
                                [oppositeAxis as 'y']: {
                                    relativeTo: parent,
                                    value: 0.5
                                }
                            },
                            length: {
                                value: point,
                                axis
                            },
                            text: parentEdgeInfoScaled.edges[otherSide].parentEdge.gap
                        });
                    } else {
                        result.addGuide({
                            end: {
                                [axis as 'x']: {
                                    value: 1,
                                    relativeTo: parent
                                },
                                [oppositeAxis as 'y']: {
                                    relativeTo: parent,
                                    value: 0.5
                                }
                            },
                            length: {
                                value: point,
                                axis
                            },
                            text: parentEdgeInfoScaled.edges[otherSide].parentEdge.gap
                        });
                    }
                }
                const axis = side === 'left' || side === 'right' ? 'x' : 'y';
                
                const point = parentEdgeInfo.edges[otherSide].parentEdge.gap;
                const result = snapping.addSnapToParent({point, axis, from: side, snapSide: side, range});
                addGuideForSide(side);
                addGuideForSide(otherSide);
            }
            const edges = currParentEdges.map(p => p[0]) as RectSide[]
            for (const side of edges) {
                ['left', 'right', 'top', 'bottom'].forEach(otherSide => {
                    if (side === otherSide || edges.includes(otherSide as RectSide)) return;
                    addSnapForEdges(side, otherSide as RectSide);
                })
            }
        }

    	addSnapsForParentEdges();

		const centerX = snapping.addSnapToParent({
			point: myChildInfo.left.parentMidpointRelative,
			axis: 'x',
			range: 10,
		});
		centerX.addCenterAxisGuide({
			axis: 'y'
		});

		const centerY = snapping.addSnapToParent({
			point: myChildInfo.top.parentMidpointRelative,
			axis: 'y',
			range: 10,
		});
		centerY.addCenterAxisGuide({
			axis: 'x'
		});
        for (const childInfo of parentEdgeInfo.childEdgeInfo) {
            if (childInfo.element === element) continue;

            const loc = childInfo.left.elementLocationRelative;
            const others = parentEdgeInfo.childEdgeInfo.filter(info => info.left.elementLocationRelative === loc);
            const result = snapping.addSnapToParent({
                point: loc,
                axis: 'x',
				range
            });
            result.addGuide({
                start: {
                    x: {
                        value: 0,
                        relativeTo: others[0].element
                    },
                    y: {
                        value: 0,
                        relativeTo: others[0].element
                    }
                },
                end: {
                    x: {
                        value: 0,
                        relativeTo: others[others.length - 1].element
                    },
                    y: {
                        value: 1,
                        relativeTo: others[others.length - 1].element
                    }
                },
            });
        }

        return {resultsX, resultsY};
	},
	onFinish(element) {
		return element;
	},
    getRestrictions(element, scale) {
		const edgeInfo = calculateEdgesInfo(element, 1, scale, 'x');
        
        const top = edgeInfo.top.siblingEdge ? edgeInfo.top.siblingEdge.edgeLocation + getNonWorkableGap(edgeInfo.top.siblingEdge.gapTypes) : edgeInfo.top.parentEdge.edgeLocation + getNonWorkableGap(edgeInfo.top.parentEdge.gapTypes);
        const bottom = edgeInfo.bottom.siblingEdge ? edgeInfo.bottom.siblingEdge.edgeLocation - getNonWorkableGap(edgeInfo.bottom.siblingEdge.gapTypes) : edgeInfo.bottom.parentEdge.edgeLocation - getNonWorkableGap(edgeInfo.bottom.parentEdge.gapTypes);
        const left = edgeInfo.left.parentEdge.edgeLocation //+ getNonWorkableGap(edgeInfo.left.parentEdge.gapTypes)//edgeInfo.left.siblingEdge ? edgeInfo.left.siblingEdge.edgeLocation : edgeInfo.left.parentEdge.edgeLocation;
        const right = edgeInfo.right.parentEdge.edgeLocation //- getNonWorkableGap(edgeInfo.right.parentEdge.gapTypes);//edgeInfo.right.siblingEdge ? edgeInfo.right.siblingEdge.edgeLocation : edgeInfo.right.parentEdge.edgeLocation;

        return [{
            top,
            bottom,
            left,
            right
        }];
    },
}

const flexSnapping: SnapBehavior = {
	getOldValues(element) {
		const parent = element.parentElement!;
		const parentStyle = getComputedStyle(parent);
		const oldValues: [HTMLElement, Record<string, string>][] = [
			[parent,
			{
				paddingLeft: parentStyle.paddingLeft || '', 
				paddingRight: parentStyle.paddingRight || '', 
				paddingTop: parentStyle.paddingTop || '', 
				paddingBottom: parentStyle.paddingBottom || '', 
				justifyContent: parentStyle.justifyContent || '', 
				alignItems: parentStyle.alignItems || '',
				gap: parentStyle.gap || '',
			}]
		];

		for (const child of Array.from(parent.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
				oldValues.push([child as HTMLElement, {
					paddingLeft: style.paddingLeft || '', 
					paddingRight: style.paddingRight || '', 
					paddingTop: style.paddingTop || '', 
					paddingBottom: style.paddingBottom || '', 
					marginLeft: style.marginLeft || '', 
					marginRight: style.marginRight || '', 
					marginTop: style.marginTop || '', 
					marginBottom: style.marginBottom || '', 
					height: style.height || '',
					width: style.width || ''
				}]);
			}
		}

		for (const child of Array.from(element.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
				oldValues.push([child as HTMLElement, {
					paddingLeft: style.paddingLeft || '', 
					paddingRight: style.paddingRight || '', 
					paddingTop: style.paddingTop || '', 
					paddingBottom: style.paddingBottom || '', 
					marginLeft: style.marginLeft || '', 
					marginRight: style.marginRight || '', 
					marginTop: style.marginTop || '', 
					marginBottom: style.marginBottom || '', 
					height: style.height || '',
					width: style.width || ''
				}])
			}
		}

		return oldValues;
	},
	isDraggable(element) {
		const parentStyle = getComputedStyle(element.parentElement!);
		if (parentStyle?.display.includes('flex')) {
			if (parentStyle.flexWrap === 'wrap') {
				return 'Harmony does not currently support flex-wrap';
			}

			return undefined;
		}
		return 'This is not a flex component'
	},
	onUpdate(element, event, scale, isResize) {
		const parent = element.parentElement!;
		const updates: UpdateRect[] = [];
		const style = getComputedStyle(parent);
		const axis = style.flexDirection !== 'column' ? 'x' : 'y';
		const left = axis === 'x' ? 'left' : 'top';
		const right = axis === 'x' ? 'right' : 'bottom';
		const top = axis === 'x' ? 'top' : 'left';
		const bottom = axis === 'x' ? 'bottom' : 'right'; 
		const otherAxis = axis === 'x' ? 'y' : 'x';
		const currParentInfo = calculateParentEdgeInfo(parent, scale, scale, false, 'x');
		const selfIndex = currParentInfo.childEdgeInfo.find(info => info.element === element)!.index;
		const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY';
		const minGap = round(getMinGap(parent), 1);

		const addRect = (element: HTMLElement, rect: Rect) => {
			updates.push({element, rect})
		}
		addRect(element, event.eventRect)
	
	
		const addDs = (element: HTMLElement, ds: number) => {
			const rect = element.getBoundingClientRect();
	
			addRect(element, {
				left: rect.left + (axis === 'x' ? ds : 0),
				right: rect.right + (axis === 'x' ? ds : 0),
				top: rect.top + (axis === 'y' ? ds : 0),
				bottom: rect.bottom + (axis === 'y' ? ds : 0),
				height: rect.height,
				width: rect.width
			});
		}
	
		const addChildRects = (exclude: Element[], ds: number) => {
			if (isResize) return;
			for (const child of currParentInfo.children) {
				if (exclude.includes(child)) continue;
	
				addDs(child as HTMLElement, ds);
			}
		}
	
		const calculateMovePositions = () => {
			//TODO: This is super hacky and confusing, refactor into a better system that makes more sense
			//Creating the expanding/moving train
			let ds = (axis === 'x' ? event.dx : event.dy);
			if (currParentInfo.children.length > 1) {
				if (false && (selfIndex === 0 || selfIndex === currParentInfo.children.length - 1)) {
					ds = selfIndex === 0 ? ds : -ds;
					for (let start = 0, end = currParentInfo.children.length - 1; start < end; start++, end--) {
						const first = currParentInfo.children[start] as HTMLElement;
						const last = currParentInfo.children[end] as HTMLElement;
	
						first !== element && addDs(first, ds);
						last !== element && addDs(last, -ds);
						ds /= 3;
					}
				} else if (selfIndex === 0) {
					if (currParentInfo[minGapBetweenX] > minGap || ds < 0) {
						const last = currParentInfo.children[currParentInfo.children.length - 1] as HTMLElement;
						if (currParentInfo.edges[right].parentEdge.gap === 0 && ds < 0) {
							// if (currParentInfo.edges.left.parentEdge.gap <= 0) {
							// 	return;
							// }
							addChildRects([element, last], ds / (currParentInfo.children.length - 1))
						} else {
							addDs(last, -ds);
						}
					} else {
						// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
						// 	return;
						// }
						addChildRects([element], ds)
					}
				} else if (selfIndex === currParentInfo.children.length - 1) {
					if (currParentInfo[minGapBetweenX] > minGap || ds > 0) {
						const first = currParentInfo.children[0] as HTMLElement;
						if (currParentInfo.edges[left].parentEdge.gap === 0 && ds > 0) {
							// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
							// 	return;
							// }
							addChildRects([element, first], ds / (currParentInfo.children.length - 1))
						} else {
							addDs(first, -ds);
						}
					} else {
						// if (currParentInfo.edges.left.parentEdge.gap <= 0) {
						// 	return;
						// }
						addChildRects([element], ds)
					}
				} else {
					if (currParentInfo.edges[left].parentEdge.gap <= 0 && currParentInfo.edges[right].parentEdge.gap <= 0) {
						
					} else {
						addChildRects([element], ds)
					}
				}
			}
		}
	
		if (!isResize) {
			calculateMovePositions();
		}

		updateRectFlex({
			parentUpdate: {
				element: parent,
				rect: parent.getBoundingClientRect()
			},
			childrenUpdates: updates
		}, scale, scale)
	},
	onCalculateSnapping(element, posX, posY, dx, dy, scale) {
		const parent = element.parentElement!;
		const style = getComputedStyle(parent);
		const axis = style.flexDirection !== 'column' ? 'x' : 'y';
		const otherAxis = axis === 'x' ? 'y' : 'x';
		const pos = axis === 'x' ? posX : posY;
		const ds = axis === 'x' ? dx : dy;
		
		const parentInfo = calculateFlexParentEdgeInfo(parent, 1, scale, false, 'x');
		const selfIndex = parentInfo.childEdgeInfo.find(info => info.element === element)!.index;
		const minGap = getMinGap(parent);
		
		
		
		const direction = selfIndex === 0 ? -1/(parentInfo.childrenCount % 2 !== 0 ? 1 : parentInfo.childrenCount) : 1/(parentInfo.childrenCount % 2 !== 0 ? 1 : parentInfo.childrenCount);
		const resultsX: SnappingResult[] = [];
		const resultsY: SnappingResult[] = [];
		
		const snapping = Snapping({parent, element, parentEdgeInfo: parentInfo, resultsX, resultsY});

		const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY';
		const gapBetween = axis === 'x' ? 'gapBetweenX' : 'gapBetweenY';
		const evenlySpace = axis === 'x' ? 'evenlySpaceX' : 'evenlySpaceY';
		const aroundSpace = axis === 'x' ? 'aroundSpaceX' : 'aroundSpaceY';
		const betweenSpace = axis === 'x' ? 'betweenSpaceX' : 'betweenSpaceY';
		const left = axis === 'x' ? 'left' : 'top';
		const right = axis === 'x' ? 'right' : 'bottom';
		const top = axis === 'x' ? 'top' : 'left';
		const bottom = axis === 'x' ? 'bottom' : 'right'; 
		const midpoint = axis === 'x' ? 'midpointX' : 'midpointY';
		const childrenMidpoint = axis === 'x' ? 'childrenMidpointX' : 'childrenMidpointY';

		const lastGap = parent.dataset.lastGap ? parseFloat(parent.dataset.lastGap) : parentInfo[minGapBetweenX];
		const gapDiff = parentInfo[minGapBetweenX] - lastGap;
		
		const isMoving = selfIndex > 0 && selfIndex < parentInfo.childrenCount - 1 || close(gapDiff, 0, 0.1)//(selfIndex === 0 && close(minGap, parentInfo[minGapBetweenX], 0.1) && ds > 0) || (selfIndex === parentInfo.childrenCount - 1 && close(minGap, parentInfo[minGapBetweenX], 0.1) && ds < 0);
		const centerY = snapping.addSnapToParent({
			point: parentInfo.childEdgeInfo[selfIndex][top].parentMidpointRelative,
			axis: otherAxis,
			range: 10
		});
		centerY.addCenterAxisGuide({axis});

		const startY = snapping.addSnapToParent({
			point: parentInfo.edges[top].parentEdge.edgeLocationRelative,
			axis: otherAxis,
			range: 10
		})
		const endY = snapping.addSnapToParent({
			point: parentInfo.edges[bottom].parentEdge.edgeLocationRelative,
			axis: otherAxis,
			range: 10,
			snapSide: bottom
		})

		const enoughSpace = parentInfo.edges[left].parentEdge.gap >= 20 && parentInfo.edges[right].parentEdge.gap >= 20
		
		if (isMoving) {
			// if (parentInfo.edges.left.parentEdge.gap > 0) {
			// 	const start = snapping.addSnapToParent({
			// 		point: posX - parentInfo.edges.left.parentEdge.gap,
			// 		axis: 'x',
			// 		range: 10
			// 	});
			// }
			// if (parentInfo.edges.right.parentEdge.gap > 0) {
			// 	const end = snapping.addSnapToParent({
			// 		point: posX + parentInfo.edges.right.parentEdge.gap,
			// 		axis: 'x',
			// 		range: 10,
			// 		snapSide: 'left',
			// 	})
			// }
			if (enoughSpace) {
				const centerXDiff = parentInfo[midpoint] - parentInfo[childrenMidpoint];
				const center = snapping.addSnapToParent({
					point: pos + centerXDiff,
					axis,
					range: 10
				});
				center.addCenterAxisGuide({axis: otherAxis})
			}
		} else {
			// let diff = selfIndex === 0 ? 0 : gapDiff;
			// if (dx <= 0) {
			// 	const start = snapping.addSnapToParent({
			// 		point: posX - (parentInfo.edges.left.parentEdge.gap + diff),
			// 		axis: 'x',
			// 		range: 10
			// 	});
			// }

			// diff = diff === 0 ? gapDiff : 0;
			// if (dx >= 0) {
			// 	const end = snapping.addSnapToParent({
			// 		point: posX + (parentInfo.edges.right.parentEdge.gap + diff),
			// 		axis: 'x',
			// 		range: 10
			// 	});
			// }

			if ((selfIndex === 0 && ds >= 0) || (selfIndex === parentInfo.childrenCount - 1 && ds <= 0)) {
				const minGapDiff = parentInfo[minGapBetweenX] - minGap;
				const minGapPoint = snapping.addSnapToParent({
					point: pos - (minGapDiff * direction),
					axis,
					range: 10
				});

			} else {
				//console.log(pos);
			}
		
			const minSpaceBetweenSnaps = Math.min(parentInfo[aroundSpace] - parentInfo[evenlySpace], parentInfo[betweenSpace] - parentInfo[aroundSpace]);
			if (parentInfo[gapBetween] && close(parentInfo[childrenMidpoint], parentInfo[midpoint], 0.5) && minSpaceBetweenSnaps >= 5 && enoughSpace) {

				const spaceEvenlyDiff = parentInfo[evenlySpace] - parentInfo[gapBetween]!;
				console.log(pos + (spaceEvenlyDiff * direction))
				const spaceEvenly = snapping.addSnapToParent({
					point: pos + (spaceEvenlyDiff * direction),
					axis,
					range: 10
				});
				spaceEvenly.addGuide({
					start: {
						[axis as 'x']: {
							relativeTo: parent,
							value: 0
						},
						[otherAxis as 'y']: {
							relativeTo: parentInfo.childEdgeInfo[0].element,
							value: 0.5
						}
					},
					length: {
						axis,
						value: parentInfo[evenlySpace]
					},
					text: parentInfo[evenlySpace]
				});
				spaceEvenly.addGuide({
					end: {
						[axis as 'x']: {
							relativeTo: parent,
							value: 1
						},
						[otherAxis as 'y']: {
							relativeTo: parentInfo.childEdgeInfo[0].element,
							value: 0.5
						}
					},
					length: {
						axis,
						value: parentInfo[evenlySpace]
					},
					text: parentInfo[evenlySpace]
				});
				for (let i = 0; i < parentInfo.children.length - 1; i++) {
					spaceEvenly.addGuide({
						start: {
							[axis as 'x']: {
								relativeTo: parentInfo.childEdgeInfo[i].element,
								value: 1
							},
							[otherAxis as 'y']: {
								relativeTo: parentInfo.childEdgeInfo[0].element,
								value: 0.5
							}
						},
						length: {
							axis,
							value: parentInfo[evenlySpace]
						},
						text: parentInfo[evenlySpace]
					})
				}

				const spaceAroundDiff = parentInfo[aroundSpace] - parentInfo[gapBetween]!;
				const spaceAround = snapping.addSnapToParent({
					point: pos + spaceAroundDiff * direction,
					axis,
					range: 10
				});
				spaceAround.addGuide({
					start: {
						[axis as 'x']: {
							relativeTo: parent,
							value: 0
						},
						[otherAxis as 'y']: {
							relativeTo: parentInfo.childEdgeInfo[0].element,
							value: 0.5
						}
					},
					length: {
						axis,
						value: parentInfo[aroundSpace] / 2
					},
					text: parentInfo[aroundSpace] / 2
				});
				spaceAround.addGuide({
					end: {
						[axis as 'x']: {
							relativeTo: parent,
							value: 1
						},
						[otherAxis as 'y']: {
							relativeTo: parentInfo.childEdgeInfo[0].element,
							value: 0.5
						}
					},
					length: {
						axis,
						value: parentInfo[aroundSpace] / 2
					},
					text: parentInfo[aroundSpace] / 2
				});
				for (let i = 0; i < parentInfo.children.length - 1; i++) {
					spaceAround.addGuide({
						start: {
							[axis as 'x']: {
								relativeTo: parentInfo.childEdgeInfo[i].element,
								value: 1
							},
							[otherAxis as 'y']: {
								relativeTo: parentInfo.childEdgeInfo[0].element,
								value: 0.5
							}
						},
						length: {
							axis,
							value: parentInfo[aroundSpace]
						},
						text: parentInfo[aroundSpace]
					})
				}

				const spaceBetweenDiff = parentInfo[betweenSpace] - parentInfo[gapBetween]!;
				const spaceBetween = snapping.addSnapToParent({
					point: pos + spaceBetweenDiff * direction,
					axis,
					range: 10
				})
				for (let i = 0; i < parentInfo.children.length - 1; i++) {
					spaceBetween.addGuide({
						start: {
							[axis as 'x']: {
								relativeTo: parentInfo.childEdgeInfo[i].element,
								value: 1
							},
							[otherAxis as 'y']: {
								relativeTo: parentInfo.childEdgeInfo[0].element,
								value: 0.5
							}
						},
						length: {
							axis,
							value: parentInfo[betweenSpace]
						},
						text: parentInfo[betweenSpace]
					})
				}
			}
		}
		//console.log(`dx: ${dx}`);
		return {resultsX, resultsY}
	},
	onFinish(element) {
		return element.parentElement!;
	},
    getRestrictions(element, scale) {
		const parent = element.parentElement!;
		const style = getComputedStyle(parent);
		const axis = style.flexDirection !== 'column' ? 'x' : 'y';
		const left = axis === 'x' ? 'left' : 'top';
		const right = axis === 'x' ? 'right' : 'bottom';
		const top = axis === 'x' ? 'top' : 'left';
		const bottom = axis === 'x' ? 'bottom' : 'right'; 
		const minGapBetween = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY';
		const minGap = getMinGap(parent);

		
		const parentInfo = calculateParentEdgeInfo(parent, 1, scale, false, 'x');
		const myChildInfo = parentInfo.childEdgeInfo.find(info => info.element === element);
		if (!myChildInfo) {
			throw new Error("Cannot find child info");
		}
		const selfIndex = myChildInfo.index;
		const parentRect = {
			left: parentInfo.edges.left.parentEdge.edgeLocation,
			right: parentInfo.edges.right.parentEdge.edgeLocation,
			top: parentInfo.edges.top.parentEdge.edgeLocation,
			bottom: parentInfo.edges.bottom.parentEdge.edgeLocation,
		}
		
		if (selfIndex > 0 && selfIndex < parentInfo.children.length - 1) {
			if (parentInfo.edges[right].parentEdge.gap > 0)
			parentRect[left] = parentInfo.childEdgeInfo[selfIndex][left].elementLocation - parentInfo.edges[left].parentEdge.gap;
			
			if (parentInfo.edges[left].parentEdge.gap > 0)
			parentRect[right] = parentInfo.childEdgeInfo[selfIndex][right].elementLocation + parentInfo.edges[right].parentEdge.gap;
		}
		
		if (selfIndex === 0 && parentInfo.childEdgeInfo.length > 1) {
			// if (parentInfo.edges[right].parentEdge.gap < parentInfo.edges[left].parentEdge.gap) {
			// 	parentRect[left] += parentInfo.edges[left].parentEdge.gap - parentInfo.edges[right].parentEdge.gap;
			// }

			parentRect[right] = parentInfo.childEdgeInfo[selfIndex][right].elementLocation + (parentInfo[minGapBetween] - minGap) * (parentInfo.children.length - 1) + parentInfo.edges[right].parentEdge.gap;
		}

		if (selfIndex === parentInfo.children.length - 1 && parentInfo.childEdgeInfo.length > 1) {
			// if (parentInfo.edges[left].parentEdge.gap < parentInfo.edges[right].parentEdge.gap) {
			// 	parentRect[right] -= parentInfo.edges[right].parentEdge.gap - parentInfo.edges[left].parentEdge.gap;
			// }

			parentRect[left] = parentInfo.childEdgeInfo[selfIndex][left].elementLocation - (parentInfo[minGapBetween] - minGap) * (parentInfo.children.length - 1) - parentInfo.edges[left].parentEdge.gap;
		}

		return [parentRect];
    }
}

const getSnappingBehavior = (parent: HTMLElement | undefined) => {
	let snappingBehavior = elementSnapBehavior;
	if (parent && getComputedStyle(parent).display.includes('flex')) {
		snappingBehavior = flexSnapping;
	}

	return snappingBehavior;
}

type SnappableProps = Pick<DraggableProps, 'element' | 'onIsDragging' | 'scale'> & {
	onDragFinish: (element: HTMLElement, oldValues: [HTMLElement, Record<string, string>][]) => void;
	onError: (error: string | undefined) => void;
};
export const useSnapping = ({element, onIsDragging, onDragFinish, onError, scale}: SnappableProps) => {
	const [oldValues, setOldValues] = useState<[HTMLElement, Record<string, string>][]>([]);
	const resX = useRef(0);
	const resY = useRef(0);
	const elementsRef = useRef<HTMLElement[]>([]);

	const snappingBehavior = useMemo(() => getSnappingBehavior(element?.parentElement || undefined), [element]);

	//TODO: Super hacky fix to fix the space that exists between inline elements
	useEffect(() => {
		const hackyInlineSpaceFix = (parent: HTMLElement) => {
			const recurse = (element: HTMLElement) => {
				for (const child of Array.from(element.childNodes)) {
					if (child.nodeType === Node.TEXT_NODE) {
						const style = getComputedStyle(element);
						element.style.fontSize = style.fontSize;
					} else {
						recurse(child as HTMLElement);
					}
				}
			}
			if (parent.children.length > 0) {
				recurse(parent);

				parent.style.fontSize = '0px';
			}
		}

		if (element) {
			const parent = element.parentElement!;
			// hackyInlineSpaceFix(element);
			// hackyInlineSpaceFix(parent as HTMLElement);
			
		}
	}, [element])

    const restrictions = element ? snappingBehavior.getRestrictions(element, scale) : [];

    function normalizeSnappingResults({x, y, resultsX, resultsY}: {x: number, y: number, resultsX: SnappingResult[], resultsY: SnappingResult[]}) {
        const parent = element!.parentElement!;
        let result: SnappingResult | undefined;

		
		const resX = resultsX.reduce<SnappingResult[]>((prev, curr) => {
            const same = prev.find(p => p.x === curr.x);
            if (same) {
                same.snapGuides.push(...curr.snapGuides);
            } else {
                prev.push(curr);
            }

            return prev;
        }, []).filter(res => Math.abs(res.x! - x) < 10).sort((a, b) => a.x! - b.x!)[0];

		
		const resY = resultsY.reduce<SnappingResult[]>((prev, curr) => {
            const same = prev.find(p => p.y === curr.y);
            if (same) {
                same.snapGuides.push(...curr.snapGuides);
            } else {
                prev.push(curr);
            }

            return prev;
        }, []).filter(res => Math.abs(res.y! - y) < 10).sort((a, b) => a.y! - b.y!)[0];
        if (resX) {
			result = {snapGuides: []};
            //Our edge calculations are relative to no border, but interact.js is relative to a border, so get rid of
            //the border in the snap calculation
			result.x = resX.x!// + parseFloat($(parent).css('borderLeft') || '0');
			result.range = resX.range;
            result.snapGuides.push(...resX.snapGuides.map(guide => ({...guide, point: {
				x: guide.point.x! + (getBoundingClientRect(element!.parentElement!, 'x', 'close', 1) as number) + parseFloat($(parent).css('borderLeft') || '0'),
				y: 0
			}})));
		}

		if (resY) {
			result = result || {snapGuides: []};
			result.y = resY.y! + parseFloat($(parent).css('borderTop') || '0');
			result.range = resY.range;
            result.snapGuides.push(...resY.snapGuides.map(guide => ({...guide, point: {
				y: guide.point.y! + (getBoundingClientRect(element!.parentElement!, 'y', 'close', 1) as number) + parseFloat($(parent).css('borderTop') || '0'),
				x: 0
			}})));
		}

        return result;
    }

	useEffect(() => {
		for (const element of elementsRef.current) {
			interact(element).unset();
		}

		if (element) {
			const values = snappingBehavior.getOldValues(element);
			setOldValues(values);

			if (!elementsRef.current.includes(element)) {
				elementsRef.current.push(element);
			}
		}
	}, [element, elementsRef]);

	const result = useDraggable({element, onIsDragging(event) {
		if (!element) return;

		resX.current = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(element!.parentElement!, 'x', 'close', 1);
		const newY = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(element!.parentElement!, 'y', 'close', 1);
		const s = event.eventRect.top - getBoundingClientRect(element!.parentElement!, 'y', 'close', 1);
		resY.current = newY;

		//TODO: Get rid of this gap dependency
		element.parentElement!.dataset.lastGap = `${parseFloat(element.parentElement!.style.gap || '0')}`;
		snappingBehavior.onUpdate(element, event, scale, false);
		
		onIsDragging && onIsDragging(event, element);
		
	}, onCalculateSnapping(element, x, y, currentX, currentY) {
		const parent = element.parentElement!;
		const posX = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(parent, 'x', 'close', 1);
		const posY = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(parent, 'y', 'close', 1);
		const dx = posX  - resX.current//posX + getBoundingClientRect(parent, 'x', 'close', 1) - currentX;
		const dy = posY - resY.current///posY + getBoundingClientRect(parent, 'y', 'close', 1) - currentX;

		const result = snappingBehavior.onCalculateSnapping(element, posX, posY, dx, dy, scale, false)

		const res = normalizeSnappingResults({...result, x, y});
		
		return res;
	}, onDragFinish(element) {
		resX.current = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(element!.parentElement!, 'x', 'close', 1);
		resY.current = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(element!.parentElement!, 'y', 'close', 1);
		onDragFinish && onDragFinish(snappingBehavior.onFinish(element), oldValues);
		setOldValues(snappingBehavior.getOldValues(element));
	}, canDrag(element) {
		if (element.contentEditable === 'true') return false;

		const error = snappingBehavior.isDraggable(element)
		if (error) {
			onError(error);
			return false;
		}

		if (!element.parentElement?.dataset.harmonyId) {
			onError('Do not have access to parent component\'s code');
			return false;
		}

		return true;
	}, restrictions, restrictToParent: true, scale});

	const {isResizing} = useResizable({element, scale, restrictions, onIsResizing(event) {
        if (!element) return;

		const parent = element.parentElement as HTMLElement;

		//TODO: Super hacky. 
		//This just checks to see if we have selected a 'designer element' (one where there is a thin wrapper over an element).
		//Normal we select the outmost component, but we want to apply resizing to the inner most component
		const toResize = selectDesignerElementReverse(element);

		const childrenUpdates = Array.from(toResize.children).map<UpdateRect>(child => ({element: child as HTMLElement, rect: getBoundingRect(child as HTMLElement)}));

		const elementSnap = getSnappingBehavior(parent);
		if (elementSnap === flexSnapping) {
			updateRectFlex({
				parentUpdate: {
					element: parent,
					rect: getBoundingRect(parent)
				},
				childrenUpdates: [{
					element,
					rect: event.eventRect,
					//proxyElement: toResize
				}]
			}, scale, scale)
		} else {
			updateRects({
				parentUpdate: {
					element: parent,
					rect: getBoundingRect(parent)
				},
				childrenUpdates: [{
					element,
					rect: event.eventRect,
					//proxyElement: toResize
				}]
			}, scale, scale)
		}

        //snappingBehavior.onUpdate(element, event, scale, true);
		//Update for all the children too
		//TODO: Make this polymorphic
		if (Array.from(toResize.children).filter(child => isSelectable(child as HTMLElement, scale)).length > 0) {
			const childrenSnap = getSnappingBehavior(toResize)
			if (childrenSnap === flexSnapping) {
				updateRectFlex({
					parentUpdate: {
						element: toResize,
						rect: event.eventRect,
					},
					childrenUpdates
				}, scale, scale);
			} else {
				updateRects({
					parentUpdate: {
						element: toResize,
						rect: event.eventRect,
					},
					childrenUpdates
				}, scale, scale)
			}
		}

		// if (isDesignerSelected) {
		// 	toResize = element.children[0] as HTMLElement;
		// 	const newStuff = {
		// 		Bottom: event.deltaRect.bottom,
		// 		Top: -event.deltaRect.top,
		// 		Left: -event.deltaRect.left,
		// 		Right: event.deltaRect.right,
		// 	};

		// 	if (isElementFluid(toResize, 'height')) {
		// 		(['Bottom', 'Top'] as const).forEach(d => {
		// 			const old = parseFloat($(toResize).css(`padding${d}`));
		// 			const _new = newStuff[d];
		// 			toResize.style[`padding${d}`] = `${old + _new}px`;
		// 		})
		// 	}

		// 	if (isElementFluid(toResize, 'width')) {
		// 		(['Left', 'Right'] as const).forEach(d => {
		// 			const old = parseFloat($(toResize).css(`padding${d}`));
		// 			const _new = newStuff[d];
		// 			toResize.style[`padding${d}`] = `${old + _new}px`;
		// 		})
		// 	}

		// 	element.style.padding = '0px';
		// } 

		// if (!isElementFluid(toResize, 'width')) {
		// 	toResize.style.width = `${event.eventRect.width}px`
		// }
		// if (!isElementFluid(toResize, 'height')) {
		// 	toResize.style.height = `${event.eventRect.height}px`
		// }

		onIsDragging && onIsDragging(event, element);
    }, onCalculateSnapping(element, x, y, currentX, currentY) {
		return;
		const parent = element.parentElement!;
		const posX = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(parent, 'x', 'close', 1);
		const posY = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(parent, 'y', 'close', 1);
		const dx = posX  - resX.current//posX + getBoundingClientRect(parent, 'x', 'close', 1) - currentX;
		const dy = posY - resY.current///posY + getBoundingClientRect(parent, 'y', 'close', 1) - currentX;
        const result = elementSnapBehavior.onCalculateSnapping(element, posX,posY, dx, dy, scale, true);

        return normalizeSnappingResults({...result, x, y});

        // return res;
    }, canResize(element) {
		if (element.contentEditable === 'true') return false;

		const error = snappingBehavior.isDraggable(element)
		if (error) {
			onError(error);
			return false;
		}

		if (!element.parentElement?.dataset.harmonyId) {
			onError('Do not have access to parent component\'s code');
			return false;
		}

		return true;
	}, onResizeFinish(element) {
		onDragFinish && onDragFinish(snappingBehavior.onFinish(element), oldValues);
		setOldValues(snappingBehavior.getOldValues(element));
	}});

	return {isDragging: result.isDragging || isResizing, isResizing};
}

const handleGuides = (rect: RectBox, snapPoints: SnapPoint[], scale: number) => {
    const $parent = $('#harmony-snap-guides');
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
        const rect = element.getBoundingClientRect();
        return {
            x: element.offsetLeft * scale,
            y: element.offsetTop * scale,
            w: element.clientWidth * scale,
            h: element.clientHeight * scale,
        }
    }

    snapPoints.forEach(snapPoint => {
        const {point, guides} = snapPoint;
        const offsetParent = snapPoint.offset ? setOffset(snapPoint.offset) : undefined;

        const posY = rect.top;
        const top = point.y as number;
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

                copy.x0 /= scale;
                copy.y0 /= scale;
                copy.y1 /= scale;
                copy.x1 /= scale;

                createGuide(copy);
            });
        }

        const posX = rect.left;
        const left = point.x as number;
        if (close(left, posX, 0.1)) {
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

                copy.x0 /= scale;
                copy.y0 /= scale;
                copy.y1 /= scale;
                copy.x1 /= scale;

                createGuide(copy);
            });
        }
    })
}

interface DraggingEvent {
	dx: number, 
	dy: number,
	offsetRect: Rect,
    eventRect: Rect,
}

interface SnappingResult {
	x?: number, 
	y?: number, 
	range?: number, 
    snapGuides: SnapPoint[]
}

export interface MarginValues {
	marginLeft: string;
	marginRight: string;
	marginTop: string;
	marginBottom: string;
	display: string;
}
export interface FlexValues {
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
	onIsDragging?: (event: DraggingEvent, element: HTMLElement) => void;
	//TODO: Do something better to not have a dependency on FlexValues
	onDragFinish?: (parent: HTMLElement) => void;
	onCalculateSnapping?: (element: HTMLElement, x: number, y: number, currentX: number, currentY: number) => SnappingResult | undefined;
	snapPoints?: SnapPoint[],
	restrictToParent?: boolean;
    restrictions: RectBox[],
	scale: number;
	canDrag: (element: HTMLElement) => boolean;
}
export const useDraggable = ({element, onIsDragging, onCalculateSnapping, onDragFinish, canDrag, restrictToParent=false, scale, restrictions}: DraggableProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const [offsetX, setOffsetX] = useState<number>(0);
	const [offsetY, setOffsetY] = useState<number>(0);
	const refX = useRef(0);
	const refY = useRef(0);
	const snapGuides = useRef<SnapPoint[]>([]);
	const shiftSnapper = useRef<{x: number, y: number}>()
    const $parent = $('#harmony-snap-guides');

	useEffect(() => {
		if (element) {
			refY.current = getBoundingClientRect(element, 'y', 'close', scale)
			refX.current = getBoundingClientRect(element, 'x', 'close', scale);
			setOffsetX(refX.current);
			setOffsetY(refY.current);

			const modifiers: Modifier[] = [
				interact.modifiers.snap({
					targets: [function() {
						if (shiftSnapper.current) {
							return {x: shiftSnapper.current.x};
						}
					}, function() {
						if (shiftSnapper.current) {
							return {y: shiftSnapper.current.y};
						}
					}],
					range: Infinity,
					relativePoints: [{x: 0, y: 0}],
				}),
				interact.modifiers.snap({
					targets: [interact.createSnapGrid({x: 2 * scale, y: 2 * scale})],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{x: 0, y: 0}],
					offset: 'self',
				}),
				interact.modifiers.snap({
					targets: [function(x, y, interaction, offset, index) {
						if (!onCalculateSnapping) return;

						const result = onCalculateSnapping(element, x, y, refX.current, refY.current);
						if (!result) return;

						snapGuides.current = result.snapGuides;

						return result;
					}],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
					offset: 'parent'
				}),
			];
			if (restrictToParent) {
				modifiers.push(interact.modifiers.restrict({
					restriction: 'parent',
					elementRect: { top: 0, left: 0, bottom: 1, right: 1 }, // Restrict to the parent element
				}));
			}

            for (const restriction of restrictions) {
                modifiers.push(interact.modifiers.restrict({
                    restriction,
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
                }));
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
			document.addEventListener('keyup', onKeyUp);
		}

		return () => {
			document.removeEventListener('keydown', onKeyDown)
			document.addEventListener('keyup', onKeyUp);
		}
	}, [element, scale, shiftSnapper]);

	const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
		//TODO: Dependency on contentEditable. This hook should not know about that
		if (!element || element.contentEditable === 'true') return;

		if (e.key === 'Shift') {
			const rect = element.getBoundingClientRect();
			shiftSnapper.current = {x: rect.left, y: rect.top}
		}


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

	const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
		if (event.key === "Shift") {
			shiftSnapper.current = undefined;
		}
	})

	const startDragging = useEffectEvent((event: InteractEvent<'drag', 'start'>) => {
        
	});

	const handleTheDragging = (event: DraggingEvent) => {
		if (!element) return;
		!isDragging && setIsDragging(true);
        
		refY.current = event.offsetRect.top;
		refX.current = event.offsetRect.left;
		onIsDragging && onIsDragging(event, element);

		$parent.children().remove();
		handleGuides(event.eventRect, snapGuides.current, scale);
	}
	  
	const drag = useEffectEvent((event: InteractEvent<'drag', 'move'>) => {
		//TODO: Remove dependency on selected
		if (!element || !canDrag(element)) return;
        const rect = getOffsetRect(element);
        rect.left += event.dx / scale;
        rect.right += event.dx / scale;
        rect.top += event.dy / scale;
        rect.bottom += event.dy / scale;

		handleTheDragging({dx: event.dx, dy: event.dy, offsetRect: rect, eventRect: event.rect});
	});
	
	const stopDragging = useEffectEvent((e: InteractEvent<'drag', 'move'>) => {
		setIsDragging(false);
		if (!element) return;
		$parent.children().remove();
		onDragFinish && onDragFinish(element);
	});

	return {isDragging};
}

type ResizingEvent = DraggingEvent & {
	edges: {top: boolean, bottom: boolean, left: boolean, right: boolean},
	deltaRect: Required<ResizeEvent<'move'>>['deltaRect']
}

//TODO: Refactor out duplicate code into useSnappable hook
interface ResizableProps {
    element: HTMLElement | undefined;
    scale: number;
    restrictions: RectBox[],
	onIsResizing?: (event: ResizingEvent) => void;
    onResizeFinish?: (element: HTMLElement) => void;
    onCalculateSnapping?: (element: HTMLElement, x: number, y: number, currentX: number, currentY: number) => SnappingResult | undefined;
	canResize: (element: HTMLElement) => boolean;
}
export const useResizable = ({element, scale, restrictions, canResize, onIsResizing, onResizeFinish, onCalculateSnapping}: ResizableProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const snapGuides = useRef<SnapPoint[]>([]);
    const refX = useRef(0);
	const refY = useRef(0);
	const aspectRef = useRef<Modifier<AspectRatioOptions, AspectRatioState, "aspectRatio", unknown>>()
	const $parent = $('#harmony-snap-guides');

    useEffect(() => {
		if (element) {
			const modifiers: Modifier[] = [
				interact.modifiers.snap({
					targets: [interact.createSnapGrid({x: 2 * scale, y: 2 * scale})],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					relativePoints: [{x: 0, y: 0}],
					offset: 'self',
				}),
				interact.modifiers.snapEdges({
					targets: [function(x, y, interaction, offset, index) {
						if (!onCalculateSnapping) return;

						const result = onCalculateSnapping(element, x, y, refX.current, refY.current);
						if (!result) return;

						snapGuides.current = result.snapGuides;

						return result;
					}],
					// Control the snapping behavior
					range: Infinity, // Snap to the closest target within the entire range
					//relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
					offset: 'parent'
				}),
			];
			if (true) {
				//TODO: Remove this dependency on edge info
				const parent = element.parentElement!;
				const style = getComputedStyle(parent);
				const axis = style.display.includes('flex') && style.flexDirection === 'column' ? 'y' : 'x';
				const parentInfo = calculateParentEdgeInfo(parent, scale, scale, false, 'x');
				const myInfo = parentInfo.childEdgeInfo.find(info => info.element === element);
				if (!myInfo) throw new Error("Cannot find my info");

				const toMeasure = selectDesignerElementReverse(element);
				const toMeasureInfo = toMeasure.children.length > 0 && !isTextElement(toMeasure) && !isImageElement(toMeasure) ? calculateParentEdgeInfo(toMeasure, scale, scale, false, 'x') : undefined;
				
				const validSibiling = (side: RectSide) => {
					const otherSideClose = side === 'left' || side === 'right' ? 'top' : 'left';
					const otherSideFar = otherSideClose === 'top' ? 'bottom' : 'right';

					const selfRect = getBoundingRect(myInfo.element);
					const selfLocationClose = myInfo[otherSideClose].elementLocation
					const selfLocationFar = myInfo[otherSideFar].elementLocation;
					const sibiling = myInfo[side].siblingEdge?.edgeElement;
					if (sibiling !== undefined) {
						const rect = getBoundingRect(sibiling);
						if (rect[otherSideClose] >= selfLocationClose && rect[otherSideClose] <= selfLocationFar || rect[otherSideFar] >= selfLocationClose && rect[otherSideFar] <= selfLocationFar) {
							return true;
						}
					}

					return false;
				}

				modifiers.push(interact.modifiers.restrictEdges({
					inner: toMeasureInfo ? {
						left: toMeasureInfo.edges.left.elementLocation,
						right: toMeasureInfo.edges.right.elementLocation,
						top: toMeasureInfo.edges.top.elementLocation,
						bottom: toMeasureInfo.edges.bottom.elementLocation
					} : undefined,
					outer: {
						left: validSibiling('left') ? Math.max(parentInfo.edges.left.parentEdge.edgeLocation, myInfo.left.siblingEdge?.edgeLocation || 0) : parentInfo.edges.left.parentEdge.edgeLocation,
						right: validSibiling('right') ? Math.min(parentInfo.edges.right.parentEdge.edgeLocation, myInfo.right.siblingEdge?.edgeLocation || Infinity) : parentInfo.edges.right.parentEdge.edgeLocation,
						top: true ? Math.max(parentInfo.edges.top.parentEdge.edgeLocation, myInfo.top.siblingEdge?.edgeLocation || 0) : parentInfo.edges.top.parentEdge.edgeLocation,
						bottom: true ? Math.min(parentInfo.edges.bottom.parentEdge.edgeLocation, myInfo.bottom.siblingEdge?.edgeLocation || Infinity) : parentInfo.edges.bottom.parentEdge.edgeLocation,
					}
				}));
				//TODO: Remove isImage dependency (This is here because we want to be able to resize an image at will till the minimum size)
				const {width, height} = isImageElement(toMeasure) ? {width: 20, height: 20} : getFitContentSize(toMeasure);
				modifiers.push(interact.modifiers.restrictSize({
					//Hacky fix for when a flex-basis flex-col item is measured, it comes out all wrong
					min: {width: width <= toMeasure.clientWidth ? Math.max(width, 20) : 20, height: height <= toMeasure.clientHeight ? Math.max(height, 20) : 20}
				}))
			}

            for (const restriction of restrictions) {
                modifiers.push(interact.modifiers.restrictEdges({
                    outer: restriction,
                    //elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                }))
            }

			aspectRef.current = interact.modifiers.aspectRatio({
				ratio: 'preserve',
				modifiers
			}).disable();

			interact(element).resizable({
                edges: {left: true, bottom: true, right: true, top: true},
				listeners: {
					start: startResizing,
					move: resize,
					end: stopResizing
				},
				modifiers: [aspectRef.current, ...modifiers],
				margin: 4,
			});

			document.addEventListener('keydown', onKeyDown);
			document.addEventListener('keyup', onKeyUp);
		}

		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
		}
	}, [element, scale, aspectRef]);

	const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
		if (event.key === 'Shift') {
			aspectRef.current?.enable();
		}
	});

	const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
		if (event.key === 'Shift') {
			aspectRef.current?.disable();
		}
	})

    const handleTheResizing = (event: ResizingEvent) => {
        if (!element) return;
		!isResizing && setIsResizing(true);
        
		refY.current = event.offsetRect.top;
		refX.current = event.offsetRect.left;
		onIsResizing && onIsResizing(event);

		$parent.children().remove();
		handleGuides(event.eventRect, snapGuides.current, scale);
    }

    const startResizing = useEffectEvent((event: InteractEvent<'resize', 'start'>) => {

    });

    const resize = useEffectEvent((event: ResizeEvent<'move'>) => {
        if (!element || !canResize(element)) return;
		
        if (!event.deltaRect) {
            throw new Error("Let's figure out why delta rect doesn't exist");
        }

		if (!event.edges) {
            throw new Error("Let's figure out why delta rect doesn't exist");
        }

        const rect = getOffsetRect(element);
        rect.left += round(event.deltaRect.left / scale);
        rect.right += round(event.deltaRect.right / scale);
        rect.top += round(event.deltaRect.top / scale);
        rect.bottom += round(event.deltaRect.bottom / scale);
        rect.width += round(event.deltaRect.width / scale);
        rect.height += round(event.deltaRect.height / scale);
        
        handleTheResizing({dx: event.dx, dy: event.dy, deltaRect: event.deltaRect, offsetRect: rect, eventRect: event.rect, edges: {
			top: Boolean(event.edges.top),
			bottom: Boolean(event.edges.bottom),
			left: Boolean(event.edges.left),
			right: Boolean(event.edges.right),
		}});
    })

    const stopResizing = useEffectEvent((event: InteractEvent<'resize', 'end'>) => {
        setIsResizing(false);
        if (!element) return;
		$parent.children().remove();
		onResizeFinish && onResizeFinish(element);
    })

    return {isResizing};
}

interface DraggableListProps {
	onDragFinish?: (props: {element: HTMLElement, aborter: AbortController, from: number, to: number}) => void;
	onIsDragging?: () => void;
}
export const useDraggableList = ({ onDragFinish, onIsDragging }: DraggableListProps) => {
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