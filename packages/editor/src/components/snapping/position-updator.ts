/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
/* eslint-disable @typescript-eslint/prefer-includes -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/

/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
/* eslint-disable import/no-cycle -- ok*/
import { close, round } from '@harmony/util/src/utils/common'
import type { Rect } from '../inspector/inspector'
import { selectDesignerElementReverse } from '../inspector/inspector'
import type { RectSide } from './calculations'
import {
  calculateFlexParentEdgeInfoWithSizing,
  calculateParentEdgeInfoWithSizing,
  getBoundingRect,
  getProperty,
  getSiblingGap,
  setSpaceForElement,
} from './calculations'
import { isSelectable } from './snapping'

export interface UpdatedElement {
  element: HTMLElement
  oldValues: Record<string, string>
}
export interface PositionUpdator {
  updateRects: (
    props: UpdateRectsProps,
    scale: number,
    scaleActual: number,
  ) => UpdatedElement[]
}

export interface UpdateRect {
  element: HTMLElement
  proxyElement?: HTMLElement
  rect: Rect
}
export interface UpdateRectsProps {
  parentUpdate: UpdateRect
  childrenUpdates: UpdateRect[]
}

export const getComputedValue = (
  element: HTMLElement | StylePropertyMapReadOnly,
  property: string,
): string => {
  const styleMap =
    'computedStyleMap' in element ? element.computedStyleMap() : element
  const styleValue = styleMap.get(property)
  if (!styleValue) return ''

  if (styleValue instanceof CSSKeywordValue) {
    return styleValue.value
  }
  return styleValue.toString()
}

const updateElementValues = (
  element: HTMLElement,
  properties: string[],
  updatedElements: UpdatedElement[],
) => {
  const currElement = updatedElements.find(
    (updated) => updated.element === element,
  )
  const style = getComputedStyle(element)
  const styleMap = element.computedStyleMap()

  const setValue = (values: Record<string, string>, property: string) => {
    if (['width', 'height'].includes(property)) {
      values[property] = getComputedValue(styleMap, property)
    } else if (property === 'margin') {
      values.marginLeft = getComputedValue(styleMap, 'margin-left')
      values.marginRight = getComputedValue(styleMap, 'margin-right')
      values.marginTop = getComputedValue(styleMap, 'margin-top')
      values.marginBottom = getComputedValue(styleMap, 'margin-bottom')
    } else {
      values[property] = style[property as unknown as number]!
    }
  }
  if (currElement) {
    properties.forEach((property) => {
      if (!currElement.oldValues[property]) {
        setValue(currElement.oldValues, property)
      }
    })
  } else {
    const oldValues = properties.reduce<Record<string, string>>(
      (prev, curr) => {
        setValue(prev, curr)

        return prev
      },
      {},
    )
    updatedElements.push({ element, oldValues })
  }
}

