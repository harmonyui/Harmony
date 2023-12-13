'use client';
import { useEffect, useRef, useState } from "react";
import { Inspector } from "./inspector/inspector";
import { Attribute, ComponentElement } from "../types/component";
import { HarmonyPanel } from "./panel/harmony-panel";

export interface HarmonyProviderProps {
	children: React.ReactNode
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({children}) => {
	const [selectedComponent, setSelectedComponent] = useState<ComponentElement>();
	const [hoveredComponent, setHoveredComponent] = useState<ComponentElement>();
	const [rootElement, setRootElement] = useState<HTMLElement>();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setRootElement(ref.current.nextElementSibling as HTMLElement);
		}
	}, [ref]);

	const onAttributesChange = (attributes: Attribute[]) => {
		if (selectedComponent === undefined) return;
		console.log(attributes);

		const copy = {...selectedComponent};
		copy.attributes = attributes;

		setSelectedComponent(copy);
	}
	return (
		<>
			<div ref={ref}></div>
			{children}
			<Inspector rootElement={rootElement} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent}/>
			<HarmonyPanel selectedComponent={selectedComponent} onAttributesChange={onAttributesChange}/>
		</>
	)
}