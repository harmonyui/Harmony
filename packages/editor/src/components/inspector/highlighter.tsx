'use client';

import { useEffectEvent } from "@harmony/ui/src/hooks/effect-event";
import { getEventListeners } from "events";
import { useCallback, useEffect, useRef, useState } from "react";

let controller = new AbortController();

//The event function emitted. Return whether or not this is the desired element (should stop propagation)
export type HighlighterDispatch = (element: HTMLElement, clientX: number, clientY: number, event: MouseEvent) => boolean
export interface HighlighterProps {
	handlers: {
		onClick: HighlighterDispatch,
		onHover: HighlighterDispatch,
		onHold: HighlighterDispatch,
		onPointerUp: HighlighterDispatch,
	},
	container: HTMLElement | undefined;
	noEvents: HTMLElement[];
}
export const useHighlighter = ({handlers: {onClick, onHover, onPointerUp: onPointerUpProps, onHold}, container, noEvents}: HighlighterProps) => {
	const timeoutRef = useRef<NodeJS.Timeout>();
	//const [isHolding, setIsHolding] = useState(false);
	const isHoldingRef = useRef(false);
	const registerListeners = useEffectEvent((): void => {
		controller = new AbortController();
		// const elements = window.document.body.querySelectorAll('*');
		// elements.forEach((element) => {
		// 	const htmlElement = element as HTMLElement
		// 	htmlElement.addEventListener('pointerup', onPointerUp, false);
		// 	htmlElement.addEventListener('pointerover', onPointerOver, false);
		// 	htmlElement.addEventListener('pointerdown', onMouseEvent, false); //TODO: Add a mouse hold event
		// 	htmlElement.addEventListener('click', onMouseEvent, false)
		// 	htmlElement.addEventListener('mousedown', onMouseEvent, false)
		// 	htmlElement.addEventListener('mouseover', onMouseEvent, false)
		// 	htmlElement.addEventListener('mouseup', onMouseEvent, false);
		// });
		container?.addEventListener('pointerup', onPointerUp, {signal: controller.signal});
		container?.addEventListener('pointermove', onPointerOver, {signal: controller.signal});
		container?.addEventListener('click', onMouseEvent, {signal: controller.signal})
		//container?.addEventListener('mousedown', onMouseEvent, {signal: controller.signal}) //This one handels the content editable
		container?.addEventListener('mouseover', onMouseEvent, {signal: controller.signal})
		//container?.addEventListener('mouseup', onMouseEvent, {signal: controller.signal})
		container?.addEventListener('pointerdown', onPointerDown, {signal: controller.signal})
	});

	const removeListeners = useEffectEvent((): void => {
		controller.abort();
		// container?.removeEventListener('pointerup', onPointerUp, false);
		// container?.removeEventListener('pointermove', onPointerOver, false);
		// container?.removeEventListener('click', onMouseEvent, false)
		// container?.removeEventListener('mousedown', onMouseEvent, false)
		// container?.removeEventListener('mouseover', onMouseEvent, false)
		// container?.removeEventListener('mouseup', onMouseEvent, false)
		// container?.removeEventListener('pointerdown', onMouseEvent, false)
	});

	useEffect(() => {
		registerListeners();

		return () => {
			removeListeners();
			clearTimeout(timeoutRef.current);
			//setIsHolding(false);
			isHoldingRef.current = false;
		}
	}, [registerListeners, removeListeners, container]);

	const highligherDispatcher = (dispatch: HighlighterDispatch, finish?: HighlighterDispatch) => useEffectEvent((event: MouseEvent) => {
		let target = event.target as HTMLElement | null;
		if (noEvents.some(no => no.contains(target)) || target?.dataset.nonSelectable === 'true') return;
		if (!isHoldingRef.current) {
			// event.preventDefault();
			// event.stopPropagation();
			// console.log('Not holding');
		} else {
			//console.log('Holding');
		}
		while (target !== null && !dispatch(target, event.clientX, event.clientY, event)) {
			target = target.parentElement;
		}

		finish && target !== null && finish(target, event.clientX, event.clientY, event);
	
	});

	//Disables the event
	const onMouseEvent = (event: MouseEvent): void => {
		let target = event.target as HTMLElement | null;
		if (noEvents.some(no => no.contains(target))) return;
		event.preventDefault();
		event.stopPropagation();
	}

	const onPointerUp = highligherDispatcher(onPointerUpProps);
	// const onPointerUp = () => {
	// 	clearTimeout(timeoutRef.current);
	// 	//setIsHolding(false);
	// 	isHoldingRef.current = false;
	// }
	const onPointerOver = highligherDispatcher(onHover);
	const onPointerDown = highligherDispatcher(onClick);
	// const onPointerDown = highligherDispatcher(onClick, useEffectEvent((element: HTMLElement) => {
	// 	timeoutRef.current = setTimeout(() => {
	// 		//setIsHolding(true);
	// 		isHoldingRef.current = true;
	// 		onHold(element);
	// 	}, 100);

	// 	return false;
	// }));
}