export const absoluteUpdator: PositionUpdator = {
  updateRects({ parentUpdate, childrenUpdates }, scale) {
    const updatedElements: UpdatedElement[] = []

    const updateSize = (element: HTMLElement, rect: Rect) => {
      const toResize = selectDesignerElementReverse(element)
      updateElementValues(element, ['width', 'height'], updatedElements)
      updateElementValues(toResize, ['width', 'height'], updatedElements)

      const updateSide = (element: HTMLElement, side: 'width' | 'height') => {
        const currSize = parseFloat(element.style[side])
        const size = rect[side] / scale
        //For some reason, the sizes are not 100% accurate so they go down by 0.001 place increments when you moving things.
        //This affects the text by making it wrap. So only apply the size if we need to
        if (
          isNaN(currSize) ||
          !/px/.test(element.style.width) ||
          !close(currSize, size, 0.1)
        ) {
          element.style[side] = `${size}px`
        }
      }

      updateSide(element, 'width')
      updateSide(element, 'height')
      updateSide(toResize, 'width')
      updateSide(toResize, 'height')
    }

    const updateTransform = (element: HTMLElement, rect: Rect) => {
      updateElementValues(
        element,
        ['position', 'left', 'top', 'margin', 'width', 'height'],
        updatedElements,
      )

      element.style.position = 'absolute'
      element.style.left = `${(rect.left - containerRect.left) / scale - getProperty(parentUpdate.element, 'border', 'left')}px`
      element.style.top = `${(rect.top - containerRect.top) / scale - getProperty(parentUpdate.element, 'border', 'top')}px`
      element.style.margin = '0px'
      element.dataset.harmonyForceSelectable = 'true'
      updateSize(element, rect)
    }

    const container = document.getElementById('harmony-section')
    if (!container) {
      throw new Error('Cannot find harmony section')
    }
    const containerRect = getBoundingRect(parentUpdate.element)

    for (const child of Array.from(parentUpdate.element.children)) {
      const element = child as HTMLElement
      if (
        childrenUpdates.find((up) => up.element === element) ||
        !isSelectable(element, scale)
      )
        continue

      childrenUpdates.push({ element, rect: getBoundingRect(element) })
    }

    updateElementValues(
      parentUpdate.element,
      ['position', 'width', 'height'],
      updatedElements,
    )

    if (parentUpdate.element.style.position !== 'absolute') {
      parentUpdate.element.style.position = 'relative'
    }
    parentUpdate.element.style.width = `${parentUpdate.rect.width / scale}px`
    parentUpdate.element.style.height = `${parentUpdate.rect.height / scale}px`

    for (const childUpdate of childrenUpdates) {
      updateTransform(childUpdate.element, childUpdate.rect)
    }

    return updatedElements
  },
}

