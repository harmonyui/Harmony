import { capitalizeFirstLetter, groupBy, groupByDistinct, round } from "@harmony/util/src";
import interact from "interactjs";
import { useState, useEffect, useRef } from "react";
import { Rect, RectBox, selectDesignerElement } from "./inspector";
import { useEffectEvent } from "../../../../ui/src/hooks/effect-event";
import {InteractEvent, ResizeEvent} from '@interactjs/types'
import {Modifier} from '@interactjs/modifiers/types'
import {SnapPosition} from '@interactjs/modifiers/snap/pointer'
import $ from 'jquery';
import { info } from "console";

const close = (a: number, b: number, threshold: number): boolean => {
	return Math.abs(a-b) <= threshold;
}

const getMinGapForElement = (element: HTMLElement): number => {
	const parent = element.parentElement!;
	const minGapStr = parent.dataset.minGap;
	let minGap = 0;
	if (!minGapStr) {
		const style = getComputedStyle(parent);
		minGap = parseFloat($(parent).css('gap') || '0');
		parent.dataset.minGap = `${minGap}`;
	} else {
		minGap = parseFloat(minGapStr);
	}

	return minGap;
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

function getBoundingClientRect(element: HTMLElement, axis: Axis, type: BoundingType, _scale: number, rectOverride?: Rect): number {
    const scale = 1;
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

function getBoundingClientRectParent(parent: HTMLElement, axis: Axis, type: BoundingType, _scale: number, rectOverride?: Rect) {
	const scale = 1;
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

function getGapTypesToParent(element: HTMLElement, parent: HTMLElement, axis: Axis, side: Side) {
    return getGapTypes(element, parent, axis, side, ['margin', 'other-padding']);
}

function getGapTypesToSibiling(element: HTMLElement, sibling: HTMLElement, axis: Axis, side: Side) {
    return getGapTypes(element, sibling, axis, side, ['margin', 'other-otherside-margin']);
}

type GapType = `${'other-' | ''}${'otherside-' | ''}${'margin' | 'padding'}`
interface GapInfo {
    type: GapType,
    value: string | number,
    element: HTMLElement,
    style: string,
}
interface EdgeInfo {
    gap: number,
    relation: 'parent' | 'sibling',
    edgeElement: HTMLElement,
    edgeLocation: number,
    edgeLocationRelative: number,
    gapTypes: GapInfo[],
}

function getGapTypes(fromElement: HTMLElement, toElement: HTMLElement, axis: Axis, side: Side, types: GapType[]): GapInfo[] {
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
        const styleValue = $(curr).css(style);
        if (!styleValue) continue;

        let value: number | string = parseFloat(styleValue);
        if (isNaN(value)) {
            value = styleValue;
        } 

        if (value === 0) continue;

        gapTypes.push({type, value, element: curr, style});
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
    midpointX: number,
    midpointY: number,
    left: ElementEdgeInfo,
    right: ElementEdgeInfo,
    top: ElementEdgeInfo,
    bottom: ElementEdgeInfo
}

interface ParentEdgeInfo {
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
    edges: {
        left: ElementEdgeInfo & {info: ChildEdgeInfo},
        right: ElementEdgeInfo & {info: ChildEdgeInfo},
        top: ElementEdgeInfo & {info: ChildEdgeInfo},
        bottom: ElementEdgeInfo & {info: ChildEdgeInfo},
    }
}

function calculateEdgesInfo(element: HTMLElement, scale: number, axis: Axis, updates: UpdateRect[]=[]): ChildEdgeInfo {
    const parent = element.parentElement!;
	const otherAxis = axis === 'x' ? 'y' : 'x';
    const left = calculateAxisEdgeInfo(element, axis, 'close', scale, updates);
    const right = calculateAxisEdgeInfo(element, axis, 'far', scale, updates);
    const top = calculateAxisEdgeInfo(element, otherAxis, 'close', scale, updates);
    const bottom = calculateAxisEdgeInfo(element, otherAxis, 'far', scale, updates);
    const rectOverride = updates.find(update => update.element === element)?.rect;
    const parentOverride = updates.find(update => update.element === parent)?.rect;
    const midpointX = (getBoundingClientRect(element, axis, 'close', scale, rectOverride) + getBoundingClientRect(element, axis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, axis, 'close', scale, parentOverride);
    const midpointY = (getBoundingClientRect(element, otherAxis, 'close', scale, rectOverride) + getBoundingClientRect(element, otherAxis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, otherAxis, 'close', scale, parentOverride);
    
    return {
        element,
        left,
        right,
        top,
        bottom,
        midpointX,
        midpointY,
        index: Array.from(element.parentElement!.children).indexOf(element)
    }
}

function calculateAxisEdgeInfo(element: HTMLElement, axis: Axis, side: Side, scale: number, updates: UpdateRect[]=[]): ElementEdgeInfo {
    const parent = element.parentElement;
    if (!parent) throw new Error("Element does not have a parent");
    const selfIndex = Array.from(parent.children).indexOf(element);
    //const siblings: HTMLElement[] = Array.from(parent.children).filter(sibiling => sibiling !== element) as HTMLElement[];
    
    const otherSide = side === 'close' ? 'far' : 'close';
    const otherAxis = axis === 'x' ? 'y' : 'x';

    const getRectOverride = (element: HTMLElement): Rect | undefined => {
        const updateRect = updates.find(update => update.element === element);
        return updateRect?.rect;
    }

    const myStart = getBoundingClientRect(element, otherAxis, side, scale, getRectOverride(element));
	const myEnd = getBoundingClientRect(element, otherAxis, otherSide, scale, getRectOverride(element));
	const parentEdge: EdgeInfo = side === 'close' ? {
        gap: getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        relation: 'parent',
        edgeElement: parent,
        gapTypes: getGapTypesToParent(element, parent, axis, side),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: 0,
    } : {
        gap: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) - getBoundingClientRect(element, axis, side, scale, getRectOverride(element)),
        relation: 'parent',
        edgeElement: parent,
        gapTypes: getGapTypesToParent(element, parent, axis, side),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) - getBoundingClientRectParent(parent, axis, otherSide, scale, getRectOverride(parent)),
    }

    // if (axis === 'x') {
    //     return {close, far};
    // }
    let siblingEdge: EdgeInfo | undefined = undefined;
    if (selfIndex > 0 && side === 'close') {
        const sibling = parent.children[selfIndex - 1] as HTMLElement;
        const newStart = getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling));
        siblingEdge = {
            gap: newStart,
            relation: 'sibling',
            edgeElement: sibling,
            gapTypes: getGapTypesToSibiling(element, sibling, axis, side),
            edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
            edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
        };
    }

    if (selfIndex < parent.children.length - 1 && side === 'far') {
        const sibling = parent.children[selfIndex + 1] as HTMLElement;
        const newEnd = getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - getBoundingClientRect(element, axis, side, scale, getRectOverride(element));
        siblingEdge = {
            gap: newEnd,
            relation: 'sibling',
            edgeElement: sibling,
            gapTypes: getGapTypesToSibiling(element, sibling, axis, otherSide),
            edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
            edgeLocationRelative: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)) - parentEdge.edgeLocation
        };
    }

    //TODO: Do we need to check each sibling or just the one next to us? 
	// for (const sibling of siblings) {
		
	// 	const closeOtherSide = getBoundingClientRect(sibling, otherAxis, side, scale, getRectOverride(sibling));
	// 	const farOtherSide = getBoundingClientRect(sibling, otherAxis, otherSide, scale, getRectOverride(sibling));
	// 	if (!((closeOtherSide < myStart && farOtherSide < myStart) || (closeOtherSide > myEnd && farOtherSide > myEnd))) {
	// 		const newStart = getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling));
	// 		const newEnd = getBoundingClientRect(sibling, axis, side, scale, getRectOverride(sibling)) - getBoundingClientRect(element, axis, otherSide, scale, getRectOverride(element));

	// 		if (newStart >= 0 && newStart < close.gap) {
    //             console.log(`${axis} aligned close for ${element.id}`)
	// 			close = {
    //                 gap: newStart,
    //                 relation: 'sibling',
    //                 edgeElement: sibling,
    //                 gapTypes: getGapTypesToSibiling(element, sibling, axis, side),
    //                 edgeLocation: getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling)),
    //                 elementLocation: getBoundingClientRect(element, axis, side, scale, getRectOverride(element)),
    //                 element
    //             };
	// 		}
	// 		if (newEnd >= 0 && newEnd < far.gap) {
    //             console.log(`${axis} aligned far for ${element.id}`)
	// 			far = {
    //                 gap: newEnd,
    //                 relation: 'sibling',
    //                 edgeElement: sibling,
    //                 gapTypes: getGapTypesToSibiling(element, sibling, axis, otherSide),
    //                 edgeLocation: getBoundingClientRect(sibling, axis, side, scale, getRectOverride(sibling)),
    //                 elementLocation: getBoundingClientRect(element, axis, otherSide, scale, getRectOverride(element)),
    //                 element
    //             };
	// 		}
	// 	}
	// }

    const parentMidpoint = (getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent)) + getBoundingClientRectParent(parent, axis, 'size', scale, getRectOverride(parent)) / 2) + (side === 'close' ? -1 : 1) * getBoundingClientRect(element, axis, 'size', scale, getRectOverride(element)) / 2;
    const parentMidpointRelative = parentMidpoint - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent));
	const elementLocation = getBoundingClientRect(element, axis, side, scale, getRectOverride(element));
    const elementLocationRelative = elementLocation - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent))
    return {parentEdge, siblingEdge, elementLocation, elementLocationRelative, parentMidpoint, parentMidpointRelative, element}
}

