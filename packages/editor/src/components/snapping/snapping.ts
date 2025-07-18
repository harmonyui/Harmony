/* eslint-disable no-constant-condition -- ok*/

/* eslint-disable @typescript-eslint/no-unused-vars -- ok*/

/* eslint-disable import/no-cycle -- ok*/
import {
  capitalizeFirstLetter,
  round,
  close,
} from '@harmony/util/src/utils/common'
import interact from 'interactjs'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import type {
  InteractEvent,
  ResizeEvent,
  EdgeOptions,
} from '@interactjs/types/index'
import type { Modifier } from '@interactjs/modifiers/types'
import type {
  AspectRatioOptions,
  AspectRatioState,
} from '@interactjs/modifiers/aspectRatio'
import $ from 'jquery'
import {
  isSelectable as isSelectableInspector,
  removeTextContentSpans,
} from '../inspector/inspector'
import type { Rect, RectBox } from '../inspector/inspector'
import {
  replaceTextContentWithSpans,
  selectDesignerElement,
  selectDesignerElementReverse,
} from '../../utils/element-utils'
import { isImageElement, isTextElement } from '../../utils/element-predicate'
import type {
  Axis,
  ChildEdgeInfo,
  ParentEdgeInfoRequired,
  RectSide,
} from './calculations'
import {
  calculateEdgesInfo,
  calculateFlexParentEdgeInfo,
  calculateParentEdgeInfo,
  calculateParentEdgeInfoWithSizing,
  getBoundingClientRect,
  getBoundingRect,
  getFitContentSize,
  getMinGap,
  getNonWorkableGap,
  getOffsetRect,
} from './calculations'
import type {
  PositionUpdator,
  UpdateRect,
  UpdateRectsProps,
  UpdatedElement,
} from './position-updator'
import {
  absoluteUpdator,
  elementUpdator,
  flexUpdator,
} from './position-updator'

export function isSelectable(element: HTMLElement, scale: number): boolean {
  if (element.dataset.harmonyForceSelectable === 'true') return true

  //If the size is less but it has margin, make it selectable
  if (
    ['Bottom', 'Top', 'Left', 'Right'].some(
      (d) => parseFloat($(element).css(`margin${d}`)) > 0,
    )
  ) {
    return true
  }

  return isSelectableInspector(element, 1 / scale)
}

type RelativePoint = 'x0' | 'x1' | 'y0' | 'y1'
interface SnapPoint {
  point:
    | { left: number }
    | { right: number }
    | { top: number }
    | { bottom: number }
  offset?: HTMLElement
  guides?: {
    x0: number
    y0: number
    x1: number
    y1: number
    text?: number | string
    offset?: HTMLElement
    relative: RelativePoint[]
    rotate?: boolean
  }[]
}

// interface StyleValue {
// 	name: string;
// 	value: string;
// }

interface GuidePoint {
  relativeTo: HTMLElement
  value: number
}
interface GuidePosition {
  x: GuidePoint | number
  y: GuidePoint | number
}

interface AddGuide {
  start?: GuidePosition
  end?: GuidePosition
  length?: {
    value: number
    axis: Axis
  }
  text?: number | string
  edge?: RectSide
}

interface AddNewSnapProps {
  point: number
  axis: Axis
  from?: RectSide
  snapSide?: RectSide
  range: number | undefined
}
function Snapping({
  parent,
  element,
  parentEdgeInfo,
  resultsX,
  resultsY,
}: {
  parent: HTMLElement
  element: HTMLElement
  parentEdgeInfo: ParentEdgeInfoRequired
  resultsX: SnappingResult[]
  resultsY: SnappingResult[]
}) {
  const addSnapToParent = ({
    point,
    axis,
    from,
    snapSide,
    range,
  }: AddNewSnapProps) => {
    function createGuide({ start, end, length, text, edge }: AddGuide) {
      const offset = parent.getBoundingClientRect()
      let x0 = 0
      let x1 = 0
      let y0 = 0
      let y1 = 0
      const relative: RelativePoint[] = []
      const calculatePoints = (point: GuidePoint | number, axis: Axis) => {
        let p = 0
        if (typeof point === 'number') {
          p = point
        } else {
          const offsetRect = point.relativeTo.getBoundingClientRect()
          const sizeIdent = axis === 'x' ? 'width' : 'height'
          const sideIdent = axis === 'x' ? 'left' : 'top'
          const width = offsetRect[sizeIdent] * point.value
          p = width + offsetRect[sideIdent] - offset[sideIdent]
        }

        return p
      }

      const calculatePosition = (
        position: GuidePosition,
        direction: 1 | -1,
      ) => {
        const x0 = calculatePoints(position.x, 'x')
        let x1 = x0
        const y0 = calculatePoints(position.y, 'y')
        let y1 = y0

        if (length) {
          if (length.axis === 'x') {
            x1 = x0 + length.value * direction
          } else {
            y1 = y0 + length.value * direction
          }
        }

        return { fromX: x0, toX: x1, fromY: y0, toY: y1 }
      }

      if (start) {
        const { fromX, toX, fromY, toY } = calculatePosition(start, 1)
        x0 = fromX
        x1 = toX
        y0 = fromY
        y1 = toY
      }

      if (end) {
        const { fromX, toX, fromY, toY } = calculatePosition(end, -1)
        if (!start) {
          x1 = fromX
          x0 = toX
          y1 = fromY
          y0 = toY
        } else {
          x1 = fromX
          y1 = fromY
        }
      }

      const side = edge || (axis === 'x' ? 'left' : 'top')
      return {
        point: { [side as 'top']: point },
        offset: parent,
        guides: [
          {
            x0,
            x1,
            y0,
            y1,
            relative,
            text,
          },
        ],
      }
    }

    const results = axis === 'x' ? resultsX : resultsY
    if (from && from !== 'left' && from !== 'top') {
      point = parentEdgeInfo.edges[from].parentEdge.edgeLocationRelative - point
    }

    if (snapSide) {
      if (snapSide === 'right') {
        point = point - getBoundingClientRect(element, 'x', 'size', 1)
      } else if (snapSide === 'bottom') {
        point = point - getBoundingClientRect(element, 'y', 'size', 1)
      }
    }

    const newResult: SnappingResult = {
      snapGuides: [],
      range,
      [axis]: point,
    }
    results.push(newResult)

    function addGuide(props: AddGuide) {
      const result = createGuide(props)
      newResult.snapGuides.push(result)
    }

    return {
      addGuide,
      addCenterAxisGuide({ axis, edge }: { axis: Axis; edge?: RectSide }) {
        const otherAxis = axis === 'x' ? 'y' : 'x'
        addGuide({
          start: {
            [otherAxis as 'y']: {
              relativeTo: parent,
              value: 0.5,
            },
            [axis as 'x']: {
              relativeTo: parent,
              value: 0,
            },
          },
          end: {
            [otherAxis as 'y']: {
              relativeTo: parent,
              value: 0.5,
            },
            [axis as 'x']: {
              relativeTo: parent,
              value: 1,
            },
          },
          edge,
        })
      },
    }
  }

  return { addSnapToParent }
}

interface SnapBehavior {
  isDraggable: (element: HTMLElement) => string | undefined
  onUpdate: (
    element: HTMLElement,
    event: DraggingEvent,
    scale: number,
    isResize: boolean,
  ) => UpdatedElement[]
  onCalculateSnapping: (
    element: HTMLElement,
    posX: number,
    posY: number,
    dx: number,
    dy: number,
    scale: number,
    isResize: boolean,
  ) => { resultsX: SnappingResult[]; resultsY: SnappingResult[] }
  onFinish: (element: HTMLElement) => HTMLElement
  getRestrictions: (element: HTMLElement, scale: number) => RectBox | undefined
  getPositionUpdator: () => PositionUpdator
  getCssUpdator: () => PositionUpdator
}

class ElementSnapping implements SnapBehavior {
  constructor(
    private positionUpdator: PositionUpdator,
    private cssUpdator: PositionUpdator,
  ) {}

  public getPositionUpdator() {
    return this.positionUpdator
  }

  public getCssUpdator() {
    return this.cssUpdator
  }

