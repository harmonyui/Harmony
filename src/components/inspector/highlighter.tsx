'use client';

import { useEffect } from "react";

//The event function emitted. Return whether or not this is the desired element (should stop propagation)
export type HighlighterDispatch = (element: HTMLElement) => boolean
export interface HighlighterProps {
	handlers: {
		onClick: HighlighterDispatch,
		onHover: HighlighterDispatch,
		onHold: HighlighterDispatch
	}
}
export const useHighlighter = ({handlers: {onClick, onHover, onHold}}: HighlighterProps) => {
	useEffect(() => {
		registerListeners();

		return () => removeListeners();
	}, []);

	const registerListeners = (): void => {
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
		window.addEventListener('pointerup', onPointerUp, false);
		window.addEventListener('pointermove', onPointerOver, false);
		window.addEventListener('click', onMouseEvent, false)
		window.addEventListener('mousedown', onMouseEvent, false)
		window.addEventListener('mouseover', onMouseEvent, false)
		window.addEventListener('mouseup', onMouseEvent, false)
		window.addEventListener('pointerdown', onMouseEvent, false)
	}

	const removeListeners = (): void => {
		window.removeEventListener('pointerup', onPointerUp, false);
		window.removeEventListener('pointermove', onPointerOver, false);
		window.removeEventListener('click', onMouseEvent, false)
		window.removeEventListener('mousedown', onMouseEvent, false)
		window.removeEventListener('mouseover', onMouseEvent, false)
		window.removeEventListener('mouseup', onMouseEvent, false)
		window.removeEventListener('pointerdown', onMouseEvent, false)
	}

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