function calculateParentEdgeInfo(parent: HTMLElement, scale: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentEdgeInfo {
    const childEdgeInfo: ChildEdgeInfo[] = [];
	const firstChild = parent.children[0] as HTMLElement;
	const lastChild = parent.children[parent.children.length - 1] as HTMLElement;
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

        for (const child of Array.from(parent.children)) {
            if (!updates.find(update => update.element === child)) {
                updates.push({element: child as HTMLElement, rect: getOffsetRect(child as HTMLElement)})
            }
        }
    }
    for (const child of Array.from(parent.children)) {
        childEdgeInfo.push(calculateEdgesInfo(child as HTMLElement, scale, axis, updates));
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
	const childrenWidth = Array.from(parent.children).reduce((prev, curr) => prev + curr.clientWidth, 0);
	const childrenHeight = Array.from(parent.children).reduce((prev, curr) => prev + curr.clientHeight, 0);
	const childrenMidpointX = (getBoundingClientRect(lastChild, axis, 'far', scale, getRectOverride(lastChild)) + getBoundingClientRect(firstChild, axis, 'close', scale, getRectOverride(firstChild))) / 2;
	const childrenMidpointY = (getBoundingClientRect(lastChild, otherAxis, 'far', scale, getRectOverride(lastChild)) + getBoundingClientRect(firstChild, otherAxis, 'close', scale, getRectOverride(firstChild))) / 2;
	
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
	

    return {
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
        }
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
function calculateFlexParentEdgeInfo(parent: HTMLElement, scale: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentFlexEdgeInfo {
	const parentInfo = calculateParentEdgeInfo(parent, scale, useRectOffset, axis, updates);

	const getRectOverride = (element: HTMLElement): Rect | undefined => {
        const updateRect = updates.find(update => update.element === element);
        return updateRect?.rect;
    }

	const numChildren = parent.children.length;

	
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

interface UpdateRect {
    element: HTMLElement,
    rect: Rect
}
interface UpdateRectsProps {
    parentUpdate: UpdateRect,
    childrenUpdates: UpdateRect[]
}
function updateRects({parentUpdate, childrenUpdates}: UpdateRectsProps, scale: number) {
    const parent = parentUpdate.element;
    const children = Array.from(parent.children);
    const {edges, childEdgeInfo, midpointXRelative} = calculateParentEdgeInfo(parent, scale, true, 'x', [parentUpdate, ...childrenUpdates]);
    Object.entries(edges).forEach(([side, edge]) => {
        const gap = edge.parentEdge.gap;
        parent.style[`padding${capitalizeFirstLetter(side)}` as unknown as number] = `${gap}px`;
    });

    for (const info of childEdgeInfo) {
        const leftGap = info.left.parentEdge.gap - edges.left.parentEdge.gap;
        const rightGap = info.right.parentEdge.gap - edges.right.parentEdge.gap;
        if (info.left.parentEdge.gap >= 0 && info.right.parentEdge.gap >= 0) {
            info.element.style.marginLeft = `${leftGap}px`;
            info.element.style.marginRight = `${rightGap}px`;
        }
        if (info.index > 0 && info.top.siblingEdge && Math.abs(info.top.siblingEdge.gap - 0.1) >= 0) {
            info.element.style.marginTop = `${info.top.siblingEdge.gap}px`
        } 

        // if (midpointXRelative <= info.midpointX) {
        //     info.element.style.marginLeft = 'auto';
        //     if (midpointXRelative === info.midpointX && edges.left.parentEdge.gap === edges.right.parentEdge.gap) {
        //         info.element.style.marginRight = 'auto';
        //     } else {
        //         info.element.style.marginRight = `${rightGap}px`;
        //     }
        // }
    }
}

interface ElementInfo {
	gapStart: number;
	gapEnd: number;
	parentMidpoint: number;
	elementMidpoint: number;
}
function calculateElementInfo(element: HTMLElement, axis: Axis, scale: number): ElementInfo {
	const parent = element.parentElement!;
	const numChildren = parent.children.length;

	const otherAxis = axis === 'x' ? 'y' : 'x';
	const selfIndex = Array.from(parent.children).indexOf(element);
	const myStart = getBoundingClientRect(element, otherAxis, 'close', scale);
	const myEnd = getBoundingClientRect(element, otherAxis, 'far', scale);
	let gapStart = getBoundingClientRect(element, axis, 'close', scale) - getBoundingClientRectParent(parent, axis, 'close', scale);
	let gapEnd = getBoundingClientRectParent(parent, axis, 'far', scale) - getBoundingClientRect(element, axis, 'far', scale);
	for (let i = 0; i < numChildren; i++) {
		const child = parent.children[i] as HTMLElement;
		if (i === selfIndex) {
			continue;
		}

		const closeOtherSide = getBoundingClientRect(child, otherAxis, 'close', scale);
		const farOtherSide = getBoundingClientRect(child, otherAxis, 'far', scale);
		if (!((closeOtherSide < myStart && farOtherSide < myStart) || (closeOtherSide > myEnd && farOtherSide > myEnd))) {
			const newStart = getBoundingClientRect(element, axis, 'close', scale) - getBoundingClientRect(child, axis, 'far', scale);
			const newEnd = getBoundingClientRect(child, axis, 'close', scale) - getBoundingClientRect(element, axis, 'far', scale);

			if (newStart >= 0 && newStart < gapStart) {
				gapStart = newStart;
			}
			if (newEnd >= 0 && newEnd < gapEnd) {
				gapEnd = newEnd;
			}
		}
	}
	
	const parentMidpoint = (getBoundingClientRectParent(parent, axis, 'close', scale) + getBoundingClientRectParent(parent, axis, 'size', scale) / 2);
	const elementMidpoint = (getBoundingClientRect(element, axis, 'close', scale) + getBoundingClientRect(element, axis, 'size', scale) / 2);

	return {gapStart, gapEnd, parentMidpoint, elementMidpoint};
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

function isElementFluid(elm: Element, side: 'width' | 'height'){
    var wrapper, clone = elm.cloneNode(false) as HTMLElement, ow, p1, p2;
    let value;
    if( window.getComputedStyle ) {
      value = window.getComputedStyle(clone,null)[side];
    }
    /// the browsers that fail to work as Firefox does
    /// return an empty width value, so here we fall back.
    if ( !value ) {
      /// remove styles that can get in the way
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
      wrapper.style.display = 'block';
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

//const minGap = 8;

// function setFlexDragPosition(element: HTMLElement, props: DraggingEvent, axis: Axis, scale: number) {
// 	const parent = element.parentElement as HTMLElement;
// 	const startPos = axis === 'y' ? props.rect.top : props.rect.left;
// 	const posY = startPos - getBoundingClientRectParent(parent, axis, 'close', scale);
// 	const closePadding = axis === 'y' ? 'paddingTop' : 'paddingLeft';
// 	const farPadding = axis === 'y' ? 'paddingBottom' : 'paddingRight';

// 	const {
// 		childrenMidpoint,
// 		gapBetween,
// 	} = calculateFlexInfo(parent, axis, scale);
// 	const numChildren = parent.children.length;
// 	const selfIndex = Array.from(parent.children).indexOf(element);
// 	if (selfIndex < 0) {
// 		throw new Error("Invalid self index");
// 	}
// 	const firstChild = parent.children[0] as HTMLElement;
// 	const lastChild = parent.children[parent.children.length - 1] as HTMLElement;
// 	const ds = axis === 'y' ? props.dy : props.dx;
// 	const axisGap = axis === 'y' ? 'gap' : 'gap';

// 	const position = selfIndex === 0 || selfIndex === numChildren - 1 ? 'edge' : 'middle';
	
// 	const isExpanding = position === 'edge' && (gapBetween > minGap || (selfIndex === 0 && ds < 0 || selfIndex === numChildren - 1 && ds > 0));

// 	if (isExpanding) {
// 		const p0o = getBoundingClientRect(firstChild, axis, 'close', scale) - getBoundingClientRectParent(parent, axis, 'close', scale);
// 		const p1o = getBoundingClientRect(lastChild, axis, 'close', scale) - (getBoundingClientRectParent(parent, axis, 'close', scale));
// 		const p0 = p1o + p0o - posY;
// 		const childrenBeforeHeight = Array.from(parent.children).slice(0, parent.children.length - 1).reduce((prev, curr) => prev + getBoundingClientRect(curr as HTMLElement, axis, 'size-full', scale), 0);
// 		const gap = selfIndex === 0 ? (2*(childrenMidpoint - getBoundingClientRectParent(parent, axis, 'close', scale)) - (2 * posY + getBoundingClientRect(lastChild, axis, 'size-full', scale) + childrenBeforeHeight)) / (numChildren - 1) : (posY - (p0 + childrenBeforeHeight + getExtra(lastChild, axis, 'close'))) / (numChildren - 1);
		
// 		let padding = selfIndex === 0 ? posY : p0;

// 		//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
// 		if (padding < 0) {
// 			padding = 0;
// 		}

		
// 		parent.style[axisGap] = `${gap}px`;
		
// 		if (!['center', 'space-evenly', 'space-around', 'space-between'].includes(parent.style.justifyContent)) {
// 			parent.style[closePadding] = `${padding}px`
// 			parent.style.justifyContent = 'normal';
// 			parent.style[farPadding] = '0px';
// 		}
// 	} else {
// 		//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
// 		let padding = startPos - (getBoundingClientRect(element, axis, 'close', scale) - getBoundingClientRect(firstChild, axis, 'close', scale)) - getBoundingClientRectParent(parent, axis, 'close', scale);
// 		if (padding < 0) {
// 			padding = 0;
// 		}
// 		parent.style[closePadding] = `${padding}px`
// 		parent.style.justifyContent = 'normal';
// 		parent.style.gap = `${gapBetween}px`;
// 		parent.style[farPadding] = '0px';
// 	}
	

// 	let info = calculateFlexInfo(parent, axis, scale);


// 	if (close(info.parentMidpoint, info.childrenMidpoint, 0.1)) {
// 		parent.style.justifyContent = 'center';
// 		parent.style[closePadding] = '0px';
// 		parent.style[farPadding] = '0px';

// 		info = calculateFlexInfo(parent, axis, scale);
// 		if (close(info.gapBetween, info.evenlySpace, 0.1)) {
// 			parent.style.justifyContent = 'space-evenly';
// 			parent.style[axisGap] = '0px';
// 		} else if (close(info.gapBetween, info.aroundSpace, 0.1)) {
// 			parent.style.justifyContent = 'space-around';
// 			parent.style[axisGap] = '0px';
// 		} else if (close(info.gapBetween, info.betweenSpace, 0.1)) {
// 			parent.style.justifyContent = 'space-between';
// 			parent.style[axisGap] = '0px';
// 		}
// 	} else if (info.childrenMidpoint > info.parentMidpoint) {
// 		parent.style[closePadding] = '0px';
// 		parent.style[farPadding] = `${info.gapEnd}px`;
// 		parent.style.justifyContent = 'flex-end';
// 	} else {
// 		parent.style.justifyContent = 'normal';
// 	}

// 	if (close(info.gapBetween, minGap, 1)) {
// 		parent.style.gap = `${minGap}px`;
// 	}
// }

function setFlexDragPositionOtherAxis(element: HTMLElement, props: DraggingEvent, axis: Axis, scale: number) {
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

function setDragPosition(element: HTMLElement, props: DraggingEvent, axis: Axis, scale: number) {
	const parent = element.parentElement as HTMLElement;
	const startPos = axis === 'y' ? props.rect.top : props.rect.left;
	const posY = startPos - getBoundingClientRectParent(parent, axis, 'close', scale);
	const closeMargin = axis === 'y' ? 'marginTop' : 'marginLeft';
	const farMargin = axis === 'y' ? 'marginBottom' : 'marginRight';

	const {gapStart, gapEnd} = calculateElementInfo(element, axis, scale);

	//Only deal with align-items axis if there is space to move
	if (gapEnd === 0 && gapStart === 0) return;

	// const selfIndex = Array.from(parent.children).indexOf(element);
	// if (selfIndex < 0) {
	// 	throw new Error("Invalid self index");
	// }
	//const firstChild = parent.children[0] as HTMLElement;
	//TODO: Fix bug where having the border top factored in for the top at scale causes negative padding
	let margin = startPos - getBoundingClientRectParent(parent, axis, 'close', scale)
	if (margin < 0) {
		margin = 0;
	}
	
	element.style[closeMargin] = `${margin}px`
	element.style[farMargin] = '0px';
	

	let info = calculateElementInfo(element, axis, scale);

	if (close(info.parentMidpoint, info.elementMidpoint, .1)) {
		element.style.display = 'block';
		element.style[closeMargin] = 'auto';
		element.style[farMargin] = 'auto';
	} else if (info.elementMidpoint > info.parentMidpoint) {
		element.style.display = 'block';
		element.style[closeMargin] = 'auto';
		element.style[farMargin] = `${info.gapEnd}px`;
	} else {
		//element.style.display = 'inherit'
	}
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
	getOldValues: (element: HTMLElement) => Record<string, string>;
	isDraggable: (element: HTMLElement) => boolean;
	onUpdate: (element: HTMLElement, event: DraggingEvent, scale: number, isResize: boolean) => void;
	onCalculateSnapping: (element: HTMLElement, posX: number, posY: number, dx: number, dy: number, scale: number, isResize: boolean) => {resultsX: SnappingResult[], resultsY: SnappingResult[]};
	onFinish: (element: HTMLElement) => HTMLElement;
    getRestrictions: (element: HTMLElement, scale: number) => RectBox[];
}

const elementSnapBehavior: SnapBehavior = {
	getOldValues(element) {
		return {
			marginLeft: element.style.marginLeft || '', 
			marginRight: element.style.marginRight || '', 
			marginTop: element.style.marginTop || '', 
			marginBottom: element.style.marginBottom || '', 
			display: element.style.display || '',
		}
	},
	isDraggable(element) {
		const style = element ? getComputedStyle(element.parentElement!) : undefined;
		return style?.display.includes('flex') ? false : true;
	},
	onUpdate(element, event, scale) {
        if (!element.parentElement) {
            throw new Error("Element does not have a parent");
        }

        const childrenUpdates: UpdateRect[] = [{
            element,
            rect: event.rect
        }];
        updateRects({
            parentUpdate: {
                element: element.parentElement,
                rect: getOffsetRect(element.parentElement)
            },
            childrenUpdates
        }, scale);
	},
	onCalculateSnapping(element) {
        const parent = element.parentElement!;
        const parentEdgeInfo = calculateParentEdgeInfo(parent, 1, false, 'x');
        const parentEdgeInfoScaled = calculateParentEdgeInfo(parent, 1, true, 'x');
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

        resultsX.push({
            snapGuides: [{
                offset: parent,
                point: {x: myChildInfo.left.parentMidpointRelative},
                guides: [
                    {x0: 0.5, x1: 0.5, y0: 0, y1: 1, relative: ['x0', 'x1', 'y0', 'y1']}
                ]
            }],
            x: myChildInfo.left.parentMidpointRelative,
            range
        });
        resultsY.push({
            snapGuides: [{
                offset: parent,
                point: {y: myChildInfo.top.parentMidpointRelative},
                guides: [
                    {rotate: true, x0: 0.5, x1: 0.5, y0: 0, y1: 1, relative: ['x0', 'x1', 'y0', 'y1']}
                ]
            }],
            y: myChildInfo.top.parentMidpointRelative,
            range
        })
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
        const edgeInfo = calculateEdgesInfo(element, 1, 'x');
        
        const top = edgeInfo.top.siblingEdge ? edgeInfo.top.siblingEdge.edgeLocation : edgeInfo.top.parentEdge.edgeLocation;
        const bottom = edgeInfo.bottom.siblingEdge ? edgeInfo.bottom.siblingEdge.edgeLocation : edgeInfo.bottom.parentEdge.edgeLocation;
        const left = edgeInfo.left.parentEdge.edgeLocation//edgeInfo.left.siblingEdge ? edgeInfo.left.siblingEdge.edgeLocation : edgeInfo.left.parentEdge.edgeLocation;
        const right = edgeInfo.right.parentEdge.edgeLocation;//edgeInfo.right.siblingEdge ? edgeInfo.right.siblingEdge.edgeLocation : edgeInfo.right.parentEdge.edgeLocation;

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
		return {
			paddingLeft: element.parentElement!.style.paddingLeft || '', 
			paddingRight: element.parentElement!.style.paddingRight || '', 
			paddingTop: element.parentElement!.style.paddingTop || '', 
			paddingBottom: element.parentElement!.style.paddingBottom || '', 
			justifyContent: element.parentElement!.style.justifyContent || '', 
			alignItems: element.parentElement!.style.alignItems || '',
			gap: element.parentElement!.style.gap || '',
		}
	},
	isDraggable(element) {
		const parentStyle = getComputedStyle(element.parentElement!);
		const flexElement = parentStyle?.display.includes('flex') //&& Array.from(element?.parentElement?.children || []).every(child => parentStyle.flexDirection === 'column' ? child.clientWidth === element?.clientWidth : child.clientHeight === element?.clientHeight) ? element: undefined
		return flexElement ? true : false;
	},
	onUpdate(element, event, scale, isResize) {
		const parent = element.parentElement!;
		const style = getComputedStyle(parent);
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
		const minGap = getMinGapForElement(element);
		const height = axis === 'x' ? 'height' : 'width';

		const currParentInfo = calculateParentEdgeInfo(parent, scale, false, 'x');
		const selfIndex = Array.from(parent.children).indexOf(element);
		const updates: UpdateRect[] = [];
		
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
			for (const child of Array.from(parent.children)) {
				if (exclude.includes(child)) continue;

				addDs(child as HTMLElement, ds);
			}
		}

		const calculateMovePositions = () => {
			//TODO: This is super hacky and confusing, refactor into a better system that makes more sense
			//Creating the expanding/moving train
			let ds = axis === 'x' ? event.dx : event.dy;
			if (parent.children.length > 1) {
				if (false && (selfIndex === 0 || selfIndex === parent.children.length - 1)) {
					ds = selfIndex === 0 ? ds : -ds;
					for (let start = 0, end = parent.children.length - 1; start < end; start++, end--) {
						const first = parent.children[start] as HTMLElement;
						const last = parent.children[end] as HTMLElement;

						first !== element && addDs(first, ds);
						last !== element && addDs(last, -ds);
						ds /= 3;
					}
				} else if (selfIndex === 0) {
					if (currParentInfo[minGapBetweenX] > minGap || ds < 0) {
						const last = parent.children[parent.children.length - 1] as HTMLElement;
						if (currParentInfo.edges[right].parentEdge.gap === 0 && ds < 0) {
							// if (currParentInfo.edges.left.parentEdge.gap <= 0) {
							// 	return;
							// }
							addChildRects([element, last], ds / (parent.children.length - 1))
						} else {
							addDs(last, -ds);
						}
					} else {
						// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
						// 	return;
						// }
						addChildRects([element], ds)
					}
				} else if (selfIndex === parent.children.length - 1) {
					if (currParentInfo[minGapBetweenX] > minGap || ds > 0) {
						const first = parent.children[0] as HTMLElement;
						if (currParentInfo.edges[left].parentEdge.gap === 0 && ds > 0) {
							// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
							// 	return;
							// }
							addChildRects([element, first], ds / (parent.children.length - 1))
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

		const parentInfo = calculateFlexParentEdgeInfo(parent, scale, false, 'x', updates);
		if (parentInfo.edges[left].parentEdge.gap <= 0) {
			parentInfo.edges[left].parentEdge.gap = 0;
		}
		if (parentInfo.edges[right].parentEdge.gap <= 0) {
			parentInfo.edges[right].parentEdge.gap = 0;
		}

		if (parentInfo[minGapBetweenX] < minGap) {
			parentInfo[minGapBetweenX] = minGap;
		}

		if (parentInfo[minGapBetweenX] > parentInfo[betweenSpace]) {
			parentInfo[minGapBetweenX] = parentInfo[betweenSpace];
		}
		

		parent.style.gap = `${parentInfo[minGapBetweenX]}px`;
		parent.style.justifyContent = 'normal';
		parent.style.alignItems = 'normal';

		const startXSide = parentInfo.edges[left].parentEdge.gap <= parentInfo.edges[right].parentEdge.gap ? left : right;
		const startYSide = parentInfo.edges[top].parentEdge.gap <= parentInfo.edges[bottom].parentEdge.gap ? top : bottom;
		
		parent.style.paddingTop = '0px';
		parent.style.paddingBottom = '0px';
		parent.style.paddingLeft = '0px';
		parent.style.paddingRight = '0px';

		Object.entries(parentInfo.edges).forEach(([side, edge]) => {
			const gap = side === startXSide || startYSide === side ? edge.parentEdge.gap : edge.parentEdge.gap;
			parent.style[`padding${capitalizeFirstLetter(side)}` as unknown as number] = `${gap}px`;
		});

		for (const info of parentInfo.childEdgeInfo) {
			info.element.style.marginTop = '0px';
			info.element.style.marginBottom = '0px';
			info.element.style.marginLeft = '0px';
			info.element.style.marginRight = '0px';

			// if (info.index > 0 && info.left.siblingEdge && info.left.siblingEdge.gap - parentInfo.minGapBetweenX >= 0) {
			// 	const gap = info.left.siblingEdge.gap - parentInfo.minGapBetweenX;
				
			// 	info.element.style.marginLeft = `${gap}px`
			// }

			const topGap = info[top].parentEdge.gap - parentInfo.edges[top].parentEdge.gap;
			if (topGap >= 0) {
				info.element.style[`margin${capitalizeFirstLetter(top)}` as unknown as number] = `${topGap}px`;
			}

			const bottomGap = info[bottom].parentEdge.gap - parentInfo.edges[bottom].parentEdge.gap;
			if (bottomGap >= 0) {
				info.element.style[`margin${capitalizeFirstLetter(bottom)}` as unknown as number] = `${bottomGap}px`;
			}
		}

		//Justify-content stuff
		if (parentInfo[gapBetween] !== undefined && close(parentInfo.edges[left].parentEdge.gap, parentInfo.edges[right].parentEdge.gap, 0.1)) {
			parent.style[`padding${capitalizeFirstLetter(left)}` as unknown as number] = '0px';
			parent.style[`padding${capitalizeFirstLetter(right)}` as unknown as number] = '0px';
			parent.style.justifyContent = 'center';
			
			if (close(parentInfo[gapBetween]!, parentInfo[aroundSpace], 0.1)) {
				parent.style.justifyContent = 'space-around';
				parent.style.gap = '0px';
			} else if (close(parentInfo[gapBetween]!, parentInfo[evenlySpace], 0.1)) {
				parent.style.justifyContent = 'space-evenly';
				parent.style.gap = '0px';
			} else if (close(parentInfo[gapBetween]!, parentInfo[betweenSpace], 0.1)) {
				parent.style.justifyContent = 'space-between';
				parent.style.gap = '0px';
			}
		}

		const childrenFixed = Array.from(parent.children).every(child => !isElementFluid(child, height));

		//Align items stuff
		if (parentInfo.edges.top.parentEdge.gap > 0 && parentInfo.edges.bottom.parentEdge.gap > 0 && childrenFixed) {
			if (parentInfo.childEdgeInfo.every(info => info[top].elementLocationRelative === info[top].parentMidpointRelative)) {
				parent.style[`padding${capitalizeFirstLetter(top)}` as unknown as number] = '0px';
				parent.style[`padding${capitalizeFirstLetter(bottom)}` as unknown as number] = '0px';
				parent.style.alignItems = 'center';
			}

			if (startYSide === top) {
				parent.style[`padding${capitalizeFirstLetter(bottom)}` as unknown as number] = '0px';
			}
			else if (startYSide === bottom) {
				parent.style.alignItems = 'flex-end';
				parent.style[`padding${capitalizeFirstLetter(top)}` as unknown as number] = '0px';
			}
		}

		if (startXSide === right) {
			parent.style.justifyContent = 'flex-end';
		}
	},
	onCalculateSnapping(element, posX, posY, dx, dy) {
		const parent = element.parentElement!;
		const style = getComputedStyle(parent);
		const axis = style.flexDirection !== 'column' ? 'x' : 'y';
		const otherAxis = axis === 'x' ? 'y' : 'x';
		const pos = axis === 'x' ? posX : posY;
		
		const parentInfo = calculateFlexParentEdgeInfo(parent, 1, false, 'x');
		const selfIndex = Array.from(parent.children).indexOf(element);
		const isMoving = selfIndex > 0 && selfIndex < parentInfo.childrenCount - 1;
		const minGap = getMinGapForElement(element);
		const gapDiff = parentInfo.minGapBetweenX - minGap;//(parentInfo.minGapBetweenX - minGap) * (parent.children.length - 1);
		
		const direction = selfIndex === 0 ? -1 : 1;
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
			const centerXDiff = parentInfo[midpoint] - parentInfo[childrenMidpoint];
			const center = snapping.addSnapToParent({
				point: pos + centerXDiff,
				axis,
				range: 10
			});
			center.addCenterAxisGuide({axis: otherAxis})
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

			if (parentInfo[gapBetween] && close(parentInfo[childrenMidpoint], parentInfo[midpoint], 0.1)) {

				const spaceEvenlyDiff = parentInfo[evenlySpace] - parentInfo[gapBetween]!;
				const spaceEvenly = snapping.addSnapToParent({
					point: pos + spaceEvenlyDiff * direction,
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
				for (let i = 0; i < parent.children.length - 1; i++) {
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
				for (let i = 0; i < parent.children.length - 1; i++) {
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
				for (let i = 0; i < parent.children.length - 1; i++) {
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
		// const style = getComputedStyle(element.parentElement!);

		// const resX = style.flexDirection === 'column' ? createSnapGuidesFlexOtherAxis(element, x, currentX * scale, 'x', scale) : createSnapGuidesFlex(element, x, currentX * scale, 'x', scale);
		// const resY = style.flexDirection === 'column' ? createSnapGuidesFlex(element, y, currentY * scale, 'y', scale) : createSnapGuidesFlexOtherAxis(element, y, currentY * scale, 'y', scale);

        // if (resX) {
        //     resX.x = resX.y;
        //     resX.snapGuides = resX.snapGuides.map(guide => ({...guide, point: {...guide.point, x: guide.point.y}}))
        // }
	
		// return {resultsX: resX ? [resX] : [], resultsY: resY ? [resY] : []};
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
		const minGap = getMinGapForElement(element);

		
		const selfIndex = Array.from(parent.children).indexOf(element);
        const parentInfo = calculateParentEdgeInfo(parent, 1, false, 'x');
		const parentRect = {
			left: parentInfo.edges.left.parentEdge.edgeLocation,
			right: parentInfo.edges.right.parentEdge.edgeLocation,
			top: parentInfo.edges.top.parentEdge.edgeLocation,
			bottom: parentInfo.edges.bottom.parentEdge.edgeLocation,
		}
		
		if (selfIndex > 0 && selfIndex < parent.children.length - 1) {
			if (parentInfo.edges[right].parentEdge.gap > 0)
			parentRect[left] = parentInfo.childEdgeInfo[selfIndex][left].elementLocation - parentInfo.edges[left].parentEdge.gap;
			
			if (parentInfo.edges[left].parentEdge.gap > 0)
			parentRect[right] = parentInfo.childEdgeInfo[selfIndex][right].elementLocation + parentInfo.edges[right].parentEdge.gap;
		}
		
		if (selfIndex === 0) {
			// if (parentInfo.edges[right].parentEdge.gap < parentInfo.edges[left].parentEdge.gap) {
			// 	parentRect[left] += parentInfo.edges[left].parentEdge.gap - parentInfo.edges[right].parentEdge.gap;
			// }

			parentRect[right] = parentInfo.childEdgeInfo[selfIndex][right].elementLocation + (parentInfo[minGapBetween] - minGap) * (parent.children.length - 1) + parentInfo.edges[right].parentEdge.gap;
		}

		if (selfIndex === parent.children.length - 1) {
			// if (parentInfo.edges[left].parentEdge.gap < parentInfo.edges[right].parentEdge.gap) {
			// 	parentRect[right] -= parentInfo.edges[right].parentEdge.gap - parentInfo.edges[left].parentEdge.gap;
			// }

			parentRect[left] = parentInfo.childEdgeInfo[selfIndex][left].elementLocation - (parentInfo[minGapBetween] - minGap) * (parent.children.length - 1) - parentInfo.edges[left].parentEdge.gap;
		}

		return [parentRect];
    }
}

type SnappableProps = Pick<DraggableProps, 'element' | 'onIsDragging' | 'scale'> & {
	onDragFinish: (element: HTMLElement, oldValues: Record<string, string>) => void;
	onError: () => void;
};
export const useSnapping = ({element, onIsDragging, onDragFinish, onError, scale}: SnappableProps) => {
	const [oldValues, setOldValues] = useState<Record<string, string>>({marginLeft: '', marginRight: '', marginTop: '', marginBottom: '', display: ''});
	const resX = useRef(0);
	const resY = useRef(0);
	
	let snappingBehavior = elementSnapBehavior;
	if (element && getComputedStyle(element.parentElement!).display.includes('flex')) {
		snappingBehavior = flexSnapping;
	}

    const restrictions = element ? snappingBehavior.getRestrictions(element, scale) : [];

    function normalizeSnappingResults({x, y, resultsX, resultsY}: {x: number, y: number, resultsX: SnappingResult[], resultsY: SnappingResult[]}) {
        const parent = element!.parentElement!;
        let result: SnappingResult | undefined;

		
		console.log(`snap: ${resultsX[0]?.x}`)
        
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
        }, []).filter(res => Math.abs(res.y! - y) < 10).sort((a, b) => a.x! - b.x!)[0];
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
		if (element) {
			const values = snappingBehavior.getOldValues(element);
			setOldValues(values);
		}
	}, [element]);

	const result = useDraggable({element, onIsDragging(event) {
		snappingBehavior.onUpdate(element!, event, scale, false);

		onIsDragging && onIsDragging(event);
		// resX.current = event.eventRect.left - getBoundingClientRect(element!.parentElement!, 'x', 'close', 1);
		// resY.current = event.eventRect.top - getBoundingClientRect(element!.parentElement!, 'y', 'close', 1);
		
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
		onDragFinish && onDragFinish(snappingBehavior.onFinish(element), oldValues);
	}, canDrag(element) {
		if (element.contentEditable === 'true') return false;

		if (!snappingBehavior.isDraggable(element)) {
			onError();
			return false;
		}

		return true;
	}, restrictions, restrictToParent: true, scale});

	const {isResizing} = useResizable({element, scale, restrictions: [], onIsResizing(event) {
        if (!element) return;

        snappingBehavior.onUpdate(element, event, scale, true);
        if (!isElementFluid(element, 'width')) {
            element.style.width = `${event.rect.width}px`
        }
        if (!isElementFluid(element, 'height')) {
            element.style.height = `${event.rect.height}px`
        }
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
    },});

	return {isDragging: result.isDragging || isResizing, isResizing};
}

function createSnapGuidesElement(element: HTMLElement, pos: number, current: number, type: Axis, scale: number): SnappingResult | undefined {
	const parent = element.parentElement!;
	const _scale = 1;
	const {gapStart, gapEnd, parentMidpoint, elementMidpoint} = calculateElementInfo(element, type, _scale);
	
	const _ = getBoundingClientRect(element, type, 'close', _scale) - getBoundingClientRect(parent, type, 'close', _scale);
	const posY = _;
	const dy = pos + getBoundingClientRect(parent, type, 'close', _scale) - current;

	//Only show snap points if there is space to move
	if (gapEnd === 0 && gapStart === 0) return;

	const selfIndex = Array.from(parent.children).indexOf(element);
	//const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= minGap;
	const direction = selfIndex === 0 ? -1 : 1;
	const threshold = 5;
	const range = 10;

	const centerDiff = parentMidpoint - elementMidpoint;
	if (Math.abs(centerDiff) <= threshold) {
		const firstChild = parent.children[0] as HTMLElement;
		
		const x = (posY + centerDiff)
		const snapPoints: SnapPoint[] = [{
			point: {[type]: x, range},
			offset: parent,
			guides: [
				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
			]
		},]
		return {[type]: posY + centerDiff, range, snapGuides: snapPoints};
	}

	if (Math.abs(gapEnd) <= threshold) {
		let snapGuides: SnapPoint[] = [];
		return {[type]: posY + gapEnd, range, snapGuides};
	}

	
	if (Math.abs(gapStart) <= threshold) {
		let snapGuides: SnapPoint[] = [];
		return {[type]: posY - gapStart, range, snapGuides};
	} 

	return undefined;
}


// function createSnapGuidesFlex(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', scale: number): SnappingResult | undefined {
// 	const parent = element.parentElement!;
// 	const _scale = 1;
// 	const {childrenMidpoint, parentMidpoint, gapEnd, gapStart, gapBetween, evenlySpace, aroundSpace, betweenSpace, centerSpace} = calculateFlexInfo(parent, type, scale);
// 	const {evenlySpace: evenlyText, aroundSpace: aroundText, betweenSpace: betweenText, gapBetween: gapBetweenText} = calculateFlexInfo(parent, type, scale);

// 	const _ = getBoundingClientRect(element, type, 'close', _scale) - getBoundingClientRect(parent, type, 'close', _scale);
// 	const posY = _;
// 	const dy = pos + getBoundingClientRect(parent, type, 'close', _scale) - current;

// 	const selfIndex = Array.from(parent.children).indexOf(element);
// 	const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= minGap;
// 	const direction = selfIndex === 0 ? -1 : 1;
// 	const threshold = 5;
// 	const range = 10;

// 	const centerDiff = parentMidpoint - childrenMidpoint;
// 	if (Math.abs(centerDiff) <= threshold && isMoving) {
// 		const firstChild = parent.children[0] as HTMLElement;
// 		const lastChild = parent.children[parent.children.length - 1] as HTMLElement || firstChild;

// 		const snapGuides: SnapPoint[] = [{
// 			point: {y: posY + centerDiff, range},
// 			offset: parent,
// 			guides: [
// 				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
// 			]
// 		},]
// 		return {y: posY + centerDiff, range, snapGuides};
// 	}

// 	const evenlyDiff = evenlySpace - gapBetween;
// 	if (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(evenlyDiff) <= threshold) {
// 		const guides: SnapPoint['guides'] = [];
// 		for (let i = 0; i < parent.children.length; i++) {
// 			const child = parent.children[i] as HTMLElement;
// 			if (i === parent.children.length - 1) {
// 				const marginBottom = getExtra(child, type, 'far')
// 				guides.push({rotate: type === 'x', y0: 1, x0: .5, y1: evenlySpace + child.clientHeight + marginBottom, x1: .5, text: evenlyText, relative: ['x0', 'x1', 'y0'], offset: child})
// 			}

// 			const marginTop = getExtra(child, type, 'close');
// 			guides.push({rotate: type === 'x', y0: -(evenlySpace + marginTop), x0: .5, y1: 0, x1: .5, text: evenlyText, relative: ['x0', 'x1'], offset: child})
// 		}
// 		const snapGuides: SnapPoint[] = [{
// 			point: {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range},
// 			offset: parent,
// 			guides
// 		},];
// 		return {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range, snapGuides}
// 	}

// 	const aroundDiff = aroundSpace - gapBetween;
// 	if (false || (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(aroundDiff) <= threshold)) {
// 		const guides: SnapPoint['guides'] = [];
// 		const newPos = posY + aroundDiff * direction * (parent.children.length - 1) / 2;
// 		for (let i = 0; i < parent.children.length; i++) {
// 			const child = parent.children[i] as HTMLElement;
// 			if (i === parent.children.length - 1) {
// 				const marginBottom = getExtra(child, type, 'far')
// 				guides.push({rotate: type === 'x', y0: 1, x0: .5, y1: aroundSpace / 2 + child.clientHeight + marginBottom, x1: .5, text: aroundText / (2), relative: ['x0', 'x1', 'y0'], offset: child})
// 			}

// 			const marginTop = getExtra(child, type, 'close');
// 			const amount = i === 0 ? aroundSpace / 2 : aroundSpace;
// 			const amountText = i === 0 ? aroundText / 2 : aroundText;
// 			guides.push({rotate: type === 'x', y0: -(amount + marginTop), x0: .5, y1: 0, x1: .5, text: amountText, relative: ['x0', 'x1'], offset: child})
// 		}
// 		const snapGuides: SnapPoint[] = [{
// 			point: {y: newPos, range},
// 			offset: parent,
// 			guides
// 		},]
// 		return {y: newPos, range, snapGuides}
// 	}

// 	const betweenDiff = betweenSpace - gapBetween;
// 	if (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(betweenDiff) <= threshold) {
// 		const guides: SnapPoint['guides'] = [];
// 		for (let i = 1; i < parent.children.length; i++) {
// 			const child = parent.children[i] as HTMLElement;
// 			const marginTop = getExtra(child, type, 'close');
// 			guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
// 		}
// 		const snapGuides: SnapPoint[] = [{
// 			point: {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range},
// 			offset: parent,
// 			guides
// 		},]
// 		return {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range, snapGuides}
// 	}

// 	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
// 		let snapGuides: SnapPoint[] = [];
// 		if (gapStart === 0) {
// 			const guides: SnapPoint['guides'] = [];
// 			for (let i = 1; i < parent.children.length; i++) {
// 				const child = parent.children[i] as HTMLElement;
// 				const marginTop = getExtra(child, type, 'close');
// 				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
// 			}
// 			snapGuides = [{
// 				point: {y: posY + betweenDiff * direction, range},
// 				offset: parent,
// 				guides
// 			},]
// 		}
// 		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapGuides};
// 	}

	
// 	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
// 		let snapGuides: SnapPoint[] = [];
// 		if (gapEnd === 0) {
// 			const guides: SnapPoint['guides'] = [];
// 			for (let i = 1; i < parent.children.length; i++) {
// 				const child = parent.children[i] as HTMLElement;
// 				const marginTop = getExtra(child, type, 'close');
// 				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
// 			}
// 			snapGuides = [{
// 				point: {y: posY + betweenDiff * direction, range},
// 				offset: parent,
// 				guides
// 			},]
// 		}
// 		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapGuides};
// 	}

// 	// const gapDiff = minGap - gapBetween;
// 	// if (Math.abs(gapDiff) <= 10 && (!isMoving)) {
// 	// 	console.log(posY + gapDiff * direction);
// 	// 	return {y: posY + (gapDiff * direction * (parent.children.length - 1)), range, snapPoints: []};
// 	// }

// 	return undefined;
// }

// function createSnapGuidesFlexOtherAxis(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', _scale: number): SnappingResult | undefined {
// 	const parent = element.parentElement!;
// 	const {childrenMidpoint, parentMidpoint, gapEnd, gapStart, gapBetween, evenlySpace, aroundSpace, betweenSpace, centerSpace} = calculateFlexInfo(parent, type, 1);
	
// 	//Only show snap points if there is space to move
// 	if (gapEnd === 0 && gapStart === 0) return;
	
// 	const _ = getBoundingClientRect(element, type, 'close', 1) - getBoundingClientRect(parent, type, 'close', 1);
// 	const posY = _;
// 	const dy = pos + getBoundingClientRect(parent, type, 'close', 1) - current;

// 	const selfIndex = Array.from(parent.children).indexOf(element);
// 	const isMoving = selfIndex > 0 && selfIndex < parent.children.length - 1 || gapBetween <= minGap;
// 	const direction = selfIndex === 0 ? -1 : 1;
// 	const threshold = 10;
// 	const range = 15;

// 	const centerDiff = parentMidpoint - childrenMidpoint;
// 	if (Math.abs(centerDiff) <= threshold && isMoving) {
// 		const firstChild = parent.children[0] as HTMLElement;
// 		const lastChild = parent.children[parent.children.length - 1] as HTMLElement || firstChild;

// 		const snapGuides: SnapPoint[] = [{
// 			point: {y: posY + centerDiff, range},
// 			offset: parent,
// 			guides: [
// 				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
// 			]
// 		},]
// 		return {y: posY + centerDiff, range, snapGuides};
// 	}

// 	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
// 		let snapGuides: SnapPoint[] = [];
// 		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapGuides};
// 	}

	
// 	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
// 		let snapGuides: SnapPoint[] = [];
// 		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapGuides};
// 	}

// 	return undefined;
// }

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
	rect: Rect,
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
	onIsDragging?: (event: DraggingEvent) => void;
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
    const $parent = $('#harmony-snap-guides');

	useEffect(() => {
		if (element) {
			refY.current = getBoundingClientRect(element, 'y', 'close', scale)
			refX.current = getBoundingClientRect(element, 'x', 'close', scale);
			setOffsetX(refX.current);
			setOffsetY(refY.current);

			const modifiers: Modifier[] = [
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
					offset: 'parent'//{x: element.parentElement!.getBoundingClientRect().x / scale, y: element.parentElement!.getBoundingClientRect().y / scale}
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

	const startDragging = useEffectEvent((event: InteractEvent<'drag', 'start'>) => {
        
	});

	const handleTheDragging = (event: DraggingEvent) => {
		if (!element) return;
		!isDragging && setIsDragging(true);
        
		refY.current = event.rect.top;
		refX.current = event.rect.left;
		onIsDragging && onIsDragging(event);

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

		handleTheDragging({dx: event.dx, dy: event.dy, rect: rect, eventRect: event.rect});
	});
	
	const stopDragging = useEffectEvent((e: InteractEvent<'drag', 'move'>) => {
		setIsDragging(false);
		if (!element) return;
		$parent.children().remove();
		onDragFinish && onDragFinish(element);
	});

	return {isDragging};
}

//TODO: Refactor out duplicate code into useSnappable hook
interface ResizableProps {
    element: HTMLElement | undefined;
    scale: number;
    restrictions: RectBox[],
    onIsResizing?: (event: DraggingEvent) => void;
    onResizeFinish?: (element: HTMLElement) => void;
    onCalculateSnapping?: (element: HTMLElement, x: number, y: number, currentX: number, currentY: number) => SnappingResult | undefined;
}
export const useResizable = ({element, scale, restrictions, onIsResizing, onResizeFinish, onCalculateSnapping}: ResizableProps) => {
    const [isResizing, setIsResizing] = useState(false);
    const snapGuides = useRef<SnapPoint[]>([]);
    const refX = useRef(0);
	const refY = useRef(0);
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
					offset: 'parent'//{x: element.parentElement!.getBoundingClientRect().x / scale, y: element.parentElement!.getBoundingClientRect().y / scale}
				}),
			];
			if (false) {
				modifiers.push(interact.modifiers.restrictRect({restriction: 'parent'}));
			}

            for (const restriction of restrictions) {
                modifiers.push(interact.modifiers.restrict({
                    restriction,
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                }))
            }
			interact(element).resizable({
                edges: {left: true, bottom: true, right: true, top: true},
				listeners: {
					start: startResizing,
					move: resize,
					end: stopResizing
				},
				modifiers,
				margin: 4
			})
		}
	}, [element, scale]);

    const handleTheResizing = (event: DraggingEvent) => {
        if (!element) return;
		!isResizing && setIsResizing(true);
        
		refY.current = event.rect.top;
		refX.current = event.rect.left;
		onIsResizing && onIsResizing(event);

		$parent.children().remove();
		handleGuides(event.eventRect, snapGuides.current, scale);
    }

    const startResizing = (event: InteractEvent<'resize', 'start'>) => {

    }

    const resize = (event: ResizeEvent<'move'>) => {
        if (!element) return;

        if (!event.deltaRect) {
            throw new Error("Let's figure out why delta rect doesn't exist");
        }

        const rect = getOffsetRect(element);
        rect.left += round(event.deltaRect.left / scale);
        rect.right += round(event.deltaRect.right / scale);
        rect.top += round(event.deltaRect.top / scale);
        rect.bottom += round(event.deltaRect.bottom / scale);
        rect.width += round(event.deltaRect.width / scale);
        rect.height += round(event.deltaRect.height / scale);
        
        handleTheResizing({dx: event.dx, dy: event.dy, rect: rect, eventRect: event.rect});
    }

    const stopResizing = (event: InteractEvent<'resize', 'end'>) => {
        setIsResizing(false);
        if (!element) return;
		$parent.children().remove();
		onResizeFinish && onResizeFinish(element);
    }

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