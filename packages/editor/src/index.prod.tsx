import { HarmonyProviderFunc } from "./index";
import { HarmonySetup } from "./components/harmony-setup";
import './global.css';

export {HarmonySetup};

if (typeof window !== 'undefined') {
    window.HarmonyProvider = HarmonyProviderFunc;
}