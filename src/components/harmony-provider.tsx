'use client';
import { useRef, useState } from "react";
import { Inspector } from "./inspector/inspector";
import { ComponentElement } from "../types/component";

export interface HarmonyProviderProps {
	children: React.ReactNode
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({children}) => {
	const [selectedComponent, setSelectedComponent] = useState<ComponentElement>();
	const [hoveredComponent, setHoveredComponent] = useState<ComponentElement>();
	const ref = useRef<HTMLDivElement>(null);
	const rootElement = (ref.current?.nextElementSibling ?? undefined) as HTMLElement | undefined;
	return (
		<>
			<div ref={ref}></div>
			{children}
			<Inspector rootElement={rootElement} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent}/>
		</>
	)
}