import { capitalizeFirstLetter, close } from "@harmony/util/src/utils/common";
import { Rect, isImageElement, selectDesignerElementReverse } from "../inspector/inspector";
import { UpdateRect } from "./position-updator";
import { isSelectable } from "./snapping";
import $ from 'jquery';

export type Side = 'close' | 'far';
export type RectSide = 'bottom' | 'top' | 'left' | 'right';
export type Axis = 'x' | 'y';

function getElementHeight(element: HTMLElement): number {
	return $(element).outerHeight(true) || element.clientHeight;
}

type BoundingType = 'close' | 'far' | 'size' | 'size-full';

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

export const getMinGap = (parent: HTMLElement): number => {
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


const getExtraD = (element: HTMLElement, type: 'top' | 'bottom' | 'left' | 'right') => {
	const upper = capitalizeFirstLetter(type);
	return parseFloat($(element).css(`margin${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
}

export const getProperty = (element: HTMLElement, property: 'margin' | 'border' | 'padding', type: 'top' | 'bottom' | 'left' | 'right') => {
	const upper = capitalizeFirstLetter(type);
	return parseFloat($(element).css(`${property}${upper}`) || '0')// + parseFloat($(element).css(`border${upper}`) || '0');
}

export const getOffsetRect = (element: HTMLElement, includeBorder=true): Rect => {
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

export const getBoundingRect = (element: HTMLElement): Rect => {
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
export function getBoundingClientRect(element: HTMLElement, axis: Axis, type: BoundingType, scale: number, rectOverride?: Rect): number {
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

export function getBoundingClientRectParent(parent: HTMLElement, axis: Axis, type: BoundingType, scale: number, rectOverride?: Rect) {
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


export const setSpaceForElement = (element: HTMLElement, space: 'margin' | 'padding', side: RectSide, value: number | string) => {
	const propertyValue = typeof value === 'number' ? `${value}px` : value;
	element.style[`${space}${capitalizeFirstLetter(side)}` as unknown as number] = propertyValue;
}


export const getNonWorkableGap = (gapInfo: GapInfo[]): number => {
	return gapInfo.reduce((prev, curr) => curr.type === 'empty' ? prev + curr.value : prev, 0);
}

export const getSiblingGap = (gap: number, gapInfo: GapInfo[]): number => {
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

export const getSibling = (element: HTMLElement, children: HTMLElement[], side: RectSide, scale: number, rectOverride?: Rect) => {
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

export function getGapTypesToParent(element: HTMLElement, parent: HTMLElement, axis: Axis, side: Side, scale: number) {
	const otherSide = side === 'close' ? 'far' : 'close';
	const gap = side === 'close' ? getBoundingClientRect(element, axis, side, scale) - getBoundingClientRectParent(parent, axis, side, scale) : getBoundingClientRectParent(parent, axis, side, scale) - getBoundingClientRect(element, axis, side, scale); 
    return getGapTypes(element, parent, axis, side, ['margin', 'other-padding'], gap);
}

export function getGapTypesToSibiling(element: HTMLElement, sibling: HTMLElement, axis: Axis, side: Side, scale: number) {
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

function isElementFluid(elm: HTMLElement, side: 'width' | 'height', useFlexForHeight=true){
	const harmonyFixed = side === 'width' ? 'harmonyFixedWidth' : 'harmonyFixedHeight';
	//TODO: Hacky way to optimize
	// if (elm.dataset[harmonyFixed] === 'true') {
	// 	return false;
	// } else if (elm.dataset[harmonyFixed] === 'false') {
	// 	return true;
	// }

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
	  wrapper.style.position = 'absolute';
	  clone.style.top = '-9999px';
	  clone.style.left = '-9999px';
      wrapper.appendChild(clone);
      /// insert the element in the same location as our target
      elm.parentNode?.insertBefore(wrapper,elm);
	  const styles = getComputedStyle(clone);
	  if (styles.display === 'inline') {
		clone.style.display = 'block';
	  }
      /// store the clone's calculated width
      ow = clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'];
      /// change the wrapper size once more
      wrapper.style[side] = '600px';
      /// if the new width is the same as before, most likely a fixed width
      if( clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'] == ow ){
		clone.style.padding = padding;
		if (clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth'] != ow ) {
			elm.parentElement?.removeChild(wrapper);
			//elm.dataset[harmonyFixed] = 'false';
			return true;
		}

        /// tidy up
        elm.parentNode?.removeChild(wrapper);
		//elm.dataset[harmonyFixed] = 'true';
        return false;
      }
      /// otherwise, calculate the percentages each time - if they
      /// match then it's likely this is a fluid element
      else {
        p1 = Math.floor(100/500*ow);
        p2 = Math.floor(100/600*clone[`offset${capitalizeFirstLetter(side)}` as 'offsetWidth']);
        /// tidy up
        elm.parentNode?.removeChild(wrapper);
		const val = (p1 == p2) ? Math.round(p1)+'%' : false;
		// if (val) {
		// 	elm.dataset[harmonyFixed] = 'false';
		// } else {
		// 	elm.dataset[harmonyFixed] = 'true';
		// }
        return val;
      }
    }
    else {
      p1 = (value && String(value).indexOf('%') != -1);
	  const val = p1 ? value : false;
		// if (val) {
		// 	elm.dataset[harmonyFixed] = 'false';
		// } else {
		// 	elm.dataset[harmonyFixed] = 'true';
		// }
      return val;
    }
}

export function getFitContentSize(element: HTMLElement, keepPadding=false): {width: number, height: number} {
	if (!keepPadding) {
		//TODO: Find a better way to optimize
		// if (element.dataset.harmonyMinWidthPadding && element.dataset.harmonyMinHeightPadding && keepPadding) {
		// 	return {width: parseFloat(element.dataset.harmonyMinWidthPadding), height: parseFloat(element.dataset.harmonyMinHeightPadding)}
		// }
		// if (element.dataset.harmonyMinWidth && element.dataset.harmonyMinHeight && !keepPadding) {
		// 	return {width: parseFloat(element.dataset.harmonyMinWidth), height: parseFloat(element.dataset.harmonyMinHeight)}
		// }
		const clone = element.cloneNode(true) as HTMLElement;
		const styles = getComputedStyle(element);
		if (!keepPadding)
			clone.style.padding = '0';
		clone.style.maxWidth = 'none';
		clone.style.minWidth = 'none';
		clone.style.maxHeight = 'none';
		clone.style.minHeight = 'none';
		clone.style.height = 'auto';
		clone.style.width = 'auto';
		clone.style.fontSize = styles.fontSize;
		clone.style.fontFamily = styles.fontFamily;
		clone.style.lineHeight = styles.lineHeight;
		clone.style.letterSpacing = styles.letterSpacing;
		clone.style.fontWeight = styles.fontWeight;

		// Set clone's visibility to hidden and position to absolute to measure its size accurately
		clone.style.visibility = 'hidden';
		clone.style.position = 'absolute';
		clone.style.top = '-9999px';
		clone.style.left = '-9999px';
		
		// Append the clone to the document body
		element.parentNode?.insertBefore(clone,element);
		
		const rect = clone.getBoundingClientRect();
		// Get the computed size of the clone
		const naturalWidth = rect.width;
		const naturalHeight = rect.height;
		
		// Remove the clone from the DOM
		element.parentNode?.removeChild(clone);

		// if (keepPadding) {
		// 	element.dataset.harmonyMinWidthPadding = `${naturalWidth}`;
		// 	element.dataset.harmonyMinHeightPadding = `${naturalHeight}`;
		// } else {
		// 	element.dataset.harmonyMinWidth = `${naturalWidth}`;
		// 	element.dataset.harmonyMinHeight = `${naturalHeight}`;
		// }
	
		return { width: naturalWidth, height: naturalHeight };
	} else {
		const styles = getComputedStyle(element);
		const padding = styles.padding;
		const oldRect = element.getBoundingClientRect();
		element.style.padding = '10px';
		const withPadding = element.getBoundingClientRect();
		element.style.padding = '0px';
		const withoutPadding = element.getBoundingClientRect();
		element.style.padding = padding;

		const width = withPadding.width > withoutPadding.width ? oldRect.width : 0;
		const height = withPadding.height > withoutPadding.height ? oldRect.height : 0;

		return {width, height};
	}
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

export interface ChildEdgeInfo {
    element: HTMLElement,
	index: number,
    midpointX: number,
    midpointY: number,
    left: ElementEdgeInfo,
    right: ElementEdgeInfo,
    top: ElementEdgeInfo,
    bottom: ElementEdgeInfo
}

interface SizingInfo {
	minWidth: number,
	minHeight: number,
	widthType: 'content' | 'expand' | 'fixed',
	heightType: 'content' | 'expand' | 'fixed',
	width: number,
	height: number,
}

type ChildEdgeInfoWithSizing = ChildEdgeInfo & SizingInfo

interface ParentEdgeInfo<T extends ChildEdgeInfo = ChildEdgeInfo> {
	element: HTMLElement,
	children: HTMLElement[],
    childEdgeInfo: T[],
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
	//TODO: Find a better fix for when there are no selectable items than just to not handle the drag
    edges: {
        left: ElementEdgeInfo & {info: T},
        right: ElementEdgeInfo & {info: T},
        top: ElementEdgeInfo & {info: T},
        bottom: ElementEdgeInfo & {info: T},
    } | undefined
}

export type ParentEdgeInfoWithSizing = ParentEdgeInfo<ChildEdgeInfoWithSizing> & SizingInfo;

export type ParentEdgeInfoRequired = ParentEdgeInfo & {
	edges: {
		left: ElementEdgeInfo & {info: ChildEdgeInfo},
        right: ElementEdgeInfo & {info: ChildEdgeInfo},
        top: ElementEdgeInfo & {info: ChildEdgeInfo},
        bottom: ElementEdgeInfo & {info: ChildEdgeInfo},
	}
}

export function calculateEdgesInfoWithSizing(element: HTMLElement, scale: number, scaleActual: number, axis: Axis, updates: UpdateRect[]=[]): ChildEdgeInfoWithSizing {
	const elementReal = element;
	const edgeInfo = calculateEdgesInfo(element, scale, scaleActual, axis, updates);
	
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
	
	const rect = getBoundingRect(sizingElement);
	const heightReal = rect.height;//bottom.bottom.parentEdge.edgeLocation - top.top.parentEdge.edgeLocation;
	const widthReal = rect.width//right.right.parentEdge.edgeLocation - left.left.parentEdge.edgeLocation;
	const height = edgeInfo.bottom.elementLocation - edgeInfo.top.elementLocation;
	const width = edgeInfo.right.elementLocation - edgeInfo.left.elementLocation;
	// let widthType: 'content' | 'expand' | 'fixed' = !isImageElement(sizingElement) && isElementFluid(sizingElement, 'width') ? 'expand' : close(width, minWidthContent, 0.1) ? 'content' : 'fixed';
	// let heightType: 'content' | 'expand' | 'fixed' = !isImageElement(sizingElement) && isElementFluid(sizingElement, 'height') ? 'expand' : close(height, minHeightContent, 0.1) ? 'content' : 'fixed';
	let widthType: 'content' | 'expand' | 'fixed' = isImageElement(sizingElement) || !isElementFluid(sizingElement, 'width') ? 'fixed' : close(widthReal, minWidthContent, 0.1) ? 'content' : 'expand';
	let heightType: 'content' | 'expand' | 'fixed' = isImageElement(sizingElement) || !isElementFluid(sizingElement, 'height') ? 'fixed' : close(heightReal, minHeightContent, 0.1) ? 'content' : 'expand';

	if (isImageElement(sizingElement) || isImageElement(selectDesignerElementReverse(sizingElement))) {
		heightType = 'fixed';
		widthType = 'fixed';
	}


	return {
		...edgeInfo, 
		minWidth,
		minHeight,
		widthType,
		heightType,
		height,
		width,
	}
}

export function calculateEdgesInfo(element: HTMLElement, scale: number, scaleActual: number, axis: Axis, updates: UpdateRect[]=[]): ChildEdgeInfo {
    const parent = element.parentElement!;
	const elementReal = element;
	element = updates.find(update => update.element === element)?.proxyElement || element;

	const otherAxis = axis === 'x' ? 'y' : 'x';
	const children = Array.from(parent.children).filter(child => isSelectable(child as HTMLElement, scaleActual)) as HTMLElement[];
	const index = children.indexOf(elementReal)

    const left = calculateAxisEdgeInfo(element, parent, axis, 'close', scale, scaleActual, index, children, updates);
    const right = calculateAxisEdgeInfo(element, parent, axis, 'far', scale, scaleActual, index, children, updates);
    const top = calculateAxisEdgeInfo(element, parent, otherAxis, 'close', scale, scaleActual, index, children, updates);
    const bottom = calculateAxisEdgeInfo(element, parent, otherAxis, 'far', scale, scaleActual, index, children, updates);
    const rectOverride = updates.find(update => update.element === element)?.rect;
    const parentOverride = updates.find(update => update.element === parent)?.rect;
    const midpointX = (getBoundingClientRect(element, axis, 'close', scale, rectOverride) + getBoundingClientRect(element, axis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, axis, 'close', scale, parentOverride);
    const midpointY = (getBoundingClientRect(element, otherAxis, 'close', scale, rectOverride) + getBoundingClientRect(element, otherAxis, 'size', scale, rectOverride) / 2) - getBoundingClientRectParent(parent, otherAxis, 'close', scale, parentOverride);
    //TODO: We are doing lots of hacky stuff with images. Stop that.
	
	
	

    return {
        element,
        left,
        right,
        top,
        bottom,
        midpointX,
        midpointY,
        index,
    }
}

export function calculateAxisEdgeInfo(element: HTMLElement, parent: HTMLElement, axis: Axis, side: Side, scale: number, scaleActual: number, selfIndex: number, children: HTMLElement[], updates: UpdateRect[]=[]): ElementEdgeInfo {
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
        gapTypes: getGapTypesToParent(element, parent, axis, side, scaleActual),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: 0,
    } : {
        gap: parentGap,
        relation: 'parent',
        edgeElement: parent,
        gapTypes: getGapTypesToParent(element, parent, axis, side, scaleActual),
        edgeLocation: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)),
        edgeLocationRelative: getBoundingClientRectParent(parent, axis, side, scale, getRectOverride(parent)) - getBoundingClientRectParent(parent, axis, otherSide, scale, getRectOverride(parent)),
    }

    let siblingEdge: EdgeInfo | undefined = undefined;
	
    if (selfIndex > 0 && side === 'close') {
        const sibling = children[selfIndex - 1] as HTMLElement;
        const newStart = getBoundingClientRect(element, axis, side, scale, getRectOverride(element)) - getBoundingClientRect(sibling, axis, otherSide, scale, getRectOverride(sibling));
        siblingEdge = {
            gap: newStart,
            relation: 'sibling',
            edgeElement: sibling,
            gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scaleActual),
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
            gapTypes: getGapTypesToSibiling(element, sibling, axis, side, scaleActual),
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

export function calculateParentEdgeInfoWithSizing(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentEdgeInfoWithSizing {
	const parentInfo = calculateParentEdgeInfo<ChildEdgeInfoWithSizing>(parent, scale, scaleActual, useRectOffset, axis, updates, true);

	const {width: minWidth, height: minHeight} = getFitContentSize(parent, true);
	const rect = getBoundingRect(parent);
	const height = rect.height;//bottom.bottom.parentEdge.edgeLocation - top.top.parentEdge.edgeLocation;
	const width = rect.width//right.right.parentEdge.edgeLocation - left.left.parentEdge.edgeLocation;
	const widthType = close(width, minWidth, 0.1) ? 'content' : isElementFluid(parent, 'width') ? 'expand' : 'fixed';
	const heightType = close(height, minHeight, 0.1) ? 'content' : isElementFluid(parent, 'height') ? 'expand' : 'fixed';

	return {
		...parentInfo,
		minWidth,
		minHeight,
		widthType,
		heightType,
		width,
		height,
	}
}

export function calculateParentEdgeInfo<T extends ChildEdgeInfo = ChildEdgeInfo>(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[], withChildSizing=false): ParentEdgeInfo<T> {
    const childEdgeInfo: T[] = [];
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
        childEdgeInfo.push((withChildSizing ? calculateEdgesInfoWithSizing(child as HTMLElement, scale, scaleActual, axis, updates) : calculateEdgesInfo(child as HTMLElement, scale, scaleActual, axis, updates)) as T);
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
	const childrenWidth = children.reduce((prev, curr) => prev + getBoundingClientRect(curr, 'x', 'size', scale), 0);
	const childrenHeight = children.reduce((prev, curr) => prev + getBoundingClientRect(curr, 'y', 'size', scale), 0);
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
        edges: !left || !right || !top || !bottom ? undefined : {
            left: {info: left, ...left.left}, 
            right: {info: right, ...right.right},
            top: {info: top, ...top.top},
            bottom: {info: bottom, ...bottom.bottom}
        },
    }
}

type ParentFlexEdgeInfo<T extends ParentEdgeInfo = ParentEdgeInfo> = T & {
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
export function calculateFlexParentEdgeInfo<T extends ParentEdgeInfo = ParentEdgeInfo>(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[], withSizing = false): ParentFlexEdgeInfo<T> {
	const parentInfo = withSizing ? calculateParentEdgeInfoWithSizing(parent, scale, scaleActual, useRectOffset, axis, updates) : calculateParentEdgeInfo(parent, scale, scaleActual, useRectOffset, axis, updates, false);

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
	} as ParentFlexEdgeInfo<T>
}

export function calculateFlexParentEdgeInfoWithSizing(parent: HTMLElement, scale: number, scaleActual: number, useRectOffset: boolean, axis: Axis, updates: UpdateRect[]=[]): ParentFlexEdgeInfo<ParentEdgeInfoWithSizing> {
	return calculateFlexParentEdgeInfo<ParentEdgeInfoWithSizing>(parent, scale, scaleActual, useRectOffset, axis, updates, true);
}