  public getOldValues(element: HTMLElement) {
    const parent = element.parentElement!
    const parentStyle = getComputedStyle(parent)
    const oldValues: [HTMLElement, Record<string, string>][] = [
      [
        parent,
        {
          paddingLeft: parentStyle.paddingLeft || '',
          paddingRight: parentStyle.paddingRight || '',
          paddingTop: parentStyle.paddingTop || '',
          paddingBottom: parentStyle.paddingBottom || '',
        },
      ],
    ]

    for (const child of Array.from(parent.children)) {
      const style = getComputedStyle(child)
      //const componentId = (child as HTMLElement).dataset.harmonyId || '';
      //Only add the old values of new elements to not interfere with the updates
      //if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
      oldValues.push([
        child as HTMLElement,
        {
          paddingLeft: style.paddingLeft || '',
          paddingRight: style.paddingRight || '',
          paddingTop: style.paddingTop || '',
          paddingBottom: style.paddingBottom || '',
          marginLeft: style.marginLeft || '',
          marginRight: style.marginRight || '',
          marginTop: style.marginTop || '',
          marginBottom: style.marginBottom || '',
          height: style.height || '',
          width: style.width || '',
        },
      ])
      //}
    }

    for (const child of Array.from(element.children)) {
      const style = getComputedStyle(child)
      //const componentId = (child as HTMLElement).dataset.harmonyId || '';
      //Only add the old values of new elements to not interfere with the updates
      //if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
      oldValues.push([
        child as HTMLElement,
        {
          paddingLeft: style.paddingLeft || '',
          paddingRight: style.paddingRight || '',
          paddingTop: style.paddingTop || '',
          paddingBottom: style.paddingBottom || '',
          marginLeft: style.marginLeft || '',
          marginRight: style.marginRight || '',
          marginTop: style.marginTop || '',
          marginBottom: style.marginBottom || '',
          height: style.height || '',
          width: style.width || '',
        },
      ])
      //}
    }

    return oldValues
  }
  public isDraggable(element: HTMLElement) {
    const parent = element.parentElement!

    if (element.dataset.harmonyError === 'element') {
      return 'Element is not updateable at the moment'
    }

    if (parent.dataset.harmonyError === 'element') {
      return 'Parent is not updateable at the moment'
    }

    const style = getComputedStyle(parent)
    if (!['block', 'list-item'].includes(style.display)) {
      return `Harmony does not currently support display ${style.display}`
    }

    if (element.dataset.harmonyText === 'true') {
      return 'Cannot move text element. Use text alignment to move.'
    }

    return undefined
  }
  public onUpdate(element: HTMLElement, event: DraggingEvent, scale: number) {
    if (!element.parentElement) {
      throw new Error('Element does not have a parent')
    }
    const parent = element.parentElement

    const childrenUpdates: UpdateRect[] = [
      {
        element,
        rect: event.eventRect,
      },
    ]
    return this.positionUpdator.updateRects(
      {
        parentUpdate: {
          element: parent,
          rect: getBoundingRect(parent),
        },
        childrenUpdates,
      },
      scale,
      scale,
    )
  }
  public onCalculateSnapping(
    element: HTMLElement,
    poxX: number,
    posY: number,
    dx: number,
    dy: number,
    scale: number,
  ) {
    const parent = element.parentElement!
    const parentEdgeInfo = calculateParentEdgeInfo(parent, 1, scale, false, 'x')
    const parentEdgeInfoScaled = calculateParentEdgeInfo(
      parent,
      scale,
      scale,
      false,
      'x',
    )
    const resultsX: SnappingResult[] = []
    const resultsY: SnappingResult[] = []
    const myChildInfo = parentEdgeInfo.childEdgeInfo.find(
      (info) => info.element === element,
    )
    if (!myChildInfo) {
      throw new Error('Cannot find my child info')
    }

    const range = 10 / scale

    if (
      parentEdgeInfo.edges === undefined ||
      parentEdgeInfoScaled.edges === undefined
    )
      return { resultsX, resultsY }

    const snapping = Snapping({
      parent,
      element,
      parentEdgeInfo: parentEdgeInfo as ParentEdgeInfoRequired,
      resultsX,
      resultsY,
    })

    const addSnapsForParentEdges = (
      parentEdgeInfo: ParentEdgeInfoRequired,
      parentEdgeInfoScaled: ParentEdgeInfoRequired,
    ) => {
      const currParentEdges = Object.entries(parentEdgeInfo.edges).filter(
        ([_, edge]) => edge.element === element,
      )
      const addSnapForEdges = (side: RectSide, otherSide: RectSide) => {
        const addGuideForSide = (side: RectSide) => {
          const axis = side === 'left' || side === 'right' ? 'x' : 'y'
          const oppositeAxis = axis === 'x' ? 'y' : 'x'
          if (side === 'left' || side === 'top') {
            result.addGuide({
              start: {
                [axis as 'x']: {
                  value: 0,
                  relativeTo: parent,
                },
                [oppositeAxis as 'y']: {
                  relativeTo: parent,
                  value: 0.5,
                },
              },
              length: {
                value: point,
                axis,
              },
              text: parentEdgeInfoScaled.edges[otherSide].parentEdge.gap,
            })
          } else {
            result.addGuide({
              end: {
                [axis as 'x']: {
                  value: 1,
                  relativeTo: parent,
                },
                [oppositeAxis as 'y']: {
                  relativeTo: parent,
                  value: 0.5,
                },
              },
              length: {
                value: point,
                axis,
              },
              text: parentEdgeInfoScaled.edges[otherSide].parentEdge.gap,
            })
          }
        }
        const axis = side === 'left' || side === 'right' ? 'x' : 'y'

        const point = parentEdgeInfo.edges[otherSide].parentEdge.gap
        const result = snapping.addSnapToParent({
          point,
          axis,
          from: side,
          snapSide: side,
          range,
        })
        addGuideForSide(side)
        addGuideForSide(otherSide)
      }
      const edges = currParentEdges.map((p) => p[0]) as RectSide[]
      for (const side of edges) {
        ;['left', 'right', 'top', 'bottom'].forEach((otherSide) => {
          if (side === otherSide || edges.includes(otherSide as RectSide))
            return
          addSnapForEdges(side, otherSide as RectSide)
        })
      }
    }

    addSnapsForParentEdges(
      parentEdgeInfo as ParentEdgeInfoRequired,
      parentEdgeInfoScaled as ParentEdgeInfoRequired,
    )

    const centerX = snapping.addSnapToParent({
      point: myChildInfo.left.parentMidpointRelative,
      axis: 'x',
      range,
    })
    centerX.addCenterAxisGuide({
      axis: 'y',
    })

    const centerY = snapping.addSnapToParent({
      point: myChildInfo.top.parentMidpointRelative,
      axis: 'y',
      range,
    })
    centerY.addCenterAxisGuide({
      axis: 'x',
    })
    for (const childInfo of parentEdgeInfo.childEdgeInfo) {
      if (childInfo.element === element) continue

      const loc = childInfo.left.elementLocationRelative
      const others = parentEdgeInfo.childEdgeInfo.filter(
        (info) => info.left.elementLocationRelative === loc,
      )
      const result = snapping.addSnapToParent({
        point: loc,
        axis: 'x',
        range,
      })
      result.addGuide({
        start: {
          x: {
            value: 0,
            relativeTo: others[0]!.element,
          },
          y: {
            value: 0,
            relativeTo: others[0]!.element,
          },
        },
        end: {
          x: {
            value: 0,
            relativeTo: others[others.length - 1]!.element,
          },
          y: {
            value: 1,
            relativeTo: others[others.length - 1]!.element,
          },
        },
      })
    }

    return { resultsX, resultsY }
  }
  onFinish(element: HTMLElement) {
    return element
  }
  public getRestrictions(element: HTMLElement, scale: number) {
    const edgeInfo = calculateEdgesInfo(element, 1, scale, 'x')

    const top = edgeInfo.top.siblingEdge
      ? edgeInfo.top.siblingEdge.edgeLocation //+ getNonWorkableGap(edgeInfo.top.siblingEdge.gapTypes)
      : edgeInfo.top.parentEdge.edgeLocation //+ getNonWorkableGap(edgeInfo.top.parentEdge.gapTypes);
    const bottom = edgeInfo.bottom.siblingEdge
      ? edgeInfo.bottom.siblingEdge.edgeLocation //- (edgeInfo.heightType === 'content' ? getNonWorkableGap(edgeInfo.bottom.siblingEdge.gapTypes) : 0)
      : edgeInfo.bottom.parentEdge.edgeLocation //- (edgeInfo.heightType === 'content' ? getNonWorkableGap(edgeInfo.bottom.parentEdge.gapTypes) : 0);
    const left = edgeInfo.left.parentEdge.edgeLocation //+ getNonWorkableGap(edgeInfo.left.parentEdge.gapTypes)//edgeInfo.left.siblingEdge ? edgeInfo.left.siblingEdge.edgeLocation : edgeInfo.left.parentEdge.edgeLocation;
    const right = edgeInfo.right.parentEdge.edgeLocation //- getNonWorkableGap(edgeInfo.right.parentEdge.gapTypes);//edgeInfo.right.siblingEdge ? edgeInfo.right.siblingEdge.edgeLocation : edgeInfo.right.parentEdge.edgeLocation;

    return {
      top,
      bottom,
      left,
      right,
    }
  }
}

class FlexSnapping implements SnapBehavior {
  constructor(
    private positionUpdator: PositionUpdator,
    private cssUpdator: PositionUpdator,
  ) {}

  public getPositionUpdator() {
    return this.positionUpdator
  }

  public getCssUpdator() {
    return this.cssUpdator
  }

  public setUpdator(updater: PositionUpdator) {
    this.positionUpdator = updater
  }

