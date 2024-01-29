'use client';
import { useCallback, useEffect, useRef, useState } from "react"
import { HarmonyProvider } from "../../packages/editor/src/components/harmony-provider";
import { load } from 'cheerio';

const WIDTH = 1960;
const HEIGHT = 1080;
const PAGE_URL = 'https://sandbox-project-livid.vercel.app';

const transformURL = function(origUrl: string | URL, pageUrl: string): string {
    const url = typeof origUrl === 'string' ? origUrl : origUrl.href;
    if (!url.startsWith('http')) {
        const newUrl = new URL(`http://localhost:3001/api/proxy`);
        const proxyUrl = new URL(pageUrl);
        proxyUrl.pathname = url;
        newUrl.searchParams.append('url', proxyUrl.href);
        return proxyUrl.href;//newUrl.href;
    }

    return url;
}

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
        if (ref.current) {
            const iframe = document.createElement('iframe');
            iframe.src = `http://localhost:3001/api/proxy?url=${PAGE_URL}`;
            iframe.style.height = '100%';
            iframe.style.width = '100%';
            // iframe.sandbox.add('allow-forms')
            // iframe.sandbox.add('allow-navigation');
            // iframe.sandbox.add('allow-scripts');
            // iframe.sandbox.add('allow-same-origin');
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
                    return originalFetch(transformURL(input, PAGE_URL), init);
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
                        originalOpen.call(xhr, method, transformURL(url, PAGE_URL), async || false, user, password);
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
    return (<></>
        // <HarmonyProvider repositoryId="clrf5dxjg000169tj4bwcrjj0" rootComponent={rootComponent} scale={scale} onScaleChange={setScale}>
        //    <div style={{width: `${WIDTH}px`, height: `${HEIGHT}px`}}>
        //         <div ref={ref} style={{width: `${WIDTH}px`, height: `${HEIGHT}px`, transformOrigin: "0 0"}}>
                    
        //         </div>
        //     </div>
        // </HarmonyProvider>
    )
}

class EmbeddedWebview extends HTMLElement {
    connectedCallback() {
        const mutationObserver = new MutationObserver((mutations) => {

        });
      fetch(`/api/proxy?url=${this.getAttribute('src')}`)
        .then(response => response.text())
        .then(html => {
          const shadow = this//.attachShadow({ mode: 'open' });
        //   const allMatches = Array.from(html.matchAll(/"(\/([^"<>\s\\,]+)([^\/<>\s\\,"]+\.[^\/<>\s\\,"]+))/g));
        //     for (const match of allMatches) {
        //         if (!match[0].includes('clerk')) {
        //             html = html.replace(match[0], `"http://localhost:3001/api/proxy?url=${PAGE_URL}${match[1]}`);
        //         }
        //     }
          const $ = load(html);
          const scripts = $('script,link,meta');

          scripts.remove();
          shadow.innerHTML = $.html();
          const head = document.getElementsByTagName('head')[0];
          for (const script of Array.from(scripts)) {
            const element = document.createElement(script.tagName);
            for (const attr of script.attributes) {
                let value = attr.value;
                if (attr.name === 'src' || attr.name === 'href') {
                    value = transformURL(attr.value, 'https://immense-lobster-38.accounts.dev');
                }
                element.setAttribute(attr.name, value);
            }
            if (script.children.length > 0) {
                element.textContent = script.childNodes[0].nodeType === Node.TEXT_NODE ? script.childNodes[0].data : '';
            }
            head.appendChild(element);
          }
          mutationObserver.observe(shadow, {
            attributeOldValue: true,
            attributes: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true,
          });
        });
    }
  }
   
  window.customElements.define(
    'embedded-webview',
    EmbeddedWebview
  );