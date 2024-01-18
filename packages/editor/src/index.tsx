import ReactDOM from 'react-dom';
import {HarmonyProvider, HarmonyProviderProps} from './components/harmony-provider';
import './global.css';

declare global {
    interface Window {
        HarmonyProvider: (options: HarmonyProviderProps) => void;
    }
}

window.HarmonyProvider = (options: HarmonyProviderProps) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(<HarmonyProvider {...options} />, container);
 }