  public getOldValues(element: HTMLElement) {
    const parent = element.parentElement!
    const parentStyle = getComputedStyle(parent)
    const oldValues: [HTMLElement, Record<string, string>][] = [
      [
        parent,
        {
          paddingLeft: parentStyle.paddingLeft || '',
          paddingRight: parentStyle.paddingRight || '',
          paddingTop: parentStyle.paddingTop || '',
          paddingBottom: parentStyle.paddingBottom || '',
          justifyContent: parentStyle.justifyContent || '',
          alignItems: parentStyle.alignItems || '',
          gap: parentStyle.gap || '',
        },
      ],
    ]

    for (const child of Array.from(parent.children)) {
      const style = getComputedStyle(child)
      //const componentId = (child as HTMLElement).dataset.harmonyId || '';
      //Only add the old values of new elements to not interfere with the updates
      //if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
      oldValues.push([
        child as HTMLElement,
        {
          paddingLeft: style.paddingLeft || '',
          paddingRight: style.paddingRight || '',
          paddingTop: style.paddingTop || '',
          paddingBottom: style.paddingBottom || '',
          marginLeft: style.marginLeft || '',
          marginRight: style.marginRight || '',
          marginTop: style.marginTop || '',
          marginBottom: style.marginBottom || '',
          height: style.height || '',
          width: style.width || '',
        },
      ])
      //}
    }

    for (const child of Array.from(element.children)) {
      const style = getComputedStyle(child)
      //const componentId = (child as HTMLElement).dataset.harmonyId || '';
      //Only add the old values of new elements to not interfere with the updates
      //if (!oldValues.find(value => value[0].dataset.harmonyId === componentId)) {
      oldValues.push([
        child as HTMLElement,
        {
          paddingLeft: style.paddingLeft || '',
          paddingRight: style.paddingRight || '',
          paddingTop: style.paddingTop || '',
          paddingBottom: style.paddingBottom || '',
          marginLeft: style.marginLeft || '',
          marginRight: style.marginRight || '',
          marginTop: style.marginTop || '',
          marginBottom: style.marginBottom || '',
          height: style.height || '',
          width: style.width || '',
        },
      ])
      //}
    }

    return oldValues
  }
  public isDraggable(element: HTMLElement) {
    const parent = element.parentElement!
    if (element.dataset.harmonyError === 'element') {
      return 'Element is not updateable at the moment'
    }

    if (parent.dataset.harmonyError === 'element') {
      return 'Parent is not updateable at the moment'
    }

    const parentStyle = getComputedStyle(parent)
    if (['flex', 'inline-flex'].includes(parentStyle.display)) {
      if (parentStyle.flexWrap === 'wrap') {
        return 'Harmony does not currently support flex-wrap'
      }

      return undefined
    }
    return 'This is not a flex component'
  }
  public onUpdate(
    element: HTMLElement,
    event: DraggingEvent,
    scale: number,
    isResize: boolean,
  ) {
    const parent = element.parentElement!
    const updates: UpdateRect[] = []
    const style = getComputedStyle(parent)
    const axis = style.flexDirection !== 'column' ? 'x' : 'y'
    const left = axis === 'x' ? 'left' : 'top'
    const right = axis === 'x' ? 'right' : 'bottom'
    // const top = axis === 'x' ? 'top' : 'left';
    // const bottom = axis === 'x' ? 'bottom' : 'right';
    // const otherAxis = axis === 'x' ? 'y' : 'x';
    const currParentInfo = calculateParentEdgeInfo(
      parent,
      scale,
      scale,
      false,
      'x',
    )
    const ds = axis === 'x' ? event.dx : event.dy
    if (currParentInfo.edges === undefined) return []

    const selfIndex = currParentInfo.childEdgeInfo.find(
      (info) => info.element === element,
    )!.index
    const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY'
    const minGap = round(getMinGap(parent), 1)
    const childrenCount = currParentInfo.childEdgeInfo.length

    const flexEnabled = parent.dataset.harmonyFlex === 'true'

    //const lastGap = parent.dataset.lastGap ? parseFloat(parent.dataset.lastGap) : currParentInfo[minGapBetweenX];
    const gapDiff = currParentInfo[minGapBetweenX] - minGap // - lastGap;

    const isMoving =
      (selfIndex > 0 && selfIndex < childrenCount - 1) ||
      ((close(gapDiff, 0, 0.1) || currParentInfo[minGapBetweenX] < minGap) &&
        ((selfIndex === 0 && ds > 0) ||
          (selfIndex === childrenCount - 1 && ds < 0)))

    const addRect = (element: HTMLElement, rect: Rect) => {
      updates.push({ element, rect })
    }
    addRect(element, event.eventRect)

    const addDs = (element: HTMLElement, ds: number) => {
      const rect = element.getBoundingClientRect()

      addRect(element, {
        left: rect.left + (axis === 'x' ? ds : 0),
        right: rect.right + (axis === 'x' ? ds : 0),
        top: rect.top + (axis === 'y' ? ds : 0),
        bottom: rect.bottom + (axis === 'y' ? ds : 0),
        height: rect.height,
        width: rect.width,
      })
    }

    const addChildRects = (exclude: Element[], ds: number) => {
      if (isResize) return
      for (const child of currParentInfo.children) {
        if (exclude.includes(child)) continue

        addDs(child as HTMLElement, ds)
      }
    }

    const calculateMovePositions = () => {
      //TODO: This is super hacky and confusing, refactor into a better system that makes more sense
      //Creating the expanding/moving train
      let ds = axis === 'x' ? event.dx : event.dy
      if (currParentInfo.children.length > 1) {
        if (isMoving) {
          addChildRects([element], ds)
        } else {
          if (
            selfIndex === 0 &&
            currParentInfo.edges![right].parentEdge.gap <= 0 &&
            ds < 0
          ) {
            const last = currParentInfo.children[
              currParentInfo.children.length - 1
            ] as HTMLElement
            addChildRects(
              [element, last],
              ds / (currParentInfo.children.length - 1),
            )
          } else if (
            selfIndex === childrenCount - 1 &&
            currParentInfo.edges![left].parentEdge.gap <= 0 &&
            ds > 0
          ) {
            const first = currParentInfo.children[0] as HTMLElement
            addChildRects(
              [element, first],
              ds / (currParentInfo.children.length - 1),
            )
          } else {
            ds = selfIndex === 0 ? ds : -ds
            for (
              let start = 0, end = currParentInfo.children.length - 1;
              start < end;
              start++, end--
            ) {
              const first = currParentInfo.children[start] as HTMLElement
              const last = currParentInfo.children[end] as HTMLElement

              first !== element && addDs(first, ds)
              last !== element && addDs(last, -ds)
              const ratio =
                childrenCount % 2 === 0
                  ? childrenCount - 1
                  : (childrenCount - 1) / 2
              ds /= ratio
            }
          }
        }
      }
    }

    if (!isResize && flexEnabled) {
      calculateMovePositions()
    }

    return this.positionUpdator.updateRects(
      {
        parentUpdate: {
          element: parent,
          rect: parent.getBoundingClientRect(),
        },
        childrenUpdates: updates,
      },
      scale,
      scale,
    )
  }
  public onCalculateSnapping(
    element: HTMLElement,
    posX: number,
    posY: number,
    dx: number,
    dy: number,
    scale: number,
  ) {
    const parent = element.parentElement!
    const style = getComputedStyle(parent)
    const axis = style.flexDirection !== 'column' ? 'x' : 'y'
    const otherAxis = axis === 'x' ? 'y' : 'x'
    const pos = axis === 'x' ? posX : posY
    const ds = axis === 'x' ? dx : dy

    const parentInfo = calculateFlexParentEdgeInfo(parent, 1, scale, false, 'x')
    const selfIndex = parentInfo.childEdgeInfo.find(
      (info) => info.element === element,
    )!.index
    const minGap = getMinGap(parent)
    const range = 10 / scale

    const direction =
      selfIndex === 0
        ? -1 /
          (parentInfo.childrenCount % 2 !== 0 ? 1 : parentInfo.childrenCount)
        : 1 /
          (parentInfo.childrenCount % 2 !== 0 ? 1 : parentInfo.childrenCount)
    const resultsX: SnappingResult[] = []
    const resultsY: SnappingResult[] = []

    if (parentInfo.edges === undefined) return { resultsX, resultsY }

    const snapping = Snapping({
      parent,
      element,
      parentEdgeInfo: parentInfo as ParentEdgeInfoRequired,
      resultsX,
      resultsY,
    })

    const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY'
    const gapBetween = axis === 'x' ? 'gapBetweenX' : 'gapBetweenY'
    const evenlySpace = axis === 'x' ? 'evenlySpaceX' : 'evenlySpaceY'
    const aroundSpace = axis === 'x' ? 'aroundSpaceX' : 'aroundSpaceY'
    const betweenSpace = axis === 'x' ? 'betweenSpaceX' : 'betweenSpaceY'
    const left = axis === 'x' ? 'left' : 'top'
    const right = axis === 'x' ? 'right' : 'bottom'
    const top = axis === 'x' ? 'top' : 'left'
    const bottom = axis === 'x' ? 'bottom' : 'right'
    const midpoint = axis === 'x' ? 'midpointX' : 'midpointY'
    const childrenMidpoint =
      axis === 'x' ? 'childrenMidpointX' : 'childrenMidpointY'

    const lastGap = parent.dataset.lastGap
      ? parseFloat(parent.dataset.lastGap)
      : parentInfo[minGapBetweenX]
    const gapDiff = parentInfo[minGapBetweenX] - lastGap

    const isMoving =
      (selfIndex > 0 && selfIndex < parentInfo.childrenCount - 1) ||
      close(gapDiff, 0, 0.1) //(selfIndex === 0 && close(minGap, parentInfo[minGapBetweenX], 0.1) && ds > 0) || (selfIndex === parentInfo.childrenCount - 1 && close(minGap, parentInfo[minGapBetweenX], 0.1) && ds < 0);
    const centerY = snapping.addSnapToParent({
      point: parentInfo.childEdgeInfo[selfIndex][top].parentMidpointRelative,
      axis: otherAxis,
      range,
    })
    centerY.addCenterAxisGuide({ axis })

    const startY = snapping.addSnapToParent({
      point: parentInfo.edges[top].parentEdge.edgeLocationRelative,
      axis: otherAxis,
      range,
    })
    const endY = snapping.addSnapToParent({
      point: parentInfo.edges[bottom].parentEdge.edgeLocationRelative,
      axis: otherAxis,
      range,
      snapSide: bottom,
    })

    const enoughSpace =
      parentInfo.edges[left].parentEdge.gap >= 20 &&
      parentInfo.edges[right].parentEdge.gap >= 20

    if (isMoving) {
      if (enoughSpace) {
        const centerXDiff = parentInfo[midpoint] - parentInfo[childrenMidpoint]
        const center = snapping.addSnapToParent({
          point: pos + centerXDiff,
          axis,
          range,
        })
        center.addCenterAxisGuide({ axis: otherAxis })
      }
    } else {
      // if ((selfIndex === 0 && ds >= 0) || (selfIndex === parentInfo.childrenCount - 1 && ds <= 0)) {
      // 	const minGapDiff = parentInfo[minGapBetweenX] - minGap;
      // 	const minGapPoint = snapping.addSnapToParent({
      // 		point: pos - (minGapDiff * direction),
      // 		axis,
      // 		range
      // 	});

      // }

      const minSpaceBetweenSnaps = Math.min(
        parentInfo[aroundSpace] - parentInfo[evenlySpace],
        parentInfo[betweenSpace] - parentInfo[aroundSpace],
      )
      if (
        parentInfo[gapBetween] &&
        close(parentInfo[childrenMidpoint], parentInfo[midpoint], 0.5) &&
        minSpaceBetweenSnaps >= 5 &&
        enoughSpace
      ) {
        const spaceEvenlyDiff =
          parentInfo[evenlySpace] - parentInfo[gapBetween]!
        console.log(pos + spaceEvenlyDiff * direction)
        const spaceEvenly = snapping.addSnapToParent({
          point: pos + spaceEvenlyDiff * direction,
          axis,
          range,
        })
        spaceEvenly.addGuide({
          start: {
            [axis as 'x']: {
              relativeTo: parent,
              value: 0,
            },
            [otherAxis as 'y']: {
              relativeTo: parentInfo.childEdgeInfo[0].element,
              value: 0.5,
            },
          },
          length: {
            axis,
            value: parentInfo[evenlySpace],
          },
          text: parentInfo[evenlySpace],
        })
        spaceEvenly.addGuide({
          end: {
            [axis as 'x']: {
              relativeTo: parent,
              value: 1,
            },
            [otherAxis as 'y']: {
              relativeTo: parentInfo.childEdgeInfo[0].element,
              value: 0.5,
            },
          },
          length: {
            axis,
            value: parentInfo[evenlySpace],
          },
          text: parentInfo[evenlySpace],
        })
        for (let i = 0; i < parentInfo.children.length - 1; i++) {
          spaceEvenly.addGuide({
            start: {
              [axis as 'x']: {
                relativeTo: parentInfo.childEdgeInfo[i].element,
                value: 1,
              },
              [otherAxis as 'y']: {
                relativeTo: parentInfo.childEdgeInfo[0].element,
                value: 0.5,
              },
            },
            length: {
              axis,
              value: parentInfo[evenlySpace],
            },
            text: parentInfo[evenlySpace],
          })
        }

        const spaceAroundDiff =
          parentInfo[aroundSpace] - parentInfo[gapBetween]!
        const spaceAround = snapping.addSnapToParent({
          point: pos + spaceAroundDiff * direction,
          axis,
          range,
        })
        spaceAround.addGuide({
          start: {
            [axis as 'x']: {
              relativeTo: parent,
              value: 0,
            },
            [otherAxis as 'y']: {
              relativeTo: parentInfo.childEdgeInfo[0].element,
              value: 0.5,
            },
          },
          length: {
            axis,
            value: parentInfo[aroundSpace] / 2,
          },
          text: parentInfo[aroundSpace] / 2,
        })
        spaceAround.addGuide({
          end: {
            [axis as 'x']: {
              relativeTo: parent,
              value: 1,
            },
            [otherAxis as 'y']: {
              relativeTo: parentInfo.childEdgeInfo[0].element,
              value: 0.5,
            },
          },
          length: {
            axis,
            value: parentInfo[aroundSpace] / 2,
          },
          text: parentInfo[aroundSpace] / 2,
        })
        for (let i = 0; i < parentInfo.children.length - 1; i++) {
          spaceAround.addGuide({
            start: {
              [axis as 'x']: {
                relativeTo: parentInfo.childEdgeInfo[i].element,
                value: 1,
              },
              [otherAxis as 'y']: {
                relativeTo: parentInfo.childEdgeInfo[0].element,
                value: 0.5,
              },
            },
            length: {
              axis,
              value: parentInfo[aroundSpace],
            },
            text: parentInfo[aroundSpace],
          })
        }

        const spaceBetweenDiff =
          parentInfo[betweenSpace] - parentInfo[gapBetween]!
        const spaceBetween = snapping.addSnapToParent({
          point: pos + spaceBetweenDiff * direction,
          axis,
          range,
        })
        for (let i = 0; i < parentInfo.children.length - 1; i++) {
          spaceBetween.addGuide({
            start: {
              [axis as 'x']: {
                relativeTo: parentInfo.childEdgeInfo[i].element,
                value: 1,
              },
              [otherAxis as 'y']: {
                relativeTo: parentInfo.childEdgeInfo[0].element,
                value: 0.5,
              },
            },
            length: {
              axis,
              value: parentInfo[betweenSpace],
            },
            text: parentInfo[betweenSpace],
          })
        }
      }
    }
    //console.log(`dx: ${dx}`);
    return { resultsX, resultsY }
  }
  public onFinish(element: HTMLElement) {
    return element.parentElement!
  }
  public getRestrictions(element: HTMLElement, scale: number) {
    const parent = element.parentElement!
    const style = getComputedStyle(parent)
    const axis = style.flexDirection !== 'column' ? 'x' : 'y'
    const left = axis === 'x' ? 'left' : 'top'
    const right = axis === 'x' ? 'right' : 'bottom'
    const top = axis === 'x' ? 'top' : 'left'
    const bottom = axis === 'x' ? 'bottom' : 'right'
    const minGapBetween = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY'
    const minGap = getMinGap(parent)

    const parentInfo = calculateParentEdgeInfo(parent, 1, scale, false, 'x')
    if (parentInfo.edges === undefined) return undefined

    const myChildInfo = parentInfo.childEdgeInfo.find(
      (info) => info.element === element,
    )

    const parentRect = {
      left: parentInfo.edges.left.parentEdge.edgeLocation,
      right: parentInfo.edges.right.parentEdge.edgeLocation,
      top: parentInfo.edges.top.parentEdge.edgeLocation,
      bottom: parentInfo.edges.bottom.parentEdge.edgeLocation,
    }
    //If there isn't my child info, that might mean we have gone too small and so it does not show up anymore
    if (!myChildInfo) {
      return parentRect
    }
    const selfIndex = myChildInfo.index

    if (!parent.dataset.harmonyFlex || parent.dataset.harmonyFlex === 'false') {
      const _left = myChildInfo[left].siblingEdge
        ? myChildInfo[left].siblingEdge!.edgeLocation
        : myChildInfo[left].parentEdge.edgeLocation
      const _right = myChildInfo[right].siblingEdge
        ? myChildInfo[right].siblingEdge!.edgeLocation
        : myChildInfo[right].parentEdge.edgeLocation
      const _top = myChildInfo[top].parentEdge.edgeLocation //+ getNonWorkableGap(myChildInfo.left.parentEdge.gapTypes)//myChildInfo.left.siblingEdge ? myChildInfo.left.siblingEdge.edgeLocation : myChildInfo.left.parentEdge.edgeLocation;
      const _bottom = myChildInfo[bottom].parentEdge.edgeLocation //- getNonWorkableGap(myChildInfo.right.parentEdge.gapTypes);//myChildInfo.right.siblingEdge ? myChildInfo.right.siblingEdge.edgeLocation : myChildInfo.right.parentEdge.edgeLocation;

      return {
        [top as 'top']: _top,
        [bottom as 'bottom']: _bottom,
        [left as 'left']: _left,
        [right as 'right']: _right,
      }
    }

    if (selfIndex > 0 && selfIndex < parentInfo.children.length - 1) {
      parentRect[left] =
        parentInfo.childEdgeInfo[selfIndex][left].elementLocation -
        parentInfo.edges[left].parentEdge.gap

      parentRect[right] =
        parentInfo.childEdgeInfo[selfIndex][right].elementLocation +
        parentInfo.edges[right].parentEdge.gap
    }

    if (selfIndex === 0 && parentInfo.childEdgeInfo.length > 1) {
      parentRect[right] =
        parentInfo.childEdgeInfo[selfIndex][right].elementLocation +
        (parentInfo[minGapBetween] - minGap) *
          (parentInfo.children.length - 1) +
        parentInfo.edges[right].parentEdge.gap
    }

    if (
      selfIndex === parentInfo.children.length - 1 &&
      parentInfo.childEdgeInfo.length > 1
    ) {
      parentRect[left] =
        parentInfo.childEdgeInfo[selfIndex][left].elementLocation -
        (parentInfo[minGapBetween] - minGap) *
          (parentInfo.children.length - 1) -
        parentInfo.edges[left].parentEdge.gap
    }

    return parentRect
  }
}

