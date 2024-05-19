/* eslint-disable @typescript-eslint/require-await -- ok*/
import type { Font } from "@harmony/util/src/fonts";
import type { PullRequest } from "@harmony/util/src/types/branch";
import type { BehaviorType, ComponentUpdate } from "@harmony/util/src/types/component";
import type { PublishRequest, PublishResponse } from "@harmony/util/src/types/network";
import type { Environment } from "@harmony/util/src/utils/component";
import { createContext, useContext } from "react";

export const viewModes = ['designer', 'preview', 'preview-full'] as const;
export type DisplayMode = typeof viewModes[number];
export type SelectMode = 'scope' | 'tweezer';
export type ComponentUpdateWithoutGlobal = Omit<ComponentUpdate, 'isGlobal'>

const noop = () => undefined;

const asyncnoop = async () => undefined;

interface HarmonyContextProps {
	branchId: string;
	isSaving: boolean;
	setIsSaving: (isSaving: boolean) => void;
	publish: (request: PublishRequest) => Promise<PublishResponse | undefined>;
	pullRequest: PullRequest | undefined;
	setPullRequest: (value: PullRequest) => void;
	displayMode: DisplayMode;
	changeMode: (mode: DisplayMode) => void;
	publishState: PullRequest | undefined;
	setPublishState: (value: PullRequest | undefined) => void;
	fonts?: Font[];
	onFlexToggle: () => void;
	scale: number;
	onScaleChange: (scale: number, cursorPos: {x: number, y: number}) => void;
	onClose: () => void;
	error: string | undefined;
	setError: (value: string | undefined) => void;
	environment: Environment;
	showWelcomeScreen: boolean;
	setShowWelcomeScreen: (value: boolean) => void;
	showGiveFeedback: boolean;
	setShowGiveFeedback: (value: boolean) => void;
	isDemo: boolean;
	currentBranch: {id: string, name: string} | undefined;
	behaviors: BehaviorType[];
	setBehaviors: (value: BehaviorType[]) => void;
	isGlobal: boolean;
	setIsGlobal: (value: boolean) => void;
	onComponentSelect: (component: HTMLElement) => void;
	onComponentHover: (component: HTMLElement) => void;
    selectedComponent: HTMLElement | undefined;
	onAttributesChange: (updates: ComponentUpdateWithoutGlobal[], execute?: boolean) => void;
}
export const HarmonyContext = createContext<HarmonyContextProps>({branchId: '', pullRequest: undefined, publish: asyncnoop, isSaving: false, setIsSaving: noop, setPullRequest: noop, displayMode: 'designer', changeMode: noop, publishState: undefined, setPublishState: noop, onFlexToggle: noop, scale: 1, onScaleChange: noop, onClose: noop, error: undefined, setError: noop, environment: 'production', showWelcomeScreen: false, setShowWelcomeScreen: noop, showGiveFeedback: false, setShowGiveFeedback: noop, isDemo: false, currentBranch: undefined, behaviors: [], setBehaviors: noop, isGlobal: false, setIsGlobal: noop, onComponentHover: noop, onComponentSelect: noop, selectedComponent: undefined, onAttributesChange: noop});

export const useHarmonyContext = () => {
	const context = useContext(HarmonyContext);

	return context;
}