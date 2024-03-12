import { capitalizeFirstLetter, groupBy, groupByDistinct, round, close } from "@harmony/util/src";
import interact from "interactjs";
import { useState, useEffect, useRef, useMemo } from "react";
import { Rect, RectBox, isImageElement, isSelectable as isSelectableInspector, isTextElement, removeTextContentSpans, replaceTextContentWithSpans, selectDesignerElement, selectDesignerElementReverse } from "../inspector/inspector";
import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import {InteractEvent, ResizeEvent} from '@interactjs/types'
import {Modifier} from '@interactjs/modifiers/types'
import {AspectRatioOptions, AspectRatioState} from '@interactjs/modifiers/aspectRatio'
import {SnapPosition} from '@interactjs/modifiers/snap/pointer'
import $ from 'jquery';
import { info } from "console";
import { Axis, ParentEdgeInfoRequired, RectSide, calculateEdgesInfo, calculateFlexParentEdgeInfo, calculateParentEdgeInfo, getBoundingClientRect, getBoundingRect, getFitContentSize, getMinGap, getNonWorkableGap, getOffsetRect } from "./calculations";
import { PositionUpdator, UpdateRect, absoluteUpdator, elementUpdator, flexUpdator } from "./position-updator";



export function isSelectable(element: HTMLElement, scale: number): boolean {
	//If the size is less but it has margin, make it selectable
	if (['Bottom', 'Top', 'Left', 'Right'].some(d => parseFloat($(element).css(`margin${d}`)) !== 0)) {
		return true;
	}

	return isSelectableInspector(element, 1/scale);
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
function Snapping({parent, element, parentEdgeInfo, resultsX, resultsY}: {parent: HTMLElement, element: HTMLElement, parentEdgeInfo: ParentEdgeInfoRequired, resultsX: SnappingResult[], resultsY: SnappingResult[]}) {
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
	getUpdator: () => PositionUpdator;
	setUpdator: (updator: PositionUpdator) => void;
}

class ElementSnapping implements SnapBehavior {
	constructor(private positionUpdator: PositionUpdator) {}

	public getUpdator() {
		return this.positionUpdator;
	}

	public setUpdator(updater: PositionUpdator) {
		this.positionUpdator = updater;
	}

	public getOldValues(element: HTMLElement) {
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
			//if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
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
			//}
		}

		for (const child of Array.from(element.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			//if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
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
			//}
		}

		return oldValues;
	}
	public isDraggable(element: HTMLElement) {
		const parent = element.parentElement!;
		const style = getComputedStyle(parent);
		if (!['block', 'list-item'].includes(style.display)) {
			return 'This is not a block element';
		}

		if (element.dataset.harmonyText === 'true') {
			return 'Cannot move text element. Use text alignment to move.';
		}

		return undefined;
	}
	public onUpdate(element: HTMLElement, event: DraggingEvent, scale: number) {
        if (!element.parentElement) {
            throw new Error("Element does not have a parent");
        }
		const parent = element.parentElement;

        const childrenUpdates: UpdateRect[] = [{
            element,
            rect: event.eventRect
        }];
		this.positionUpdator.updateRects({
            parentUpdate: {
                element: parent,
                rect: getBoundingRect(parent)
            },
            childrenUpdates
        }, scale, scale);
	}
	public onCalculateSnapping(element: HTMLElement, poxX: number, posY: number, dx: number, dy: number, scale: number) {
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

		if (parentEdgeInfo.edges === undefined || parentEdgeInfoScaled.edges === undefined) return {resultsX, resultsY};

        const snapping = Snapping({parent, element, parentEdgeInfo: parentEdgeInfo as ParentEdgeInfoRequired, resultsX, resultsY});

        const addSnapsForParentEdges = (parentEdgeInfo: ParentEdgeInfoRequired, parentEdgeInfoScaled: ParentEdgeInfoRequired) => {
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

    	addSnapsForParentEdges(parentEdgeInfo as ParentEdgeInfoRequired, parentEdgeInfoScaled as ParentEdgeInfoRequired);

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
	}
	onFinish(element: HTMLElement) {
		return element;
	}
    public getRestrictions(element: HTMLElement, scale: number) {
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
    }
}

class FlexSnapping implements SnapBehavior {
	constructor(private positionUpdator: PositionUpdator) {}

	public getUpdator() {
		return this.positionUpdator;
	}

	public setUpdator(updater: PositionUpdator) {
		this.positionUpdator = updater;
	}
	
	public getOldValues(element: HTMLElement) {
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
			//if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
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
			//}
		}

		for (const child of Array.from(element.children)) {
			const style = getComputedStyle(child);
			const componentId = (child as HTMLElement).dataset.harmonyId || '';
			//Only add the old values of new elements to not interfere with the updates
			//if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
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
			//}
		}

		return oldValues;
	}
	public isDraggable(element: HTMLElement) {
		const parent = element.parentElement!;
		const parentStyle = getComputedStyle(parent);
		if (parentStyle?.display.includes('flex')) {
			if (parentStyle.flexWrap === 'wrap') {
				return 'Harmony does not currently support flex-wrap';
			}

			return undefined;
		}
		return 'This is not a flex component'
	}
	public onUpdate(element: HTMLElement, event: DraggingEvent, scale: number, isResize: boolean) {
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
		const ds = (axis === 'x' ? event.dx : event.dy);
		if (currParentInfo.edges === undefined) return;

		const selfIndex = currParentInfo.childEdgeInfo.find(info => info.element === element)!.index;
		const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY';
		const minGap = round(getMinGap(parent), 1);
		const childrenCount = currParentInfo.childEdgeInfo.length;

		const lastGap = parent.dataset.lastGap ? parseFloat(parent.dataset.lastGap) : currParentInfo[minGapBetweenX];
		const gapDiff = currParentInfo[minGapBetweenX] - minGap// - lastGap;
		
		const isMoving = selfIndex > 0 && selfIndex < childrenCount - 1 || (close(gapDiff, 0, 0.1) && (selfIndex === 0 && ds > 0 || selfIndex === childrenCount - 1 && ds < 0));

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
				if (isMoving) {
					addChildRects([element], ds);
				}
				else {
					if (selfIndex === 0 && currParentInfo.edges![right].parentEdge.gap === 0 && ds < 0) {
						const last = currParentInfo.children[currParentInfo.children.length - 1] as HTMLElement;
						addChildRects([element, last], ds / (currParentInfo.children.length - 1))
					} else if (selfIndex === childrenCount - 1 && currParentInfo.edges![left].parentEdge.gap === 0 && ds > 0) {
						const first = currParentInfo.children[0] as HTMLElement;
						addChildRects([element, first], ds / (currParentInfo.children.length - 1))
					} else {
						ds = selfIndex === 0 ? ds : -ds;
						for (let start = 0, end = currParentInfo.children.length - 1; start < end; start++, end--) {
							const first = currParentInfo.children[start] as HTMLElement;
							const last = currParentInfo.children[end] as HTMLElement;
		
							first !== element && addDs(first, ds);
							last !== element && addDs(last, -ds);
							const ratio = childrenCount % 2 === 0 ? childrenCount - 1 : (childrenCount - 1) / 2
							ds /= ratio
						}
					}
				} 
				// if (selfIndex === 0) {
				// 	if (currParentInfo[minGapBetweenX] > minGap || ds < 0) {
				// 		const last = currParentInfo.children[currParentInfo.children.length - 1] as HTMLElement;
				// 		if (currParentInfo.edges![right].parentEdge.gap === 0 && ds < 0) {
				// 			// if (currParentInfo.edges.left.parentEdge.gap <= 0) {
				// 			// 	return;
				// 			// }
				// 			addChildRects([element, last], ds / (currParentInfo.children.length - 1))
				// 		} else {
				// 			addDs(last, -ds);
				// 		}
				// 	} else {
				// 		// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
				// 		// 	return;
				// 		// }
				// 		addChildRects([element], ds)
				// 	}
				// } else if (selfIndex === currParentInfo.children.length - 1) {
				// 	if (currParentInfo[minGapBetweenX] > minGap || ds > 0) {
				// 		const first = currParentInfo.children[0] as HTMLElement;
				// 		if (currParentInfo.edges![left].parentEdge.gap === 0 && ds > 0) {
				// 			// if (currParentInfo.edges.right.parentEdge.gap <= 0) {
				// 			// 	return;
				// 			// }
				// 			addChildRects([element, first], ds / (currParentInfo.children.length - 1))
				// 		} else {
				// 			addDs(first, -ds);
				// 		}
				// 	} else {
				// 		// if (currParentInfo.edges.left.parentEdge.gap <= 0) {
				// 		// 	return;
				// 		// }
				// 		addChildRects([element], ds)
				// 	}
				// } else {
				// 	if (currParentInfo.edges![left].parentEdge.gap <= 0 && currParentInfo.edges![right].parentEdge.gap <= 0) {
						
				// 	} else {
				// 		addChildRects([element], ds)
				// 	}
				// }
			}
		}
	
		if (!isResize) {
			calculateMovePositions();
		}

		this.positionUpdator.updateRects({
			parentUpdate: {
				element: parent,
				rect: parent.getBoundingClientRect()
			},
			childrenUpdates: updates
		}, scale, scale)
	}
	public onCalculateSnapping(element: HTMLElement, posX: number, posY: number, dx: number, dy: number, scale: number) {
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

		if (parentInfo.edges === undefined) return {resultsX, resultsY};
		
		const snapping = Snapping({parent, element, parentEdgeInfo: parentInfo as ParentEdgeInfoRequired, resultsX, resultsY});

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
	}
	public onFinish(element: HTMLElement) {
		return element.parentElement!;
	}
    public getRestrictions(element: HTMLElement, scale: number) {
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
		if (parentInfo.edges === undefined) return [];

		const myChildInfo = parentInfo.childEdgeInfo.find(info => info.element === element);
		const parentRect = {
			left: parentInfo.edges.left.parentEdge.edgeLocation,
			right: parentInfo.edges.right.parentEdge.edgeLocation,
			top: parentInfo.edges.top.parentEdge.edgeLocation,
			bottom: parentInfo.edges.bottom.parentEdge.edgeLocation,
		}
		//If there isn't my child info, that might mean we have gone too small and so it does not show up anymore
		if (!myChildInfo) {
			return [parentRect];
		}
		const selfIndex = myChildInfo.index;
		
		
		if (selfIndex > 0 && selfIndex < parentInfo.children.length - 1) {
			//if (parentInfo.edges[right].parentEdge.gap > 0)
			parentRect[left] = parentInfo.childEdgeInfo[selfIndex][left].elementLocation - parentInfo.edges[left].parentEdge.gap;
			
			//if (parentInfo.edges[left].parentEdge.gap > 0)
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

const elementSnapBehavior = new ElementSnapping(elementUpdator);
const flexSnapping = new FlexSnapping(flexUpdator);

const getSnappingBehavior = (parent: HTMLElement | undefined) => {
	let snappingBehavior: SnapBehavior = elementSnapBehavior;
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

		if (!isSelectable(element, scale)) {
			onError('Element is too small to drag');
			return false;
		}

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
		const updator = elementSnap.getUpdator();
		updator.updateRects({
			parentUpdate: {
				element: parent,
				rect: getBoundingRect(parent)
			},
			childrenUpdates: [{
				element,
				rect: event.eventRect,
			}]
		}, scale, scale);

		const hasTextNodes = toResize.childNodes.length === 1 && toResize.childNodes[0].nodeType === Node.TEXT_NODE
        //Update for all the children too
		if (Array.from(toResize.children).filter(child => isSelectable(child as HTMLElement, scale)).length > 0 || hasTextNodes) {
			
			if (hasTextNodes) {
				replaceTextContentWithSpans(toResize);
				Array.from(toResize.children).forEach(child => {
					const span = child as HTMLElement;
					if (span.dataset.harmonyText === 'true') {
						span.style.display = 'block';
					}
				})
			}

			const childrenSnap = getSnappingBehavior(toResize)
			const updator = childrenSnap.getUpdator();
			updator.updateRects({
				parentUpdate: {
					element: toResize,
					rect: event.eventRect,
				},
				childrenUpdates
			}, scale, scale);
		}

		onIsDragging && onIsDragging(event, element);
    }, onCalculateSnapping(element, x, y, currentX, currentY) {
		return;
		const parent = element.parentElement!;
		const posX = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(parent, 'x', 'close', 1);
		const posY = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(parent, 'y', 'close', 1);
		const dx = posX  - resX.current//posX + getBoundingClientRect(parent, 'x', 'close', 1) - currentX;
		const dy = posY - resY.current///posY + getBoundingClientRect(parent, 'y', 'close', 1) - currentX;
        const result = elementSnapBehavior.onCalculateSnapping(element, posX,posY, dx, dy, scale);

        return normalizeSnappingResults({...result, x, y});

        // return res;
    }, canResize(element) {
		if (element.contentEditable === 'true') return false;

		if (!isSelectable(element, scale)) {
			onError('Element is too small to resize');
			return false;
		}

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
				const parentStyle = getComputedStyle(parent);
				const style = getComputedStyle(element);
				const axis = parentStyle.display.includes('flex') && parentStyle.flexDirection === 'column' ? 'y' : 'x';
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

				if (parentInfo.edges) {
					modifiers.push(interact.modifiers.restrictEdges({
						inner: toMeasureInfo && toMeasureInfo.edges ? {
							left: toMeasureInfo.edges.left.elementLocation,
							right: toMeasureInfo.edges.right.elementLocation,
							top: toMeasureInfo.edges.top.elementLocation -  + getNonWorkableGap(toMeasureInfo.edges.top.parentEdge.gapTypes),
							bottom: toMeasureInfo.edges.bottom.elementLocation + getNonWorkableGap(toMeasureInfo.edges.bottom.parentEdge.gapTypes)
						} : undefined,
						outer: {
							left: validSibiling('left') ? Math.max(parentInfo.edges.left.parentEdge.edgeLocation, myInfo.left.siblingEdge?.edgeLocation || 0) : parentInfo.edges.left.parentEdge.edgeLocation,
							right: validSibiling('right') ? Math.min(parentInfo.edges.right.parentEdge.edgeLocation, myInfo.right.siblingEdge?.edgeLocation || Infinity) : parentInfo.edges.right.parentEdge.edgeLocation,
							top: true ? Math.max(parentInfo.edges.top.parentEdge.edgeLocation, myInfo.top.siblingEdge?.edgeLocation || 0) : parentInfo.edges!.top.parentEdge.edgeLocation,
							bottom: true ? Math.min(parentInfo.edges.bottom.parentEdge.edgeLocation, myInfo.bottom.siblingEdge?.edgeLocation || Infinity) : parentInfo.edges!.bottom.parentEdge.edgeLocation,
						}
					}));
				}
				//TODO: Remove isImage dependency (This is here because we want to be able to resize an image at will till the minimum size)
				const {width, height} = isImageElement(toMeasure) ? {width: 20, height: 20} : getFitContentSize(toMeasure);
				let maxWidth = parseFloat(style.maxWidth);
				if (isNaN(maxWidth)) {
					maxWidth = Infinity;
				}
				let maxHeight = parseFloat(style.maxHeight);
				if (isNaN(maxHeight)) {
					maxHeight = Infinity;
				}

				let minWidth = parseFloat(style.minWidth);
				if (isNaN(minWidth)) {
					minWidth = Infinity;
				}
				let minHeight = parseFloat(style.minHeight);
				if (isNaN(minHeight)) {
					minHeight = -Infinity;
				}
				modifiers.push(interact.modifiers.restrictSize({
					//TODO: Hacky fix for when a flex-basis flex-col item is measured, it comes out all wrong
					min: {width: width <= toMeasure.clientWidth ? minWidth < Infinity ? minWidth : Math.min(width, 20, minWidth) : 20, height: height <= toMeasure.clientHeight ? Math.max(height, 20, minHeight) : 20},
					max: {width: maxWidth, height: maxHeight}
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