const elementSnapBehavior = new ElementSnapping(absoluteUpdator, elementUpdator)
const flexSnapping = new FlexSnapping(absoluteUpdator, flexUpdator)

const getSnappingBehavior = (parent: HTMLElement | undefined) => {
  let snappingBehavior: SnapBehavior = elementSnapBehavior
  if (
    parent &&
    ['flex', 'inline-flex'].includes(getComputedStyle(parent).display)
  ) {
    snappingBehavior = flexSnapping
  }

  return snappingBehavior
}

type SnappableProps = Pick<
  DraggableProps,
  'element' | 'onIsDragging' | 'scale'
> & {
  onDragFinish: (
    element: HTMLElement,
    oldValues: [HTMLElement, Record<string, string>][],
  ) => void
  onError: (error: string | undefined) => void
  enabled: boolean
}
export const useSnapping = ({
  element: elementProps,
  onIsDragging,
  onDragFinish,
  onError,
  scale,
  enabled,
}: SnappableProps) => {
  const [oldValues, setOldValues] = useState<
    [HTMLElement, Record<string, string>][]
  >([])
  const resX = useRef(0)
  const resY = useRef(0)
  const elementsRef = useRef<HTMLElement[]>([])

  //Disables the snapping by setting to undefined
  const element = useMemo(
    () => (enabled ? elementProps : undefined),
    [elementProps, enabled],
  )

  const snappingBehavior = useMemo(
    () => getSnappingBehavior(element?.parentElement || undefined),
    [element],
  )

  function normalizeSnappingResults({
    x,
    y,
    resultsX,
    resultsY,
  }: {
    x: number
    y: number
    resultsX: SnappingResult[]
    resultsY: SnappingResult[]
  }) {
    const parent = element!.parentElement!
    let result: SnappingResult | undefined

    const getActualPosition = (point: number, side: RectSide): number => {
      const axis = side === 'left' || side === 'right' ? 'x' : 'y'
      const close = side === 'left' || side === 'top' ? 'close' : 'far'

      return (
        point +
        (getBoundingClientRect(
          element!.parentElement!,
          axis,
          'close',
          1,
        ) as number) +
        parseFloat($(parent).css(`border${capitalizeFirstLetter(side)}`) || '0')
      )
    }

    const resX = resultsX
      .reduce<SnappingResult[]>((prev, curr) => {
        const same = prev.find((p) => p.x === curr.x)
        if (same) {
          same.snapGuides.push(...curr.snapGuides)
        } else {
          prev.push(curr)
        }

        return prev
      }, [])
      .filter((res) => Math.abs(res.x! - x) < 10)
      .sort((a, b) => a.x! - b.x!)[0]

    const resY = resultsY
      .reduce<SnappingResult[]>((prev, curr) => {
        const same = prev.find((p) => p.y === curr.y)
        if (same) {
          same.snapGuides.push(...curr.snapGuides)
        } else {
          prev.push(curr)
        }

        return prev
      }, [])
      .filter((res) => Math.abs(res.y! - y) < 10)
      .sort((a, b) => a.y! - b.y!)[0]
    if (resX) {
      result = { snapGuides: [] }
      //Our edge calculations are relative to no border, but interact.js is relative to a border, so get rid of
      //the border in the snap calculation
      result.x = resX.x! // + parseFloat($(parent).css('borderLeft') || '0');
      result.range = resX.range
      result.snapGuides.push(
        ...resX.snapGuides.map((guide) => {
          const [key, value] = Object.entries(guide.point)[0]
          const side = key as RectSide

          return {
            ...guide,
            point: {
              [side as 'left']: getActualPosition(Number(value), side),
            },
          }
        }),
      )
    }

    if (resY) {
      result = result || { snapGuides: [] }
      result.y = resY.y! + parseFloat($(parent).css('borderTop') || '0')
      result.range = resY.range
      result.snapGuides.push(
        ...resY.snapGuides.map((guide) => {
          const [key, value] = Object.entries(guide.point)[0]
          const side = key as RectSide

          return {
            ...guide,
            point: {
              [side as 'top']: getActualPosition(Number(value), side),
            },
          }
        }),
      )
    }

    return result
  }

  useEffect(() => {
    for (const element of elementsRef.current) {
      interact(element).unset()
    }

    if (element) {
      // const values = snappingBehavior.getOldValues(element);
      // setOldValues(values);

      if (!elementsRef.current.includes(element)) {
        elementsRef.current.push(element)
      }
    }
  }, [element, elementsRef])

  const updateOldValues = useCallback(
    (updates: UpdatedElement[]) => {
      const copy = oldValues.slice()
      for (const update of updates) {
        const oldValue = copy.find(([old]) => old === update.element)
        if (oldValue) {
          const propertiesCopy = { ...oldValue[1] }
          Object.entries(update.oldValues).forEach(([property, value]) => {
            const old = propertiesCopy[property]
            if (!old) {
              propertiesCopy[property] = value
            }
          })

          oldValue[1] = propertiesCopy
        } else {
          copy.push([update.element, update.oldValues])
        }
      }

      setOldValues(copy)
    },
    [oldValues],
  )

  const applyOldValues = (
    oldValues: [HTMLElement, Record<string, string>][],
  ) => {
    for (const oldValue of oldValues) {
      const [element, values] = oldValue
      Object.entries(values).forEach(([name, value]) => {
        element.style[name as unknown as number] = value
      })
    }
  }

  const setCssCalculations = (
    elementProp: HTMLElement,
    scale: number,
    oldValue: [HTMLElement, unknown][],
  ): [HTMLElement, Record<string, string>][] => {
    const scaledContainer = document.getElementById('harmony-scaled')
    if (!scaledContainer) throw new Error('Cannot find scaled container')
    const scrollContainer = document.getElementById('harmony-scroll-container')
    if (!scrollContainer) throw new Error('Cannot find scroll container')
    const scrollLeft = scrollContainer.scrollLeft
    const scrollTop = scrollContainer.scrollTop
    scaledContainer.style.transform = 'scale(1)'

    const parent = elementProp.parentElement!
    const elementProps: UpdateRectsProps = {
      parentUpdate: {
        element: parent,
        rect: getBoundingRect(parent),
      },
      childrenUpdates: Array.from(parent.children).map((child) => ({
        element: child as HTMLElement,
        rect: getBoundingRect(child as HTMLElement),
      })),
    }
    const props: UpdateRectsProps[] = oldValue.reduce<UpdateRectsProps[]>(
      (prev, [element]) => {
        //Let's not go up more levels than we need to
        if (element === parent) return prev

        const currParent =
          element.dataset.harmonyText === 'true'
            ? elementProp
            : element.parentElement
        if (!currParent) throw new Error('Element should have a parent')

        const currProp = prev.find((p) => p.parentUpdate.element === currParent)
        if (!currProp) {
          prev.push({
            parentUpdate: {
              element: currParent,
              rect: getBoundingRect(currParent),
            },
            childrenUpdates: Array.from(currParent.children).map((child) => ({
              element: child as HTMLElement,
              rect: getBoundingRect(child as HTMLElement),
            })),
          })
        }

        return prev
      },
      [elementProps],
    )

    applyOldValues(oldValues)

    const values = props.reduce<[HTMLElement, Record<string, string>][]>(
      (prev, curr) => {
        const cssUpdator = getSnappingBehavior(
          curr.parentUpdate.element,
        ).getCssUpdator()
        const hasTextNodes =
          curr.parentUpdate.element.childNodes.length === 1 &&
          curr.parentUpdate.element.childNodes[0].nodeType === Node.TEXT_NODE
        if (hasTextNodes) {
          replaceTextContentWithSpans(curr.parentUpdate.element)
          Array.from(curr.parentUpdate.element.children).forEach((child) => {
            const span = child as HTMLElement
            if (span.dataset.harmonyText === 'true') {
              span.style.display = 'block'
            }
          })
        }

        const updates: [HTMLElement, Record<string, string>][] = cssUpdator
          .updateRects(curr, 1, 1)
          .map((update) => [update.element, update.oldValues])

        if (hasTextNodes) {
          removeTextContentSpans(curr.parentUpdate.element)
        }

        const noHarmonyText = updates.filter(
          ([element]) => element.dataset.harmonyText !== 'true',
        )

        for (const update of noHarmonyText) {
          const oldValues = prev.find(([element]) => element === update[0])
          if (oldValues) {
            const propertiesCopy = { ...oldValues[1] }
            Object.entries(update[1]).forEach(([property, value]) => {
              const old = propertiesCopy[property]
              if (!old) {
                propertiesCopy[property] = value
              }
            })

            oldValues[1] = propertiesCopy
          } else {
            prev.push(update)
          }
        }

        return prev
      },
      [],
    )
    scaledContainer.style.transform = `scale(${scale})`
    scrollContainer.scrollLeft = scrollLeft
    scrollContainer.scrollTop = scrollTop

    return values
  }

  const result = useDraggable({
    element,
    onIsDragging(event) {
      if (!element) return

      resX.current =
        getBoundingClientRect(element, 'x', 'close', 1) -
        getBoundingClientRect(element!.parentElement!, 'x', 'close', 1)
      const newY =
        getBoundingClientRect(element, 'y', 'close', 1) -
        getBoundingClientRect(element!.parentElement!, 'y', 'close', 1)
      const s =
        event.eventRect.top -
        getBoundingClientRect(element!.parentElement!, 'y', 'close', 1)
      resY.current = newY

      //TODO: Get rid of this gap dependency
      element.parentElement!.dataset.lastGap = `${parseFloat(element.parentElement!.style.gap || '0')}`
      const updated = snappingBehavior.onUpdate(element, event, scale, false)
      updateOldValues(updated)

      onIsDragging && onIsDragging(event, element)
    },
    onCalculateSnapping(element, x, y, currentX, currentY) {
      const parent = element.parentElement!
      const posX =
        getBoundingClientRect(element, 'x', 'close', 1) -
        getBoundingClientRect(parent, 'x', 'close', 1)
      const posY =
        getBoundingClientRect(element, 'y', 'close', 1) -
        getBoundingClientRect(parent, 'y', 'close', 1)
      const dx = posX - resX.current //posX + getBoundingClientRect(parent, 'x', 'close', 1) - currentX;
      const dy = posY - resY.current ///posY + getBoundingClientRect(parent, 'y', 'close', 1) - currentX;

      const result = snappingBehavior.onCalculateSnapping(
        element,
        posX,
        posY,
        dx,
        dy,
        scale,
        false,
      )

      const res = normalizeSnappingResults({ ...result, x, y })

      return res
    },
    onDragFinish(element) {
      resX.current =
        getBoundingClientRect(element, 'x', 'close', 1) -
        getBoundingClientRect(element!.parentElement!, 'x', 'close', 1)
      resY.current =
        getBoundingClientRect(element, 'y', 'close', 1) -
        getBoundingClientRect(element!.parentElement!, 'y', 'close', 1)

      const cssUpdator = snappingBehavior.getCssUpdator()

      const newOldValues =
        cssUpdator !== snappingBehavior.getPositionUpdator()
          ? setCssCalculations(element, scale, oldValues)
          : oldValues

      onDragFinish(snappingBehavior.onFinish(element), newOldValues)
      setOldValues([])
    },
    canDrag(element) {
      if (element.contentEditable === 'true') return false

      if (!isSelectable(element, scale)) {
        onError('Element is too small to drag')
        return false
      }

      const error = snappingBehavior.isDraggable(element)
      if (error) {
        onError(error)
        return false
      }

      if (!element.parentElement?.dataset.harmonyId) {
        onError("Do not have access to parent component's code")
        return false
      }

      return true
    },
    onCalculateRestrictions(element) {
      return snappingBehavior.getRestrictions(element, scale)
    },
    restrictToParent: true,
    scale,
  })

  const { isResizing } = useResizable({
    element,
    scale,
    onIsResizing(event) {
      if (!element) return

      const parent = element.parentElement as HTMLElement

      //TODO: Super hacky.
      //This just checks to see if we have selected a 'designer element' (one where there is a thin wrapper over an element).
      //Normal we select the outmost component, but we want to apply resizing to the inner most component
      const toResize = selectDesignerElementReverse(element)

      const childrenUpdates = Array.from(toResize.children).map<UpdateRect>(
        (child) => {
          const element = child as HTMLElement
          return { element, rect: getBoundingRect(element) }
        },
      )

      const elementSnap = getSnappingBehavior(parent)
      const updator = elementSnap.getPositionUpdator()
      const updatedFirst = updator.updateRects(
        {
          parentUpdate: {
            element: parent,
            rect: getBoundingRect(parent),
          },
          childrenUpdates: [
            {
              element,
              rect: event.eventRect,
            },
          ],
        },
        scale,
        scale,
      )
      let updatedSecond: UpdatedElement[] = []

      const hasTextNodes =
        toResize.childNodes.length === 1 &&
        toResize.childNodes[0].nodeType === Node.TEXT_NODE
      //Update for all the children too
      if (
        Array.from(toResize.children).filter((child) =>
          isSelectable(child as HTMLElement, scale),
        ).length > 0 ||
        hasTextNodes
      ) {
        if (hasTextNodes) {
          replaceTextContentWithSpans(toResize)
          Array.from(toResize.children).forEach((child) => {
            const span = child as HTMLElement
            if (span.dataset.harmonyText === 'true') {
              span.style.display = 'block'
            }
          })
        }

        const childrenSnap = getSnappingBehavior(toResize)
        const updator = childrenSnap.getPositionUpdator()
        updatedSecond = updator.updateRects(
          {
            parentUpdate: {
              element: toResize,
              rect: event.eventRect,
            },
            childrenUpdates,
          },
          scale,
          scale,
        )

        if (hasTextNodes) {
          removeTextContentSpans(toResize)
        }
      }
      updatedFirst.push(...updatedSecond)
      //Filter out any of the above 'replacetextcontentwithspans' that are no longer in the dom
      updateOldValues(
        updatedFirst.filter((val) => document.body.contains(val.element)),
      )

      onIsDragging && onIsDragging(event, element)
    },
    onCalculateSnapping(element, x, y, currentX, currentY) {
      const parent = element.parentElement!
      const parentEdgeInfo = calculateParentEdgeInfo(
        parent,
        1,
        scale,
        false,
        'x',
      )
      const parentEdgeInfoScaled = calculateParentEdgeInfo(
        parent,
        scale,
        scale,
        false,
        'x',
      )
      const resultsX: SnappingResult[] = []
      const resultsY: SnappingResult[] = []
      const myChildInfo = parentEdgeInfo.childEdgeInfo.find(
        (info) => info.element === element,
      )
      if (!myChildInfo) {
        throw new Error('Cannot find my child info')
      }

      const range = 10 / scale

      if (
        parentEdgeInfo.edges === undefined ||
        parentEdgeInfoScaled.edges === undefined
      )
        return undefined

      const snapping = Snapping({
        parent,
        element,
        parentEdgeInfo: parentEdgeInfo as ParentEdgeInfoRequired,
        resultsX,
        resultsY,
      })

      if (close(parentEdgeInfo.edges.top.parentEdge.gap, 0, 0.1)) {
        const halfHeight = snapping.addSnapToParent({
          point: parentEdgeInfo.midpointYRelative,
          axis: 'y',
          range,
        })

        halfHeight.addGuide({
          start: {
            x: {
              relativeTo: parent,
              value: 0.5,
            },
            y: {
              relativeTo: parent,
              value: 0.5,
            },
          },
          end: {
            x: {
              relativeTo: parent,
              value: 0.5,
            },
            y: {
              relativeTo: parent,
              value: 1,
            },
          },
          edge: 'bottom',
          text: '50%',
        })
      }

      return normalizeSnappingResults({ resultsX, resultsY, x, y })
      // const parent = element.parentElement!;
      // const posX = getBoundingClientRect(element, 'x', 'close', 1) - getBoundingClientRect(parent, 'x', 'close', 1);
      // const posY = getBoundingClientRect(element, 'y', 'close', 1) - getBoundingClientRect(parent, 'y', 'close', 1);
      // const dx = posX  - resX.current//posX + getBoundingClientRect(parent, 'x', 'close', 1) - currentX;
      // const dy = posY - resY.current///posY + getBoundingClientRect(parent, 'y', 'close', 1) - currentX;
      // const result = elementSnapBehavior.onCalculateSnapping(element, posX,posY, dx, dy, scale);

      // return normalizeSnappingResults({...result, x, y});

      // return res;
    },
    onCalculateRestriction(element) {
      return snappingBehavior.getRestrictions(element, scale)
    },
    canResize(element) {
      if (element.contentEditable === 'true') return false

      if (!isSelectable(element, scale)) {
        onError('Element is too small to resize')
        return false
      }

      const error = snappingBehavior.isDraggable(element)
      if (error) {
        onError(error)
        return false
      }

      if (!element.parentElement?.dataset.harmonyId) {
        onError("Do not have access to parent component's code")
        return false
      }

      return true
    },
    onResizeFinish(element) {
      const cssUpdator = snappingBehavior.getCssUpdator()

      const newOldValues =
        cssUpdator !== snappingBehavior.getPositionUpdator()
          ? setCssCalculations(element, scale, oldValues)
          : oldValues

      onDragFinish(snappingBehavior.onFinish(element), newOldValues)
      setOldValues([])
    },
  })

  return { isDragging: result.isDragging || isResizing, isResizing }
}