export const elementUpdator: PositionUpdator = {
  updateRects(
    { parentUpdate, childrenUpdates }: UpdateRectsProps,
    scale: number,
    scaleActual: number,
  ) {
    const parentInfo = calculateParentEdgeInfoWithSizing(
      parentUpdate.element,
      scale,
      scaleActual,
      false,
      'x',
      [parentUpdate, ...childrenUpdates],
    )
    if (!parentInfo.edges) return []

    const left = 'left'
    const right = 'right'
    const top = 'top'
    const bottom = 'bottom'
    const updatedElements: UpdatedElement[] = []

    updateElementValues(
      parentInfo.element,
      ['paddingRight', 'paddingLeft', 'paddingTop', 'paddingBottom'],
      updatedElements,
    )

    setSpaceForElement(parentInfo.element, 'padding', left, 0)
    setSpaceForElement(parentInfo.element, 'padding', right, 0)
    setSpaceForElement(parentInfo.element, 'padding', top, 0)
    setSpaceForElement(parentInfo.element, 'padding', bottom, 0)
    for (const info of parentInfo.childEdgeInfo) {
      updateElementValues(
        info.element,
        ['marginRight', 'marginLeft', 'marginTop', 'marginBottom'],
        updatedElements,
      )

      setSpaceForElement(info.element, 'margin', left, 0)
      setSpaceForElement(info.element, 'margin', right, 0)
      setSpaceForElement(info.element, 'margin', top, 0)
      setSpaceForElement(info.element, 'margin', bottom, 0)

      const isBlock = getComputedStyle(info.element).display === 'block'

      const isChildXCenter =
        close(info.midpointX, parentInfo.midpointXRelative, 0.1) &&
        close(
          parentInfo.edges.left.parentEdge.gap,
          parentInfo.edges.right.parentEdge.gap,
          0.1,
        )
      const startXSide: RectSide =
        !isBlock || info.midpointX <= parentInfo.midpointXRelative
          ? left
          : right
      const endXSide = startXSide === left ? right : left

      //left
      if (startXSide === right) {
        setSpaceForElement(info[endXSide].element, 'margin', endXSide, 'auto')
      }
      const parentGap = Math.max(
        getSiblingGap(
          parentInfo.edges[startXSide].parentEdge.gap,
          parentInfo.edges[startXSide].parentEdge.gapTypes,
        ),
        0,
      )
      const remainingGap = info[startXSide].parentEdge.gap - parentGap
      setSpaceForElement(
        info[startXSide].element,
        'margin',
        startXSide,
        remainingGap,
      )
      setSpaceForElement(parentInfo.element, 'padding', startXSide, parentGap)
      if (
        isChildXCenter &&
        isBlock &&
        remainingGap > 0 &&
        info.widthType !== 'expand'
      ) {
        setSpaceForElement(info[left].element, 'margin', left, 'auto')
        setSpaceForElement(info[right].element, 'margin', right, 'auto')
      }

      //right - width naturally expands in div block
      if (info.widthType === 'fixed') {
        const toResize = selectDesignerElementReverse(info.element)
        updateElementValues(toResize, ['width'], updatedElements)
        toResize.style.width = `${info.width}px`
      } else if (info.widthType === 'expand') {
        const parentGap = Math.max(
          getSiblingGap(
            parentInfo.edges[endXSide].parentEdge.gap,
            parentInfo.edges[endXSide].parentEdge.gapTypes,
          ),
          0,
        )
        const remainingGap = info[endXSide].parentEdge.gap - parentGap
        setSpaceForElement(
          info[endXSide].element,
          'margin',
          endXSide,
          remainingGap,
        )
        setSpaceForElement(parentInfo.element, 'padding', endXSide, parentGap)
      } else {
        updateElementValues(info.element, ['width'], updatedElements)
        info.element.style.width = 'auto'
      }

      //top
      if (info.index === 0) {
        const parentGap = getSiblingGap(
          parentInfo.edges[top].parentEdge.gap,
          parentInfo.edges[top].parentEdge.gapTypes,
        )
        setSpaceForElement(parentInfo.element, 'padding', top, parentGap)
      } else {
        if (!info.top.siblingEdge)
          throw new Error('Non first child should have a sibling')

        const gap = getSiblingGap(
          info.top.siblingEdge.gap,
          info.top.siblingEdge.gapTypes,
        )
        let foundGap = false
        for (const type of info.top.siblingEdge.gapTypes) {
          if (type.type === 'empty') continue

          if (type.type.includes('margin')) {
            if (gap - type.value >= 0) {
              type.style &&
                updateElementValues(type.element, [type.style], updatedElements)
              type.element.style[type.style as unknown as number] = '0px'
            } else {
              type.style &&
                updateElementValues(type.element, [type.style], updatedElements)
              type.element.style[type.style as unknown as number] = `${gap}px`
              foundGap = true
              break
            }
          }
        }
        if (!foundGap) {
          setSpaceForElement(info.element, 'margin', top, gap)
        }
      }

      const heightPercentage = info.height / parentInfo.height

      //bottom - height fits content naturally
      if (
        parentInfo.children.length === 1 &&
        [0.5, 1].some((percentage) =>
          close(heightPercentage, percentage, 0.001),
        ) &&
        parentInfo.heightType !== 'content'
      ) {
        const toResize = selectDesignerElementReverse(info.element)
        updateElementValues(toResize, ['height'], updatedElements)
        toResize.style.height = `${round(heightPercentage * 100, 0)}%`
      } else if (info.heightType === 'fixed') {
        //TODO: hacky fix to resize the image but not the wrapper
        const toResize = selectDesignerElementReverse(info.element)
        updateElementValues(toResize, ['height'], updatedElements)
        toResize.style.height = `${info.height}px`
      } else {
        updateElementValues(info.element, ['height'], updatedElements)
        info.element.style.height = 'auto'
      }
    }

    //parent edges for sizing
    if (parentInfo.widthType === 'content') {
      setSpaceForElement(
        parentInfo.element,
        'padding',
        left,
        getSiblingGap(
          parentInfo.edges[left].parentEdge.gap,
          parentInfo.edges[left].parentEdge.gapTypes,
        ),
      )
      setSpaceForElement(
        parentInfo.element,
        'padding',
        right,
        getSiblingGap(
          parentInfo.edges[right].parentEdge.gap,
          parentInfo.edges[right].parentEdge.gapTypes,
        ),
      )
    }

    if (parentInfo.heightType === 'content') {
      setSpaceForElement(
        parentInfo.element,
        'padding',
        top,
        getSiblingGap(
          parentInfo.edges[top].parentEdge.gap,
          parentInfo.edges[top].parentEdge.gapTypes,
        ),
      )
      setSpaceForElement(
        parentInfo.element,
        'padding',
        bottom,
        getSiblingGap(
          parentInfo.edges[bottom].parentEdge.gap,
          parentInfo.edges[bottom].parentEdge.gapTypes,
        ),
      )
    }

    return updatedElements
  },
}

