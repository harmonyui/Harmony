'use client';
import { useEffect, useRef, useState } from "react";
import { Inspector, componentIdentifier } from "./inspector/inspector";
import { Attribute, ComponentElement } from "../types/component";
import { HarmonyPanel } from "./panel/harmony-panel";
import { getClass } from "@harmony/utils/util";

export interface HarmonyProviderProps {
	children: React.ReactNode
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({children}) => {
	const [selectedComponent, setSelectedComponent] = useState<ComponentElement>();
	const [hoveredComponent, setHoveredComponent] = useState<ComponentElement>();
	const [rootComponent, setRootComponent] = useState<ComponentElement>();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			const element = componentIdentifier.getComponentFromElement(ref.current.nextElementSibling as HTMLElement);
			setRootComponent(element);
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
			<Inspector rootElement={rootComponent?.element} selectedComponent={selectedComponent} hoveredComponent={hoveredComponent} onHover={setHoveredComponent} onSelect={setSelectedComponent}/>
			<HarmonyPanel root={rootComponent} selectedComponent={selectedComponent} onAttributesChange={onAttributesChange} onComponentHover={setHoveredComponent} onComponentSelect={setSelectedComponent}/>
		</>
	)
}