const handleGuides = (
  rect: RectBox,
  snapPoints: SnapPoint[],
  scale: number,
) => {
  const $parent = $('#harmony-snap-guides')
  const createGuide = (rect: {
    x0: number
    y0: number
    y1: number
    x1: number
    text?: string | number
  }) => {
    const height = rect.y1 - rect.y0 || 1
    const width = rect.x1 - rect.x0 || 1

    const lineTemplate = `<div name="harmony-guide-0" class="bg-primary absolute z-[100]" style="top: ${rect.y0}px; left: ${rect.x0}px; height: ${height}px; width: ${width}px">
            ${
              rect.text && height > 1
                ? `<div class="bg-primary rounded-full absolute text-[8px] p-1 text-white top-1/2 -translate-y-1/2 left-1">
                ${typeof rect.text === 'number' ? round(rect.text, 2) : rect.text}
            </div>`
                : rect.text && width > 1
                  ? `<div class="bg-primary rounded-full absolute text-[8px] p-1 text-white left-1/2 -translate-x-1/2 top-1">
            ${typeof rect.text === 'number' ? round(rect.text, 2) : rect.text}
        </div>`
                  : ''
            }
        </div>`

    const $line = $(lineTemplate)
    $line.appendTo($parent)
    return $line
  }

  const setOffset = (
    element: HTMLElement,
  ): { x: number; y: number; w: number; h: number } => {
    const rect = element.getBoundingClientRect()
    return {
      x: element.offsetLeft * scale,
      y: element.offsetTop * scale,
      w: element.clientWidth * scale,
      h: element.clientHeight * scale,
    }
  }

  snapPoints.forEach((snapPoint) => {
    const { point, guides } = snapPoint
    const offsetParent = snapPoint.offset
      ? setOffset(snapPoint.offset)
      : undefined

    const [key, keyValue] = Object.entries(point)[0] as [RectSide, number]
    const value = rect[key]
    const pointValue = Number(keyValue)

    if (close(value, pointValue, 0.1)) {
      guides &&
        guides.forEach((guide) => {
          const offset = guide.offset
            ? setOffset(guide.offset)
            : offsetParent || { x: 0, y: 0, w: 0, h: 0 }
          const copy = { ...guide }
          copy.relative.forEach((p) => {
            const sizeY = guide.rotate ? offset.w : offset.h
            const sizeX = guide.rotate ? offset.h : offset.w
            const sizeOffset = p.includes('y') ? sizeY : sizeX
            copy[p] *= sizeOffset
          })

          if (guide.rotate) {
            const temp0 = copy.x0
            copy.x0 = copy.y0
            copy.y0 = temp0
            const temp1 = copy.x1
            copy.x1 = copy.y1
            copy.y1 = temp1
          }

          copy.x0 += offset.x
          copy.y0 += offset.y
          copy.y1 += offset.y
          copy.x1 += offset.x

          copy.x0 /= scale
          copy.y0 /= scale
          copy.y1 /= scale
          copy.x1 /= scale

          createGuide(copy)
        })
    }
  })
}

