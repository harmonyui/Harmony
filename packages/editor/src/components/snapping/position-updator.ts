import { Rect, selectDesignerElementReverse } from "../inspector/inspector";
import { RectSide, calculateFlexParentEdgeInfo, calculateParentEdgeInfo, getBoundingRect, getMinGap, getSiblingGap, setSpaceForElement } from "./calculations";
import {close} from '@harmony/util/src/index'

export interface UpdatedElement {
	element: HTMLElement;
	oldValues: Record<string, string>;
}
export interface PositionUpdator {
	updateRects: (props: UpdateRectsProps, scale: number, scaleActual: number) => UpdatedElement[];
}

export interface UpdateRect {
    element: HTMLElement,
	proxyElement?: HTMLElement;
    rect: Rect
}
interface UpdateRectsProps {
    parentUpdate: UpdateRect,
    childrenUpdates: UpdateRect[]
}

export const absoluteUpdator: PositionUpdator = {
	updateRects({parentUpdate, childrenUpdates}, scale, scaleActual) {
		const updatedElements: UpdatedElement[] = [];
		const updateTransform = (element: HTMLElement, rect: Rect) => {
			const style = getComputedStyle(element);
			const oldValues = {
				transform: style.transform,
				width: style.width,
				height: style.height
			}
			if (!element.dataset.harmonyLastX || !element.dataset.harmonyLastY || !element.dataset.harmonyLastWidth || !element.dataset.harmonyLastHeight) {
				const rect = getBoundingRect(element);
				element.dataset.harmonyLastX = `${rect.left / scaleActual}`;
				element.dataset.harmonyLastY = `${rect.top / scaleActual}`;
				element.dataset.harmonyLastWidth = style.width;
				element.dataset.harmonyLastHeight = style.height;
			}
			
			const currX = parseFloat(element.dataset.harmonyLastX);
			const currY = parseFloat(element.dataset.harmonyLastY);

			const beforeSizeChange = getBoundingRect(element);
			element.style.width = `${rect.width / scaleActual}px`;
			element.style.height = `${rect.height / scaleActual }px`;
			const afterSizeChange = getBoundingRect(element);

			const diff = {
				left: afterSizeChange.left - beforeSizeChange.left,
				top: afterSizeChange.top - beforeSizeChange.top
			}
			element.style.transform = `translate(${rect.left /scaleActual - currX - diff.left}px, ${rect.top /scaleActual - currY - diff.top}px)`
			

			updatedElements.push({element, oldValues});
		}

		updateTransform(parentUpdate.element, parentUpdate.rect);
		for (const childUpdate of childrenUpdates) {
			updateTransform(childUpdate.element, childUpdate.rect);
		}

		return updatedElements;
	},
}

export const elementUpdator: PositionUpdator = {
	updateRects({parentUpdate, childrenUpdates}: UpdateRectsProps, scale: number, scaleActual: number) {
		const parentInfo = calculateParentEdgeInfo(parentUpdate.element, scale, scaleActual, false, 'x', [parentUpdate, ...childrenUpdates]);
		if (!parentInfo.edges) return;
		
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
}

export const flexUpdator: PositionUpdator = {
	updateRects({parentUpdate, childrenUpdates}: UpdateRectsProps, scale: number, scaleActual: number) {
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
		if (!parentInfo.edges) return;

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
}