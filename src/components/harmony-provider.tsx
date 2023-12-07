'use client';
import { Inspector } from "./inspector/inspector";

export interface HarmonyProviderProps {
	children: React.ReactNode
}
export const HarmonyProvider: React.FunctionComponent<HarmonyProviderProps> = ({children}) => {
	return (
		<>
			{children}
			<Inspector/>
		</>
	)
}