interface DraggingEvent {
  dx: number
  dy: number
  offsetRect: Rect
  eventRect: Rect
}

interface SnappingResult {
  x?: number
  y?: number
  range?: number
  snapGuides: SnapPoint[]
}

export interface MarginValues {
  marginLeft: string
  marginRight: string
  marginTop: string
  marginBottom: string
  display: string
}
export interface FlexValues {
  paddingLeft: string
  paddingRight: string
  paddingTop: string
  paddingBottom: string
  justifyContent: string
  alignItems: string
  gap: string
}
interface DraggableProps {
  element: HTMLElement | undefined
  onIsDragging?: (event: DraggingEvent, element: HTMLElement) => void
  //TODO: Do something better to not have a dependency on FlexValues
  onDragFinish?: (parent: HTMLElement) => void
  onCalculateRestrictions: (element: HTMLElement) => RectBox | undefined
  onCalculateSnapping?: (
    element: HTMLElement,
    x: number,
    y: number,
    currentX: number,
    currentY: number,
  ) => SnappingResult | undefined
  snapPoints?: SnapPoint[]
  restrictToParent?: boolean
  scale: number
  canDrag: (element: HTMLElement) => boolean
}
export const useDraggable = ({
  element,
  onIsDragging,
  onCalculateSnapping,
  onCalculateRestrictions,
  onDragFinish,
  canDrag,
  restrictToParent = false,
  scale,
}: DraggableProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [offsetX, setOffsetX] = useState<number>(0)
  const [offsetY, setOffsetY] = useState<number>(0)
  const refX = useRef(0)
  const refY = useRef(0)
  const snapGuides = useRef<SnapPoint[]>([])
  const shiftSnapper = useRef<{ x: number; y: number }>(undefined)
  const $parent = $('#harmony-snap-guides')

  useEffect(() => {
    if (element) {
      refY.current = getBoundingClientRect(element, 'y', 'close', scale)
      refX.current = getBoundingClientRect(element, 'x', 'close', scale)
      setOffsetX(refX.current)
      setOffsetY(refY.current)

      const modifiers: Modifier[] = [
        // interact.modifiers.snap({
        // 	targets: [function() {
        // 		if (shiftSnapper.current) {
        // 			return {x: shiftSnapper.current.x};
        // 		}
        // 	}, function() {
        // 		if (shiftSnapper.current) {
        // 			return {y: shiftSnapper.current.y};
        // 		}
        // 	}],
        // 	range: Infinity,
        // 	relativePoints: [{x: 0, y: 0}],
        // }),
        interact.modifiers.snap({
          targets: [interact.createSnapGrid({ x: 2 / scale, y: 2 / scale })],
          // Control the snapping behavior
          range: Infinity, // Snap to the closest target within the entire range
          relativePoints: [{ x: 0, y: 0 }],
          offset: 'self',
        }),
        interact.modifiers.snap({
          targets: [
            function target(x, y, interaction, offset, index) {
              if (!onCalculateSnapping) return

              const result = onCalculateSnapping(
                element,
                x,
                y,
                refX.current,
                refY.current,
              )
              if (!result) return

              snapGuides.current = result.snapGuides

              return result
            },
          ],
          // Control the snapping behavior
          range: Infinity, // Snap to the closest target within the entire range
          relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
          offset: 'parent',
        }),
      ]
      if (restrictToParent) {
        modifiers.push(
          interact.modifiers.restrict({
            restriction: 'parent',
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }, // Restrict to the parent element
          }),
        )
      }

      modifiers.push(
        interact.modifiers.restrict({
          restriction: function (e, a, b) {
            const rect = onCalculateRestrictions(element)

            return rect || element.parentElement!
          },
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        }),
      )

      interact(element)
        .draggable({
          listeners: {
            start: startDragging,
            move: drag,
            end: stopDragging,
          },
          modifiers,
          cursorChecker: function (a, b, e, interacting) {
            const getCursor = () => {
              if ((e as HTMLElement).contentEditable === 'true') {
                return 'auto'
              }

              return 'move'
            }
            const cursor = getCursor()
            e.style.cursor = cursor
            selectDesignerElementReverse(e as HTMLElement).style.cursor = cursor

            return cursor
          },

          //inertia: true
        })
        .on('move', startIt)

      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
    }
  }, [element, scale, shiftSnapper])

  function startIt(event: InteractEvent<'drag', 'start'>) {
    const interaction = event.interaction

    if (!interaction.interacting()) {
      interaction.start(
        { name: 'drag' },
        event.interactable,
        event.currentTarget,
      )
    }

    event.interactable.off('move', startIt)
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    //TODO: Dependency on contentEditable. This hook should not know about that
    if (!element || element.contentEditable === 'true') return

    if (e.key === 'Shift') {
      const rect = element.getBoundingClientRect()
      shiftSnapper.current = { x: rect.left, y: rect.top }
    }

    let axis: Axis | undefined
    let amount = 5
    switch (e.key) {
      case 'ArrowLeft':
        amount *= -1
        axis = 'x'
        break
      case 'ArrowRight':
        axis = 'x'
        break
      case 'ArrowUp':
        amount *= -1
        axis = 'y'
        break
      case 'ArrowDown':
        axis = 'y'
        break
    }
    if (axis === undefined) return

    e.preventDefault()
    setOffsetX(axis === 'x' ? offsetX + amount : offsetX)
    setOffsetY(axis === 'y' ? offsetY + amount : offsetY)
    const rect = element.getBoundingClientRect()
    changeByAmount(
      element,
      {
        left: axis === 'x' ? offsetX + amount : offsetX,
        top: axis === 'y' ? offsetY + amount : offsetY,
        width: rect.width,
        height: rect.height,
      },
      setIsDragging,
    )
  })

  const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      shiftSnapper.current = undefined
    }
  })

  const startDragging = useEffectEvent(
    (event: InteractEvent<'drag', 'start'>) => {},
  )

  const handleTheDragging = (event: DraggingEvent) => {
    if (!element) return
    !isDragging && setIsDragging(true)

    refY.current = event.offsetRect.top
    refX.current = event.offsetRect.left
    onIsDragging && onIsDragging(event, element)

    $parent.children().remove()
    handleGuides(event.eventRect, snapGuides.current, scale)
  }

  const drag = useEffectEvent((event: InteractEvent<'drag', 'move'>) => {
    if (!element || !canDrag(element)) {
      setIsDragging(false)
      return
    }
    const rect = getOffsetRect(element)
    rect.left += event.dx / scale
    rect.right += event.dx / scale
    rect.top += event.dy / scale
    rect.bottom += event.dy / scale

    handleTheDragging({
      dx: event.dx,
      dy: event.dy,
      offsetRect: rect,
      eventRect: event.rect,
    })
  })

  const stopDragging = useEffectEvent((e: InteractEvent<'drag', 'move'>) => {
    $parent.children().remove()
    if (!element || !isDragging) return

    setIsDragging(false)
    onDragFinish && onDragFinish(element)
  })

  return { isDragging }
}

