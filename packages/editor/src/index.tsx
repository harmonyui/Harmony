'use client';
import ReactDOM from 'react-dom';
import {HarmonyProvider, HarmonyProviderProps, HarmonySetup, setupHarmonyProvider} from './components/harmony-provider';

declare global {
    interface Window {
        HarmonyProvider: (options: HarmonyProviderProps) => void;
    }
}

export {HarmonySetup};

// window.HarmonyProvider = (options: Pick<HarmonyProviderProps, 'repositoryId'>) => {
//     const result = setupHarmonyProvider();
//     if (result === undefined) {
//         throw new Error("An error occured when running the Harmony editor")
//     }
//     const {container, harmonyContainer} = result;

//     ReactDOM.render(<HarmonyProvider {...options} rootElement={container}/>, harmonyContainer);
//  }