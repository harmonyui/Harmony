import ReactDOM from 'react-dom';
import {HarmonyProvider, HarmonyProviderProps} from './components/harmony-provider';
(window as typeof window & {HarmonyProvider: (options: HarmonyProviderProps) => void}).HarmonyProvider = (options: HarmonyProviderProps) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(<HarmonyProvider {...options} />, container);
 }