type ResizingEvent = DraggingEvent & {
  edges: { top: boolean; bottom: boolean; left: boolean; right: boolean }
  deltaRect: Required<ResizeEvent<'move'>>['deltaRect']
}

//TODO: Refactor out duplicate code into useSnappable hook
interface ResizableProps {
  element: HTMLElement | undefined
  scale: number
  onIsResizing?: (event: ResizingEvent) => void
  onResizeFinish?: (element: HTMLElement) => void
  onCalculateSnapping?: (
    element: HTMLElement,
    x: number,
    y: number,
    currentX: number,
    currentY: number,
  ) => SnappingResult | undefined
  onCalculateRestriction: (element: HTMLElement) => RectBox | undefined
  canResize: (element: HTMLElement) => boolean
}
export const useResizable = ({
  element,
  scale,
  canResize,
  onIsResizing,
  onResizeFinish,
  onCalculateSnapping,
  onCalculateRestriction,
}: ResizableProps) => {
  const [isResizing, setIsResizing] = useState(false)
  const snapGuides = useRef<SnapPoint[]>([])
  const refX = useRef(0)
  const refY = useRef(0)
  const aspectRef =
    useRef<
      Modifier<AspectRatioOptions, AspectRatioState, 'aspectRatio', unknown>
    >(undefined)
  const $parent = $('#harmony-snap-guides')

  useEffect(() => {
    if (element) {
      const modifiers: Modifier[] = [
        interact.modifiers.snap({
          targets: [interact.createSnapGrid({ x: 2 * scale, y: 2 * scale })],
          // Control the snapping behavior
          range: Infinity, // Snap to the closest target within the entire range
          relativePoints: [{ x: 0, y: 0 }],
          offset: 'self',
        }),
        interact.modifiers.snapEdges({
          targets: [
            function target(x, y, interaction, offset, index) {
              if (!onCalculateSnapping) return

              const result = onCalculateSnapping(
                element,
                x,
                y,
                refX.current,
                refY.current,
              )
              if (!result) return

              snapGuides.current = result.snapGuides

              return result
            },
          ],
          // Control the snapping behavior
          range: Infinity, // Snap to the closest target within the entire range
          //relativePoints: [{ x: 0, y: 0 }], // Snap relative to the top-left corner of the draggable element
          offset: 'parent',
        }),
      ]
      if (true) {
        //TODO: Remove this dependency on edge info
        const parent = element.parentElement!
        const parentStyle = getComputedStyle(parent)
        const style = getComputedStyle(element)
        const toMeasure = selectDesignerElementReverse(element)

        const validSibiling = (side: RectSide, myInfo: ChildEdgeInfo) => {
          const otherSideClose =
            side === 'left' || side === 'right' ? 'top' : 'left'
          const otherSideFar = otherSideClose === 'top' ? 'bottom' : 'right'

          const selfRect = getBoundingRect(myInfo.element)
          const selfLocationClose = myInfo[otherSideClose].elementLocation
          const selfLocationFar = myInfo[otherSideFar].elementLocation
          const sibiling = myInfo[side].siblingEdge?.edgeElement
          if (sibiling !== undefined) {
            const rect = getBoundingRect(sibiling)
            if (
              (rect[otherSideClose] >= selfLocationClose &&
                rect[otherSideClose] <= selfLocationFar) ||
              (rect[otherSideFar] >= selfLocationClose &&
                rect[otherSideFar] <= selfLocationFar)
            ) {
              return true
            }
          }

          return false
        }

        const considerTheYs =
          !parentStyle.display.includes('flex') ||
          parentStyle.flexDirection === 'column'
        modifiers.push(
          interact.modifiers.restrictEdges({
            inner:
              toMeasure.children.length > 0 &&
              !isTextElement(toMeasure) &&
              !isImageElement(toMeasure)
                ? function bob() {
                    const toMeasureInfo = calculateParentEdgeInfoWithSizing(
                      toMeasure,
                      1,
                      scale,
                      false,
                      'x',
                    )

                    return toMeasureInfo.edges
                      ? {
                          left: toMeasureInfo.edges.left.elementLocation,
                          right: toMeasureInfo.edges.right.elementLocation,
                          top:
                            toMeasureInfo.edges.top.elementLocation -
                            getNonWorkableGap(
                              toMeasureInfo.edges.top.parentEdge.gapTypes,
                            ),
                          bottom:
                            toMeasureInfo.edges.bottom.elementLocation +
                            (toMeasureInfo.heightType === 'content'
                              ? getNonWorkableGap(
                                  toMeasureInfo.edges.bottom.parentEdge
                                    .gapTypes,
                                )
                              : 0),
                        }
                      : getBoundingRect(toMeasure)
                  }
                : undefined,
            outer: function () {
              const parentInfo = calculateParentEdgeInfo(
                parent,
                1,
                scale,
                false,
                'x',
              )
              const myInfo = parentInfo.childEdgeInfo.find(
                (info) => info.element === element,
              )
              if (!myInfo) throw new Error('Cannot find my info')

              return parentInfo.edges
                ? {
                    left: validSibiling('left', myInfo)
                      ? Math.max(
                          parentInfo.edges.left.parentEdge.edgeLocation,
                          myInfo.left.siblingEdge?.edgeLocation || 0,
                        )
                      : parentInfo.edges.left.parentEdge.edgeLocation,
                    right: validSibiling('right', myInfo)
                      ? Math.min(
                          parentInfo.edges.right.parentEdge.edgeLocation,
                          myInfo.right.siblingEdge?.edgeLocation || Infinity,
                        )
                      : parentInfo.edges.right.parentEdge.edgeLocation,
                    top: considerTheYs
                      ? Math.max(
                          parentInfo.edges.top.parentEdge.edgeLocation,
                          myInfo.top.siblingEdge?.edgeLocation || 0,
                        )
                      : parentInfo.edges!.top.parentEdge.edgeLocation,
                    bottom: considerTheYs
                      ? Math.min(
                          parentInfo.edges.bottom.parentEdge.edgeLocation,
                          myInfo.bottom.siblingEdge?.edgeLocation || Infinity,
                        )
                      : parentInfo.edges!.bottom.parentEdge.edgeLocation,
                  }
                : getBoundingRect(parentInfo.element)
            },
          }),
        )
        //TODO: Remove isImage dependency (This is here because we want to be able to resize an image at will till the minimum size)
        const { width, height } = isImageElement(toMeasure)
          ? { width: 20, height: 20 }
          : getFitContentSize(toMeasure)
        let maxWidth = parseFloat(style.maxWidth)
        if (isNaN(maxWidth)) {
          maxWidth = Infinity
        }
        let maxHeight = parseFloat(style.maxHeight)
        if (isNaN(maxHeight)) {
          maxHeight = Infinity
        }

        let minWidth = parseFloat(style.minWidth)
        if (isNaN(minWidth)) {
          minWidth = Infinity
        }
        let minHeight = parseFloat(style.minHeight)
        if (isNaN(minHeight)) {
          minHeight = -Infinity
        }
        const toMeasureRect = {
          width: toMeasure.clientWidth,
          height: toMeasure.clientHeight,
        } //getBoundingRect(toMeasure);
        modifiers.push(
          interact.modifiers.restrictSize({
            //TODO: Hacky fix for when a flex-basis flex-col item is measured, it comes out all wrong
            min: {
              width:
                width <= toMeasureRect.width && width > 0
                  ? minWidth < Infinity
                    ? minWidth
                    : Math.min(width, minWidth)
                  : 20 * scale,
              height:
                height <= toMeasureRect.height
                  ? Math.max(height, minHeight)
                  : 20 * scale,
            },
            max: { width: maxWidth, height: maxHeight },
          }),
        )
      }

      modifiers.push(
        interact.modifiers.restrictEdges({
          outer: function () {
            return onCalculateRestriction(element) || element.parentElement!
          },
        }),
      )

      aspectRef.current = interact.modifiers
        .aspectRatio({
          ratio: 'preserve',
          modifiers,
        })
        .disable()

      interact(element).resizable({
        edges: { left: true, bottom: true, right: true, top: true },
        listeners: {
          start: startResizing,
          move: resize,
          end: stopResizing,
        },
        modifiers: [aspectRef.current, ...modifiers],
        margin: 6 * scale,
        cursorChecker: function (action, b, element, d) {
          if (!action.edges) return 'default'

          const getCursor = (edges: EdgeOptions) => {
            if ((edges.top && edges.right) || (edges.bottom && edges.left)) {
              return 'nesw-resize'
            }

            if ((edges.top && edges.left) || (edges.bottom && edges.right)) {
              return 'nwse-resize'
            }

            if (edges.left || edges.right) {
              return 'ew-resize'
            }

            if (edges.top || edges.bottom) {
              return 'ns-resize'
            }

            return 'default'
          }

          const cursor = getCursor(action.edges)
          element.style.cursor = cursor
          selectDesignerElementReverse(element as HTMLElement).style.cursor =
            cursor

          return cursor
        },
      })

      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [element, scale, aspectRef])

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      aspectRef.current?.enable()
    }
  })

  const onKeyUp = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      aspectRef.current?.disable()
    }
  })

  const handleTheResizing = (event: ResizingEvent) => {
    if (!element) return
    !isResizing && setIsResizing(true)

    refY.current = event.offsetRect.top
    refX.current = event.offsetRect.left
    onIsResizing && onIsResizing(event)

    $parent.children().remove()
    handleGuides(event.eventRect, snapGuides.current, scale)
  }

  const startResizing = useEffectEvent(
    (event: InteractEvent<'resize', 'start'>) => {},
  )

  const resize = useEffectEvent((event: ResizeEvent<'move'>) => {
    if (!element || !canResize(element)) return

    if (!event.deltaRect) {
      throw new Error("Let's figure out why delta rect doesn't exist")
    }

    if (!event.edges) {
      throw new Error("Let's figure out why delta rect doesn't exist")
    }

    const rect = getOffsetRect(element)
    rect.left += round(event.deltaRect.left / scale)
    rect.right += round(event.deltaRect.right / scale)
    rect.top += round(event.deltaRect.top / scale)
    rect.bottom += round(event.deltaRect.bottom / scale)
    rect.width += round(event.deltaRect.width / scale)
    rect.height += round(event.deltaRect.height / scale)

    handleTheResizing({
      dx: event.dx,
      dy: event.dy,
      deltaRect: event.deltaRect,
      offsetRect: rect,
      eventRect: event.rect,
      edges: {
        top: Boolean(event.edges.top),
        bottom: Boolean(event.edges.bottom),
        left: Boolean(event.edges.left),
        right: Boolean(event.edges.right),
      },
    })
  })

  const stopResizing = useEffectEvent(
    (event: InteractEvent<'resize', 'end'>) => {
      setIsResizing(false)
      if (!element) return
      $parent.children().remove()
      onResizeFinish && onResizeFinish(element)
    },
  )

  return { isResizing }
}

