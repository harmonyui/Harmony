'use client';

import { useEffectEvent } from "@harmony/hooks/effect-event";
import { useCallback, useEffect } from "react";

//The event function emitted. Return whether or not this is the desired element (should stop propagation)
export type HighlighterDispatch = (element: HTMLElement) => boolean
export interface HighlighterProps {
	handlers: {
		onClick: HighlighterDispatch,
		onHover: HighlighterDispatch,
		onHold: HighlighterDispatch
	},
	container: HTMLElement | undefined;
}
export const useHighlighter = ({handlers: {onClick, onHover, onHold}, container}: HighlighterProps) => {
	const registerListeners = useEffectEvent((): void => {
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
		container?.addEventListener('pointerup', onPointerUp, false);
		container?.addEventListener('pointermove', onPointerOver, false);
		container?.addEventListener('click', onMouseEvent, false)
		container?.addEventListener('mousedown', onMouseEvent, false)
		container?.addEventListener('mouseover', onMouseEvent, false)
		container?.addEventListener('mouseup', onMouseEvent, false)
		container?.addEventListener('pointerdown', onMouseEvent, false)
	});

	const removeListeners = useEffectEvent((): void => {
		container?.removeEventListener('pointerup', onPointerUp, false);
		container?.removeEventListener('pointermove', onPointerOver, false);
		container?.removeEventListener('click', onMouseEvent, false)
		container?.removeEventListener('mousedown', onMouseEvent, false)
		container?.removeEventListener('mouseover', onMouseEvent, false)
		container?.removeEventListener('mouseup', onMouseEvent, false)
		container?.removeEventListener('pointerdown', onMouseEvent, false)
	})

	useEffect(() => {
		registerListeners();

		return () => removeListeners();
	}, [registerListeners, removeListeners, container]);

	const highligherDispatcher = (dispatch: HighlighterDispatch) => (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		let target = event.target as HTMLElement | null;
		while (target !== null && !dispatch(target)) {
			target = target.parentElement;
		}
	}

	//Disables the event
	const onMouseEvent = (event: MouseEvent): void => {
		event.preventDefault();
		event.stopPropagation();
	}

	const onPointerUp = highligherDispatcher(onClick);
	const onPointerOver = highligherDispatcher(onHover);
}