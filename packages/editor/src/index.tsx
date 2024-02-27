'use client';
import ReactDOM from 'react-dom';
import {HarmonyProvider, HarmonyProviderProps} from './components/harmony-provider';
import { HarmonySetup } from './components/harmony-setup';
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        HarmonyProvider: (options: Omit<HarmonyProviderProps, 'children'>, harmonyContainer: HTMLDivElement) => void;
    }
}

export {HarmonySetup};

if (typeof window !== 'undefined') {
    window.HarmonyProvider = (options: Omit<HarmonyProviderProps, 'children'>, harmonyContainer: HTMLDivElement) => {
        const Container: React.FunctionComponent<{harmonyContainer: HTMLElement, className: string}> = ({harmonyContainer, className}) => {
            const ref = useRef<HTMLBodyElement>(null);
            useEffect(() => {
                if (ref.current) {
                    options.setup.setContainer(ref.current);
                    options.setup.changeMode('designer');
                }
            }, [ref])
            return <section id="harmony-section" className={className} ref={ref} style={{backgroundColor: 'white'}}></section>
        }
        const container = <Container harmonyContainer={harmonyContainer} className={document.body.className}/>//document.createElement('body');
        ReactDOM.render(<HarmonyProvider {...options}>{container}</HarmonyProvider>, harmonyContainer);
    }
}