export const flexUpdator: PositionUpdator = {
  updateRects(
    { parentUpdate, childrenUpdates }: UpdateRectsProps,
    scale: number,
  ) {
    const parentReal = parentUpdate.element
    const style = getComputedStyle(parentReal)
    const axis = style.flexDirection !== 'column' ? 'x' : 'y'
    const left = axis === 'x' ? 'left' : 'top'
    const right = axis === 'x' ? 'right' : 'bottom'
    const top = axis === 'x' ? 'top' : 'left'
    const bottom = axis === 'x' ? 'bottom' : 'right'
    //const otherAxis = axis === 'x' ? 'y' : 'x';
    const minGapBetweenX = axis === 'x' ? 'minGapBetweenX' : 'minGapBetweenY'
    const evenlySpace = axis === 'x' ? 'evenlySpaceX' : 'evenlySpaceY'
    const aroundSpace = axis === 'x' ? 'aroundSpaceX' : 'aroundSpaceY'
    const betweenSpace = axis === 'x' ? 'betweenSpaceX' : 'betweenSpaceY'
    const gapBetween = axis === 'x' ? 'gapBetweenX' : 'gapBetweenY'
    //const minGap = getMinGap(parentReal);
    const height = axis === 'x' ? 'height' : 'width'
    const width = axis === 'x' ? 'width' : 'height'
    const minHeight = axis === 'x' ? 'minHeight' : 'minWidth'
    //const minWidth = axis === 'x' ? 'minWidth' : 'minHeight';
    const heightType = axis === 'x' ? 'heightType' : 'widthType'
    const widthType = axis === 'x' ? 'widthType' : 'heightType'

    const updatedElements: UpdatedElement[] = []

    const updates: UpdateRect[] = childrenUpdates
    updates.push(parentUpdate)
    const parentInfo = calculateFlexParentEdgeInfoWithSizing(
      parentReal,
      scale,
      scale,
      false,
      'x',
      updates,
    )
    if (!parentInfo.edges) return []

    if (
      !close(parentInfo[minGapBetweenX], 0, 0.1) &&
      parentInfo[minGapBetweenX] < 0.1
    ) {
      //throw new Error("mingap cannot be less than zero")
      parentInfo[minGapBetweenX] = 0
    }

    const childrenWidthFixed = parentInfo.childEdgeInfo.every(
      (child) => child[widthType] !== 'expand',
    )
    //The fixed and min height is because with text elements inside of a flex, resizing them means we need to turn off
    //alignitems, but they will sometimes show up as content type instead of expand type. Expand is the default for height in a flex
    const childrenHeightFixed = parentInfo.childEdgeInfo.every(
      (child) =>
        child[heightType] === 'fixed' ||
        close(child[height], child[minHeight], 0.1),
    )

    let startXSide: RectSide =
      parentInfo.edges[left].parentEdge.gap <=
      parentInfo.edges[right].parentEdge.gap
        ? left
        : right
    //Start X Side being right assumes we will have a flex-end, but that won't happen if one of the children has
    //expand width
    if (!childrenWidthFixed) {
      startXSide = left
    }
    const endXSide = startXSide === left ? right : left
    //This startYside = bottom is only a thing if we are flex-end, and flex-end shouldn't be a thing if we don't have fixed children height
    const startYSide =
      parentInfo.edges[top].parentEdge.gap <=
        parentInfo.edges[bottom].parentEdge.gap || !childrenHeightFixed
        ? top
        : bottom
    const endYSide = startYSide === top ? bottom : top

    //If all the items are on the y center line and there is space between the top and bottom
    const isYCenter =
      parentInfo.childEdgeInfo.every(
        (info) =>
          info[top].elementLocationRelative ===
          info[top].parentMidpointRelative,
      ) &&
      parentInfo.edges[top].parentEdge.gap > 0 &&
      parentInfo.edges[bottom].parentEdge.gap > 0 &&
      close(
        parentInfo.edges[top].parentEdge.gap,
        parentInfo.edges[bottom].parentEdge.gap,
        0.1,
      ) &&
      childrenHeightFixed
    const isXCenter =
      close(
        parentInfo.edges[left].parentEdge.gap,
        parentInfo.edges[right].parentEdge.gap,
        0.1,
      ) && childrenWidthFixed
    const alignStart = parentInfo.childEdgeInfo.some((child) =>
      close(child[height], child[minHeight], 0.1),
    )
      ? 'flex-start'
      : 'normal'

    updateElementValues(
      parentInfo.element,
      [
        'paddingRight',
        'paddingLeft',
        'paddingTop',
        'paddingBottom',
        'alignItems',
        'gap',
        'justify-content',
      ],
      updatedElements,
    )

    setSpaceForElement(parentInfo.element, 'padding', left, 0)
    setSpaceForElement(parentInfo.element, 'padding', right, 0)
    setSpaceForElement(parentInfo.element, 'padding', top, 0)
    setSpaceForElement(parentInfo.element, 'padding', bottom, 0)
    parentInfo.element.style.justifyContent = 'normal'

    for (const info of parentInfo.childEdgeInfo) {
      updateElementValues(
        info.element,
        ['marginRight', 'marginLeft', 'marginTop', 'marginBottom', 'flexGrow'],
        updatedElements,
      )

      setSpaceForElement(info.element, 'margin', left, 0)
      setSpaceForElement(info.element, 'margin', right, 0)
      setSpaceForElement(info.element, 'margin', top, 0)
      setSpaceForElement(info.element, 'margin', bottom, 0)

      //top
      if (!isYCenter) {
        //Top is determined by parent padding
        const parentGap = parentInfo.edges[startYSide].parentEdge.gap
        const remainingGap = info[startYSide].parentEdge.gap - parentGap

        setSpaceForElement(
          info[startYSide].element,
          'margin',
          startYSide,
          remainingGap,
        )
        setSpaceForElement(parentInfo.element, 'padding', startYSide, parentGap)

        if (childrenHeightFixed) {
          if (startYSide === top) {
            parentInfo.element.style.alignItems = alignStart
          }
          if (startYSide === bottom) {
            parentInfo.element.style.alignItems = 'flex-end'
          }
        } else {
          parentInfo.element.style.alignItems = 'normal'
        }
      } else if (parentInfo[heightType] !== 'content' && childrenHeightFixed) {
        parentInfo.element.style.alignItems = 'center'
        setSpaceForElement(parentInfo.element, 'padding', top, 0)
        setSpaceForElement(parentInfo.element, 'padding', bottom, 0)
      }

      //bottom - set by height or align-items (to fit content)
      //TODO: get rid of alignitems check here. The idea is that children heights naturally expand,
      //and so in a scenario where it says a child is content, it is actually expand and we need this extra margin
      //to keep the parent the same size
      if (
        info[heightType] === 'expand' ||
        (info[heightType] !== 'fixed' &&
          parentInfo.element.style.alignItems === 'normal')
      ) {
        const parentGap = parentInfo.edges[endYSide].parentEdge.gap
        const remainingGap = info[endYSide].parentEdge.gap - parentGap
        setSpaceForElement(
          info[endYSide].element,
          'margin',
          endYSide,
          remainingGap,
        )
        setSpaceForElement(parentInfo.element, 'padding', endYSide, parentGap)
      } else if (info[heightType] === 'fixed') {
        const toResize = selectDesignerElementReverse(info.element)
        updateElementValues(toResize, [height], updatedElements)
        toResize.style[height] = `${info[height]}px`
      } else if (
        close(info[height], info[minHeight], 0.1) &&
        parentInfo.element.style.alignItems === 'normal'
      ) {
        parentInfo.element.style.alignItems = 'flex-start'
      }

      //left
      if (info.index === 0) {
        if (!isXCenter) {
          const parentGap = parentInfo.edges[startXSide].parentEdge.gap
          setSpaceForElement(
            parentInfo.element,
            'padding',
            startXSide,
            parentGap,
          )
        }
      } else {
        const minSpace = parentInfo[minGapBetweenX]
        const leftSibling = info[left].siblingEdge
        if (!leftSibling)
          throw new Error('A non 0 index item should have a sibling')

        const spaceDiff = leftSibling.gap - minSpace
        parentInfo.element.style.gap = `${minSpace}px`
        if (spaceDiff > 0.1) {
          setSpaceForElement(info[left].element, 'margin', left, spaceDiff)
        }
      }
      if (isXCenter && parentInfo[widthType] !== 'content') {
        parentInfo.element.style.justifyContent = 'center'
        if (close(parentInfo[gapBetween]!, parentInfo[aroundSpace], 0.1)) {
          parentInfo.element.style.justifyContent = 'space-around'
          parentInfo.element.style.gap = '0px'
        } else if (
          close(parentInfo[gapBetween]!, parentInfo[evenlySpace], 0.1)
        ) {
          parentInfo.element.style.justifyContent = 'space-evenly'
          parentInfo.element.style.gap = '0px'
        } else if (
          close(parentInfo[gapBetween]!, parentInfo[betweenSpace], 0.1)
        ) {
          parentInfo.element.style.justifyContent = 'space-between'
          parentInfo.element.style.gap = '0px'
        }
      }
      if (!isXCenter && startXSide === left) {
        parentInfo.element.style.justifyContent = 'normal'
      }
      if (!isXCenter && startXSide === right && childrenWidthFixed) {
        parentInfo.element.style.justifyContent = 'flex-end'
      }

      //const styles = getComputedStyle(info.element);

      //right - width
      if (info[widthType] === 'fixed') {
        const toResize = selectDesignerElementReverse(info.element)
        updateElementValues(toResize, [width], updatedElements)
        toResize.style[width] = `${info[width]}px`
      } else if (info[widthType] === 'expand') {
        const parentGap = parentInfo.edges[endXSide].parentEdge.gap
        //const minGap = parentInfo[minGapBetweenX];
        //const remainingGap = info[endXSide].siblingEdge ? info[endXSide].siblingEdge!.gap - minGap : info[endXSide].parentEdge.gap - parentGap;
        // if (remainingGap > 0.1) {
        // 	setSpaceForElement(info[endXSide].element, 'margin', endXSide, remainingGap);
        // }
        setSpaceForElement(parentInfo.element, 'padding', endXSide, parentGap)
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
      setSpaceForElement(
        parentInfo.element,
        'padding',
        left,
        parentInfo.edges[left].parentEdge.gap,
      )
      setSpaceForElement(
        parentInfo.element,
        'padding',
        right,
        parentInfo.edges[right].parentEdge.gap,
      )
    }

    if (parentInfo[heightType] === 'content') {
      setSpaceForElement(
        parentInfo.element,
        'padding',
        top,
        parentInfo.edges[top].parentEdge.gap,
      )
      setSpaceForElement(
        parentInfo.element,
        'padding',
        bottom,
        parentInfo.edges[bottom].parentEdge.gap,
      )
    }

    return updatedElements
  },
}