interface DraggableListProps {
  onDragFinish?: (props: {
    element: HTMLElement
    aborter: AbortController
    from: number
    to: number
  }) => void
  onIsDragging?: () => void
}
export const useDraggableList = ({
  onDragFinish,
  onIsDragging,
}: DraggableListProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const fromRef = useRef(-1)
  const toRef = useRef(-1)

  const makeDraggable = (
    element: HTMLElement,
    aborter: AbortController,
  ): void => {
    //element.draggable = true;

    const onDragOver = (event: DragEvent) => {
      //event.preventDefault();
      onDragEnter(event)
    }

    const onDragEnter = (event: DragEvent) => {
      const draggedElement = document.querySelector('.dragging')
      const target = selectDesignerElement(event.target as HTMLElement)
      if (
        draggedElement &&
        target.parentElement === draggedElement.parentElement
      ) {
        const boundingRect = target.getBoundingClientRect()
        const midY = boundingRect.top + boundingRect.height / 2

        if (event.clientY < midY) {
          // Place dragged element before the current target
          target.parentElement!.insertBefore(draggedElement, target)
        } else {
          // Place dragged element after the current target
          target.parentElement!.children.length
          target.parentElement!.insertBefore(draggedElement, target.nextSibling)
        }
        toRef.current = Array.from(
          draggedElement.parentElement!.children,
        ).indexOf(draggedElement)
        onIsDragging && onIsDragging()
      }
    }

    const onDragEnd = () => {
      const draggedElement = document.querySelector('.dragging')
      if (draggedElement) {
        draggedElement.classList.remove('dragging')
        setIsDragging(false)
        onDragFinish &&
          onDragFinish({
            element,
            aborter,
            from: fromRef.current,
            to: toRef.current,
          })
      }
    }

    const onDragStart = (event: DragEvent) => {
      event.dataTransfer!.setData('text/plain', '') // Required for Firefox
      if (!(event.target instanceof HTMLElement)) return

      event.target!.classList.add('dragging')

      const parent = event.target.parentElement

      if (!parent) return

      for (const sibling of Array.from(parent.children)) {
        if (sibling !== element) {
          ;(sibling as HTMLElement).addEventListener('dragover', onDragOver, {
            signal: aborter.signal,
          })
          ;(sibling as HTMLElement).addEventListener('dragenter', onDragEnter, {
            signal: aborter.signal,
          })
        }
      }

      fromRef.current = Array.from(event.target.parentElement.children).indexOf(
        event.target,
      )
      setIsDragging(true)
    }

    element.addEventListener('dragstart', onDragStart, {
      signal: aborter.signal,
    })

    element.addEventListener('dragover', onDragOver, {
      signal: aborter.signal,
    })

    element.addEventListener('dragenter', onDragEnter, {
      signal: aborter.signal,
    })

    element.addEventListener('dragend', onDragEnd, { signal: aborter.signal })
  }

  return { isDragging, makeDraggable }
}

export const changeByAmount = (
  element: HTMLElement,
  eventRect: Omit<Rect, 'bottom' | 'right'>,
  setIsDragging?: (isDragging: boolean) => void,
) => {
  const rect = element.getBoundingClientRect()

  const start = new PointerEvent('pointermove', {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    pointerType: 'mouse',
    bubbles: true,
  })
  const down = new PointerEvent('pointerdown', {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    pointerType: 'mouse',
    bubbles: true,
  })
  const move = new PointerEvent('pointermove', {
    clientX: eventRect.left + eventRect.width / 2,
    clientY: eventRect.top + eventRect.height / 2,
    pointerType: 'mouse',
    bubbles: true,
  })
  const up = new PointerEvent('pointerup', {
    clientX: eventRect.left + eventRect.width / 2,
    clientY: eventRect.top + eventRect.height / 2,
    pointerType: 'mouse',
    bubbles: true,
  })
  setIsDragging && setIsDragging(true)
  element.dispatchEvent(start)
  element.dispatchEvent(down)
  element.dispatchEvent(move)
  element.dispatchEvent(up)
  setIsDragging && setIsDragging(false)
}
