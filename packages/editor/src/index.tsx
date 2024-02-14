'use client';
import ReactDOM from 'react-dom';
import {HarmonyProvider, HarmonyProviderProps} from './components/harmony-provider';
import { HarmonySetup } from './components/harmony-setup';

declare global {
    interface Window {
        HarmonyProvider: (options: HarmonyProviderProps, harmonyContainer: HTMLDivElement) => void;
    }
}

export {HarmonySetup};

if (window) {
    window.HarmonyProvider = (options: HarmonyProviderProps, harmonyContainer: HTMLDivElement) => {
        ReactDOM.render(<HarmonyProvider {...options}/>, harmonyContainer);
    }
}