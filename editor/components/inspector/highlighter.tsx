'use client';

import { useEffectEvent } from "../../../src/hooks/effect-event";
import { getEventListeners } from "events";
import { useCallback, useEffect } from "react";

let controller = new AbortController();

//The event function emitted. Return whether or not this is the desired element (should stop propagation)
export type HighlighterDispatch = (element: HTMLElement) => boolean
export interface HighlighterProps {
	handlers: {
		onClick: HighlighterDispatch,
		onHover: HighlighterDispatch,
		onHold: HighlighterDispatch
	},
	container: HTMLElement | undefined;
	noEvents: HTMLElement[];
}
export const useHighlighter = ({handlers: {onClick, onHover, onHold}, container, noEvents}: HighlighterProps) => {
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
		container?.addEventListener('mousedown', onMouseEvent, {signal: controller.signal})
		container?.addEventListener('mouseover', onMouseEvent, {signal: controller.signal})
		container?.addEventListener('mouseup', onMouseEvent, {signal: controller.signal})
		container?.addEventListener('pointerdown', onMouseEvent, {signal: controller.signal})
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

		return () => removeListeners();
	}, [registerListeners, removeListeners, container]);

	const highligherDispatcher = (dispatch: HighlighterDispatch) => (event: MouseEvent) => {
		let target = event.target as HTMLElement | null;
		if (noEvents.some(no => no.contains(target))) return;
		event.preventDefault();
		event.stopPropagation();
		while (target !== null && !dispatch(target)) {
			target = target.parentElement;
		}
	}

	//Disables the event
	const onMouseEvent = (event: MouseEvent): void => {
		let target = event.target as HTMLElement | null;
		if (noEvents.some(no => no.contains(target))) return;
		event.preventDefault();
		event.stopPropagation();
	}

	const onPointerUp = highligherDispatcher(onClick);
	const onPointerOver = highligherDispatcher(onHover);
}