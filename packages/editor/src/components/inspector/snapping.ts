import { CapitalizeFirstLetter as capitalizeFirstLetter, groupBy, groupByDistinct, round } from "@harmony/util/src";
import interact from "interactjs";
import { useState, useEffect, useRef } from "react";
import { Rect, selectDesignerElement } from "./inspector";
import { useEffectEvent } from "../../../../ui/src/hooks/effect-event";
import {InteractEvent, Point} from '@interactjs/types'
import {Modifier} from '@interactjs/modifiers/types'
import {SnapPosition} from '@interactjs/modifiers/snap/pointer'
import $ from 'jquery';

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
	const upper = capitalizeFirstLetter(type);
	return parseFloat($(element).css(`margin${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
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
        width: element.clientWidth,
        height: element.clientHeight
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
    edges: {
        left: ElementEdgeInfo,
        right: ElementEdgeInfo,
        top: ElementEdgeInfo,
        bottom: ElementEdgeInfo
    }
}

function calculateParentEdgeInfo(parent: HTMLElement, scale: number, useRectOffset: boolean, updates: UpdateRect[]=[]): ParentEdgeInfo {
    const childEdgeInfo: ChildEdgeInfo[] = [];

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
        childEdgeInfo.push(calculateEdgesInfo(child as HTMLElement, scale, updates));
    }

    const copy = childEdgeInfo.slice();
    const left = copy.sort((a, b) => a.left.parentEdge.gap - b.left.parentEdge.gap)[0].left;
    const right = copy.sort((a, b) => a.right.parentEdge.gap - b.right.parentEdge.gap)[0].right;
    const top = copy.sort((a, b) => a.top.parentEdge.gap - b.top.parentEdge.gap)[0].top;
    const bottom = copy.sort((a, b) => a.bottom.parentEdge.gap - b.bottom.parentEdge.gap)[0].bottom;

    const midpointX = (getBoundingClientRectParent(parent, 'x', 'close', scale) + getBoundingClientRectParent(parent, 'x', 'size', scale) / 2);
	const midpointY = (getBoundingClientRectParent(parent, 'y', 'close', scale) + getBoundingClientRectParent(parent, 'y', 'size', scale) / 2);
	const midpointXRelative = midpointX - getBoundingClientRectParent(parent, 'x', 'close', scale)
    const midpointYRelative = midpointY - getBoundingClientRectParent(parent, 'y', 'close', scale)
    return {
        childEdgeInfo,
        midpointX,
        midpointY,
        midpointXRelative,
        midpointYRelative,
        edges: {
            left, 
            right,
            top,
            bottom
        }
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
    const {edges, childEdgeInfo} = calculateParentEdgeInfo(parent, scale, true, [parentUpdate, ...childrenUpdates]);
    Object.entries(edges).forEach(([side, edge]) => {
        const gap = edge.parentEdge.gap;
        parent.style[`padding${capitalizeFirstLetter(side)}` as unknown as number] = `${gap}px`;
    });

    for (const info of childEdgeInfo) {
        const leftGap = info.left.parentEdge.gap - edges.left.parentEdge.gap;
        if (info.left.parentEdge.gap >= 0 && info.right.parentEdge.gap >= 0 && Math.abs(edges.left.parentEdge.gap - 0.1) >= 0) {
            info.element.style.marginLeft = `${leftGap}px`;
        }
        if (info.index > 0 && info.top.siblingEdge && Math.abs(info.top.siblingEdge.gap - 0.1) >= 0) {
            info.element.style.marginTop = `${info.top.siblingEdge.gap}px`
        } 
    }
}

function calculateEdgesInfo(element: HTMLElement, scale: number, updates: UpdateRect[]=[]): ChildEdgeInfo {
    const parent = element.parentElement!;
    const left = calculateAxisEdgeInfo(element, 'x', 'close', scale, updates);
    const right = calculateAxisEdgeInfo(element, 'x', 'far', scale, updates);
    const top = calculateAxisEdgeInfo(element, 'y', 'close', scale, updates);
    const bottom = calculateAxisEdgeInfo(element, 'y', 'far', scale, updates);
    // const {close: left, far: right} = calculateAxisEdgeInfo(element, 'x', 'close', scale, updates);
    // const {close: top, far: bottom} = calculateAxisEdgeInfo(element, 'y', 'close', scale, updates);
    const midpointX = (getBoundingClientRect(element, 'x', 'close', scale) + getBoundingClientRect(element, 'x', 'size', scale) / 2) - getBoundingClientRectParent(parent, 'x', 'close', scale);
    const midpointY = (getBoundingClientRect(element, 'y', 'close', scale) + getBoundingClientRect(element, 'y', 'size', scale) / 2) - getBoundingClientRectParent(parent, 'y', 'close', scale);
    
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

    const parentMidpoint = (getBoundingClientRectParent(parent, axis, 'close', scale) + getBoundingClientRectParent(parent, axis, 'size', scale) / 2) + (side === 'close' ? -1 : 1) * getBoundingClientRect(element, axis, 'size', scale) / 2;
    const parentMidpointRelative = parentMidpoint - getBoundingClientRectParent(parent, axis, 'close', scale);;
	const elementLocation = getBoundingClientRect(element, axis, side, scale, getRectOverride(element));
    const elementLocationRelative = elementLocation - getBoundingClientRectParent(parent, axis, 'close', scale, getRectOverride(parent))
    return {parentEdge, siblingEdge, elementLocation, elementLocationRelative, parentMidpoint, parentMidpointRelative, element}
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

const minGap = 8;

function setFlexDragPosition(element: HTMLElement, props: DraggingEvent, axis: Axis, scale: number) {
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

function Snapping({parent, element, parentEdgeInfo, resultsX, resultsY}: {parent: HTMLElement, element: HTMLElement, parentEdgeInfo: ParentEdgeInfo, resultsX: SnappingResult[], resultsY: SnappingResult[]}) {
    const range = 10;
    const addSnapToParent = ({point, axis, from, snapSide}: {point: number, axis: Axis, from?: RectSide, snapSide?: RectSide}) => {
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

        return {
            addGuide(props: AddGuide) {
                const result = createGuide(props);
                newResult.snapGuides.push(result);
            },
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
	onIsDragging: (element: HTMLElement, event: DraggingEvent, scale: number) => void;
	onCalculateSnapping: (element: HTMLElement, x: number, y: number, currentX: number, currentY: number, scale: number) => {resultsX: SnappingResult[], resultsY: SnappingResult[]};
	onDragFinish: (element: HTMLElement) => HTMLElement;
    getRestrictions: (element: HTMLElement, scale: number) => {left: number, right: number, bottom: number, top: number}[];
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
	onIsDragging(element, event, scale) {
        if (!element.parentElement) {
            throw new Error("Element does not have a parent");
        }

        const childrenUpdates: UpdateRect[] = [{
            element,
            rect: event.rect
        }];
        // for (const child of Array.from(element.parentElement.children)) {
        //     if (child === element) {
        //         childrenUpdates.push({element: child as HTMLElement, rect: event.rect})
        //     } else {
        //         childrenUpdates.push({element: child as HTMLElement, rect: getOffsetRect(child as HTMLElement)})
        //     }
        // }
        // if (element.nextElementSibling) {
        //     childrenUpdates.push({element: element.nextElementSibling as HTMLElement, rect: getOffsetRect(element.nextElementSibling)});
        // }
        updateRects({
            parentUpdate: {
                element: element.parentElement,
                rect: getOffsetRect(element.parentElement)
            },
            childrenUpdates
        }, scale);
	},
	onCalculateSnapping(element, x, y, currentX, currentY, scale) {
        const parent = element.parentElement!;
        const parentEdgeInfo = calculateParentEdgeInfo(parent, 1, false);
        const parentEdgeInfoScaled = calculateParentEdgeInfo(parent, 1, true);
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
                const result = snapping.addSnapToParent({point, axis, from: side, snapSide: side});
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

		// const resX = createSnapGuidesElement(element, x, currentX, 'x', scale);
		// const resY = createSnapGuidesElement(element, y, currentY, 'y', scale);
		// let result: SnappingResult | undefined;

		// if (resX) {
		// 	result = {snapGuides: []};
		// 	result.x = resX.x;
		// 	result.range = resX.range;
		// 	result.snapGuides.push(...resX.snapGuides.map(guide => ({...guide, point: {
		// 		x: (guide.point.x as number) / scale + (getBoundingClientRect(element!.parentElement!, 'x', 'close', scale) as number),
		// 		y: 0
		// 	}})));
		// }

		// if (resY) {
		// 	result = result || {snapGuides: []};
		// 	result.y = resY.y;
		// 	result.range = resY.range;
		// 	result.snapGuides.push(...resY.snapGuides.map(guide => ({...guide, point: {
		// 		y: (guide.point.y as number) / scale + (getBoundingClientRect(element!.parentElement!, 'y', 'close', scale) as number),
		// 		x: 0
		// 	}})));
		// }

		// return result;
	},
	onDragFinish(element) {
		return element;
	},
    getRestrictions(element, scale) {
        const edgeInfo = calculateEdgesInfo(element, 1);
        
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
		const flexElement = parentStyle?.display.includes('flex') && Array.from(element?.parentElement?.children || []).every(child => parentStyle.flexDirection === 'column' ? child.clientWidth === element?.clientWidth : child.clientHeight === element?.clientHeight) ? element: undefined
		return flexElement ? true : false;
	},
	onIsDragging(element, event, scale) {
		const style = getComputedStyle(element!.parentElement!);

		if (style.flexDirection === 'column') {
			setFlexDragPosition(element!, event, 'y', scale);
			setFlexDragPositionOtherAxis(element!, event, 'x', scale);
		} else {
			setFlexDragPosition(element!, event, 'x', scale);
			setFlexDragPositionOtherAxis(element!, event, 'y', scale);
		}
	},
	onCalculateSnapping(element, x, y, currentX, currentY, scale) {
		const style = getComputedStyle(element.parentElement!);

		const resX = style.flexDirection === 'column' ? createSnapGuidesFlexOtherAxis(element, x, currentX * scale, 'x', scale) : createSnapGuidesFlex(element, x, currentX * scale, 'x', scale);
		const resY = style.flexDirection === 'column' ? createSnapGuidesFlex(element, y, currentY * scale, 'y', scale) : createSnapGuidesFlexOtherAxis(element, y, currentY * scale, 'y', scale);

        if (resX) {
            resX.x = resX.y;
            resX.snapGuides = resX.snapGuides.map(guide => ({...guide, point: {...guide.point, x: guide.point.y}}))
        }
		//let result: SnappingResult | undefined;

		// if (resX) {
		// 	result = {snapGuides: []};
		// 	result.x = resX.y;
		// 	result.range = resX.range;
		// 	result.snapGuides.push(...resX.snapPoints.map(guide => ({...guide, point: {
		// 		x: (guide.point.y as number) / scale + (getBoundingClientRect(element!.parentElement!, 'x', 'close', scale) as number),
		// 		y: 0
		// 	}})));
		// }

		// if (resY) {
		// 	result = result || {snapGuides: []};
		// 	result.y = resY.y;
		// 	result.range = resY.range;
		// 	result.snapGuides.push(...resY.snapPoints.map(guide => ({...guide, point: {
		// 		y: (guide.point.y as number) / scale + (getBoundingClientRect(element!.parentElement!, 'y', 'close', scale) as number),
		// 		x: 0
		// 	}})));
		// }

		return {resultsX: resX ? [resX] : [], resultsY: resY ? [resY] : []};
	},
	onDragFinish(element) {
		return element.parentElement!;
	},
    getRestrictions() {
        return [];
    }
}

type SnappableProps = Pick<DraggableProps, 'element' | 'onIsDragging' | 'scale'> & {
	onDragFinish: (element: HTMLElement, oldValues: Record<string, string>) => void;
	onError: () => void;
};
export const useSnapping = ({element, onIsDragging, onDragFinish, onError, scale}: SnappableProps) => {
	const [oldValues, setOldValues] = useState<Record<string, string>>({marginLeft: '', marginRight: '', marginTop: '', marginBottom: '', display: ''});
	let snappingBehavior = elementSnapBehavior;
	if (element && getComputedStyle(element.parentElement!).display.includes('flex')) {
		snappingBehavior = flexSnapping;
	}

    const restrictions = element ? snappingBehavior.getRestrictions(element, scale) : [];

	useEffect(() => {
		if (element) {
			const values = snappingBehavior.getOldValues(element);
			setOldValues(values);
		}
	}, [element]);

	const result = useDraggable({element, onIsDragging(event) {
		snappingBehavior.onIsDragging(element!, event, scale);

		onIsDragging && onIsDragging(event);
	}, onCalculateSnapping(element, x, y, currentX, currentY) {
        const parent = element.parentElement!;
		const {resultsX, resultsY} = snappingBehavior.onCalculateSnapping(element, x,y, currentX, currentY, scale);

        let result: SnappingResult | undefined;
        
        const resX = resultsX.reduce<SnappingResult[]>((prev, curr) => {
            const same = prev.find(p => p.x === curr.x);
            if (same) {
                same.snapGuides.push(...curr.snapGuides);
            } else {
                prev.push(curr);
            }

            return prev;
        }, []).filter(res => Math.abs(res.x! - x) < 10)[0]//.sort((a, b) => Math.abs(a.x! - x) - Math.abs(b.x! - x))[0];
        const resY = resultsY.reduce<SnappingResult[]>((prev, curr) => {
            const same = prev.find(p => p.y === curr.y);
            if (same) {
                same.snapGuides.push(...curr.snapGuides);
            } else {
                prev.push(curr);
            }

            return prev;
        }, []).filter(res => Math.abs(res.y! - y) < 10)[0]//.sort((a, b) => Math.abs(a.y! - y) - Math.abs(b.y! - y))[0];
        if (resX) {
			result = {snapGuides: []};
            //Our edge calculations are relative to no border, but interact.js is relative to a border, so get rid of
            //the border in the snap calculation
			result.x = resX.x! + parseFloat($(parent).css('borderLeft') || '0');
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
	}, onDragFinish(element) {
		onDragFinish && onDragFinish(snappingBehavior.onDragFinish(element), oldValues);
	}, canDrag(element) {
		if (element.contentEditable === 'true') return false;

		if (!snappingBehavior.isDraggable(element)) {
			onError();
			return false;
		}

		return true;
	}, restrictions, restrictToParent: true, scale});

	// const onShift = useEffectEvent(() => {
	// 	console.log("Setting shift...");
	// 	setShiftPressed(true);
	// })

	// useEffect(() => {
	// 	hotkeys('shift+a', onShift)
	// }, []);

	return result;
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


function createSnapGuidesFlex(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', scale: number): SnappingResult | undefined {
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

		const snapGuides: SnapPoint[] = [{
			point: {y: posY + centerDiff, range},
			offset: parent,
			guides: [
				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
			]
		},]
		return {y: posY + centerDiff, range, snapGuides};
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
		const snapGuides: SnapPoint[] = [{
			point: {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range},
			offset: parent,
			guides
		},];
		return {y: posY + (evenlyDiff * direction * (parent.children.length - 1) / 2), range, snapGuides}
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
		const snapGuides: SnapPoint[] = [{
			point: {y: newPos, range},
			offset: parent,
			guides
		},]
		return {y: newPos, range, snapGuides}
	}

	const betweenDiff = betweenSpace - gapBetween;
	if (close(centerDiff, 0, 0.1) && !isMoving && Math.abs(betweenDiff) <= threshold) {
		const guides: SnapPoint['guides'] = [];
		for (let i = 1; i < parent.children.length; i++) {
			const child = parent.children[i] as HTMLElement;
			const marginTop = getExtra(child, type, 'close');
			guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
		}
		const snapGuides: SnapPoint[] = [{
			point: {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range},
			offset: parent,
			guides
		},]
		return {y: posY + betweenDiff * direction * (parent.children.length - 1) / 2, range, snapGuides}
	}

	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
		let snapGuides: SnapPoint[] = [];
		if (gapStart === 0) {
			const guides: SnapPoint['guides'] = [];
			for (let i = 1; i < parent.children.length; i++) {
				const child = parent.children[i] as HTMLElement;
				const marginTop = getExtra(child, type, 'close');
				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
			}
			snapGuides = [{
				point: {y: posY + betweenDiff * direction, range},
				offset: parent,
				guides
			},]
		}
		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapGuides};
	}

	
	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
		let snapGuides: SnapPoint[] = [];
		if (gapEnd === 0) {
			const guides: SnapPoint['guides'] = [];
			for (let i = 1; i < parent.children.length; i++) {
				const child = parent.children[i] as HTMLElement;
				const marginTop = getExtra(child, type, 'close');
				guides.push({rotate: type === 'x', y0: -(betweenSpace + marginTop), x0: .5, y1: 0, x1: .5, text: betweenText, relative: ['x0', 'x1'], offset: child})
			}
			snapGuides = [{
				point: {y: posY + betweenDiff * direction, range},
				offset: parent,
				guides
			},]
		}
		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapGuides};
	}

	// const gapDiff = minGap - gapBetween;
	// if (Math.abs(gapDiff) <= 10 && (!isMoving)) {
	// 	console.log(posY + gapDiff * direction);
	// 	return {y: posY + (gapDiff * direction * (parent.children.length - 1)), range, snapPoints: []};
	// }

	return undefined;
}

function createSnapGuidesFlexOtherAxis(element: HTMLElement, pos: number, current: number, type: 'x' | 'y', _scale: number): SnappingResult | undefined {
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

		const snapGuides: SnapPoint[] = [{
			point: {y: posY + centerDiff, range},
			offset: parent,
			guides: [
				{rotate: type === 'x', y0: .5, x0: 0, y1: .5, x1: 1, relative: ['x0', 'x1', 'y0', 'y1']}, 
			]
		},]
		return {y: posY + centerDiff, range, snapGuides};
	}

	if (Math.abs(gapEnd) <= threshold && (selfIndex === parent.children.length - 1 || isMoving)) {
		let snapGuides: SnapPoint[] = [];
		return {y: posY + gapEnd, range: dy > 0 ? undefined : 10, snapGuides};
	}

	
	if (Math.abs(gapStart) <= threshold && (selfIndex === 0 || isMoving)) {
		let snapGuides: SnapPoint[] = [];
		return {y: posY - gapStart, range: dy < 0 ? undefined : 10, snapGuides};
	}

	return undefined;
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
    restrictions: {left: number, right: number, top: number, bottom: number}[],
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
					//endOnly: true, // Only snap when dragging ends
				}));

                // const sibling = document.getElementById('child-1');
                // const rect = sibling!.getBoundingClientRect();
                // const sibling3 = document.getElementById('child-3');
                // const rect3 = sibling3!.getBoundingClientRect();
                // modifiers.push(interact.modifiers.restrict({
                //     restriction: {top: rect.bottom, left: -Infinity, bottom: rect3.top, right: Infinity},
                //     elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
                //     //elementRect: {top: 0, left: 0, bottom: 0, right: 0}
                // }))
			}

            for (const restriction of restrictions) {
                modifiers.push(interact.modifiers.restrict({
                    restriction,
                    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
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

	const handleGuides = useEffectEvent((rect: {left: number, right: number, top: number, bottom: number}, snapPoints: SnapPoint[]) => {
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

                    // if (typeof copy.text === 'number') {
                    //     copy.text /= scale;
                    // }

					createGuide(copy);
				});
			}

            const posX = rect.left;//rect[snapPoint.side || 'left']
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

                    // if (typeof copy.text === 'number') {
                    //     copy.text /= scale;
                    // }

					createGuide(copy);
				});
			}
		})
	})

	const startDragging = useEffectEvent((event: InteractEvent<'drag', 'start'>) => {
        //if (!element) return;
		// setOffsetX(event.clientX0);
		// setOffsetY(event.clientY0);
        //event.rect = getOffsetRect(element);
	});

	const handleTheDragging = (event: DraggingEvent) => {
		if (!element) return;
		!isDragging && setIsDragging(true);
        // event.rect.top /= scale;
		// event.rect.left /= scale;
		// event.rect.right /= scale;
		// event.rect.bottom /= scale;
		// event.rect.height /= scale;
		// event.rect.width /= scale;
		// event.dy /= scale;
		// event.dx /= scale;
		
		refY.current = event.rect.top;
		refX.current = event.rect.left;
		onIsDragging && onIsDragging(event);

		$parent.children().remove();
		handleGuides(event.eventRect, snapGuides.current);
		// handleGuides(event.rect.top, snapGuidesY.current, 'y');
		// handleGuides(event.rect.left, snapGuidesX.current, 'x');
	}
	  
	const drag = useEffectEvent((event: InteractEvent<'drag', 'move'>) => {
		//TODO: Remove dependency on selected
		if (!element || !canDrag(element)) return;
        const rect = getOffsetRect(element);
        rect.left += round(event.dx / scale);
        rect.right += round(event.dx / scale);
        rect.top += round(event.dy / scale);
        rect.bottom += round(event.dy / scale);

        console.log(`${scale}, ${event.dx / scale}, ${event.dy / scale}`)

		handleTheDragging({dx: event.dx, dy: event.dy, rect: rect, eventRect: event.rect});
	});
	
	const stopDragging = useEffectEvent((e: InteractEvent<'drag', 'move'>) => {
		setIsDragging(false);
		if (!element) return;
		// setOffsetX(refX.current);
		// setOffsetY(refY.current);
		$parent.children().remove();
		onDragFinish && onDragFinish(element);
	});

	return {isDragging};
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