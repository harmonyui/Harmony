'use client';
import { useCallback, useEffect, useRef, useState } from "react"
import { HarmonyProvider } from "../../packages/editor/src/components/harmony-provider";

const WIDTH = 1960;
const HEIGHT = 1080;
const PAGE_URL = 'https://setl-staging.vercel.app';

export default function EditorPage() {
    const ref = useRef<HTMLDivElement>(null);
    const [rootComponent, setRootComponent] = useState<HTMLElement | undefined>();
    const [scale, _setScale] = useState(.38);

    const setScale = useCallback((scale: number) => {
        if (ref.current && ref.current.parentElement) {
            ref.current.style.transform = `scale(${scale})`;
            ref.current.parentElement.style.width = `${WIDTH*scale}px`;
            ref.current.parentElement.style.height = `${HEIGHT*scale}px`;
        }
        _setScale(scale);
    }, [ref]);
    useEffect(() => {
        const transformURL = function(origUrl: string | URL): URL | string {
            const url = typeof origUrl === 'string' ? origUrl : origUrl.href;
            if (!url.startsWith('http')) {
                const newUrl = new URL(`http://localhost:3001/api/proxy`);
                newUrl.searchParams.append('url', `${PAGE_URL}${url}`);
                return newUrl;
            }

            return origUrl;
        }
        
        if (ref.current) {
            const iframe = document.createElement('iframe');
            iframe.src = `http://localhost:3001/api/proxy?url=${PAGE_URL}`;
            iframe.style.height = '100%';
            iframe.style.width = '100%';
            iframe.addEventListener('load', function() {
                if (!iframe.contentWindow || !iframe.contentDocument) return;

                const originalFetch = iframe.contentWindow.window.fetch;
                function myFetch(input: string | Request | URL, init: RequestInit | undefined) {
                    const isRequest = function(_input: string | Request | URL): _input is Request {
                        return typeof input === 'object' && 'Request' in input;
                    }
                    if (isRequest(input)) {
                        return originalFetch(input, init);
                    }
                    return originalFetch(transformURL(input), init);
                }

                iframe.contentWindow.window.fetch = myFetch;
                iframe.contentWindow.fetch = myFetch;

                const OriginalHttpRequest = iframe.contentWindow.window.XMLHttpRequest;
                const NewHttpRequest = () => {
                    const xhr = new OriginalHttpRequest();
                
                    // Add your custom logic here before making the actual request
                
                    // Save the original open method
                    const originalOpen = xhr.open;
                
                    // Override the open method
                    xhr.open = function (method, url, async?: boolean, user?: string | null, password?: string | null) {
                        // Add your custom logic here before opening the connection
        
                        // Call the original open method
                        originalOpen.call(xhr, method, transformURL(url), async || false, user, password);
                    };
                
                    // Add your custom logic here after the request is sent
                
                    // Return the modified XMLHttpRequest object
                    return xhr;
                }
                NewHttpRequest.DONE = OriginalHttpRequest.DONE;
                NewHttpRequest.UNSENT = OriginalHttpRequest.UNSENT;
                NewHttpRequest.HEADERS_RECEIVED = OriginalHttpRequest.HEADERS_RECEIVED;
                NewHttpRequest.OPENED = OriginalHttpRequest.OPENED;
                NewHttpRequest.LOADING = OriginalHttpRequest.LOADING;

                iframe.contentWindow.window.XMLHttpRequest = NewHttpRequest as unknown as typeof OriginalHttpRequest;

                setRootComponent(iframe.contentDocument.body);
                setScale(.38);
            });

            if (ref.current.children.length === 0) {
                ref.current.appendChild(iframe);
            }
        }
    }, [])
    return (
        <HarmonyProvider repositoryId="clrf5dxjg000169tj4bwcrjj0" rootComponent={rootComponent} scale={scale} onScaleChange={setScale}>
           <div style={{width: `${WIDTH}px`, height: `${HEIGHT}px`}}>
                <div ref={ref} style={{width: `${WIDTH}px`, height: `${HEIGHT}px`, transformOrigin: "0 0"}}></div>
            </div>
        </HarmonyProvider>
    )
}