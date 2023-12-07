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
		window.addEventListener('pointerup', onPointerUp, true);
		window.addEventListener('pointerover', onPointerOver, true);
		window.addEventListener('pointerdown', onMouseEvent, true); //TODO: Add a mouse hold event
		window.addEventListener('click', onMouseEvent, true)
		window.addEventListener('mousedown', onMouseEvent, true)
		window.addEventListener('mouseover', onMouseEvent, true)
		window.addEventListener('mouseup', onMouseEvent, true)
	}

	const removeListeners = (): void => {
		window.removeEventListener('pointerup', onPointerUp, true);
		window.removeEventListener('pointerover', onPointerOver, true);
		window.removeEventListener('click', onMouseEvent, true)
		window.removeEventListener('mousedown', onMouseEvent, true)
		window.removeEventListener('mouseover', onMouseEvent, true)
		window.removeEventListener('mouseup', onMouseEvent, true)
		window.removeEventListener('pointerdown', onMouseEvent, true)
	}

	const highligherDispatcher = (dispatch: HighlighterDispatch) => (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (dispatch(target)) {
			event.preventDefault();
			event.stopPropagation();
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