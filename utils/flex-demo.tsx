'use client';
import { Button } from "@harmony/ui/src/components/core/button";
import { changeByAmount } from "harmony-ai-editor/src/components/inspector/snapping";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // Choose the theme you prefer
const positions = [
    {x: 15, y: 0, element: 1},
    {x: 15, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 5, y: 0, element: 1},
    {x: 20, y: 0, element: 2, timeout: 1000},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},

    {x: 15, y: 0, element: 2, timeout: 1000},
    {x: 15, y: 0, element: 2, timeout: 1000},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},
    {x: 5, y: 0, element: 2},

    {x: 0, y: 15, element: 2, timeout: 1000},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},
    {x: 0, y: 5, element: 2},

    {x: 20, y: 0, element: 0, timeout: 1000},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    
    
    {x: 20, y: 0, element: 0, timeout: 1000},
    {x: 5, y: 0, element: 0},
    {x: 20, y: 0, element: 0, timeout: 1000},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    
    {x: 15, y: 0, element: 0, timeout: 1000},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},
    {x: 5, y: 0, element: 0},

    {x: 0, y: 15, element: 0, timeout: 1000},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
    {x: 0, y: 5, element: 0},
];

export const FlexBoxDemo = () => {
	const ref = useRef<HTMLDivElement>(null);
    const [isLooping, setIsLooping] = useState(false);
    const [timeout, setTheTimeout] = useState<NodeJS.Timeout>();
    const style = useWatchElementStyles(ref);

    const loop = useCallback((index: number) => {
        if (!ref.current) return;
        if (index >= positions.length) {
            setTheTimeout(setTimeout(() => {
                ['justify-content', 'align-items', 'gap', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'].forEach((key) => {
                    ref.current!.style[key as unknown as number] = '';
                });
                loop(0);
            }, 1000));
            return;
        };

        const position = positions[index];
        const element = ref.current.children[position.element] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const timeout = position.timeout || 50;
        setTheTimeout(setTimeout(() => {
            changeByAmount(element, {
                left: rect.left + position.x,
                top: rect.top + position.y,
                width: rect.width,
                height: rect.height
            });
            loop(++index);
        }, timeout));
    }, [ref]);

    useEffect(() => {
        if (!isLooping) {
            clearTimeout(timeout);
        }
    }, [isLooping, timeout]);

    useEffect(() => {
        if (ref.current) {
            if (isLooping) {
                loop(0);
            }
        }
    }, [ref, isLooping, loop]);

    
	const code = `<div className="flex w-1/2 h-[400px] border space-x-1" 
style="${style}">
	<div className="w-[50px] h-[50px] bg-primary"></div>
	<div className="w-[50px] h-[50px] bg-primary"></div>
	<div className="w-[50px] h-[50px] bg-primary"></div>
</div>`
	return (
		<div className="hw-flex">
			<div>
                <div className="hw-flex hw-w-[400px] hw-h-[240px] hw-border hw-space-x-1 hw-gap-2" ref={ref}>
				    {[1, 2, 3].map((i) => <div key={i} className="hw-w-[50px] hw-h-[50px] hw-bg-primary"></div>)}
                </div>
                <Button onClick={() => setIsLooping(!isLooping)}>Try Me</Button>
			</div>

			<div>
				<div className="hw-relative hw-overflow-hidden hw-shadow-xl hw-flex hw-bg-slate-800 hw-h-[31.625rem] hw-max-h-[60vh] sm:hw-max-h-[none] sm:hw-rounded-xl lg:hw-h-[34.6875rem] xl:hw-h-[31.625rem] dark:hw-bg-slate-900/70 dark:hw-backdrop-blur dark:hw-ring-1 dark:hw-ring-inset dark:hw-ring-white/10 !hw-h-auto hw-max-h-[none]">
					<div className="hw-relative hw-w-full hw-flex hw-flex-col">
						<div className="hw-flex-none hw-border-b hw-border-slate-500/30">
							<div className="hw-flex hw-items-center hw-h-8 hw-space-x-1.5 hw-px-3">
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
							</div>
						</div>
						<div className="hw-relative hw-min-h-0 hw-flex-auto hw-flex hw-flex-col">
							<div className="hw-w-full hw-flex-auto hw-flex hw-min-h-0 hw-overflow-auto">
								<div className="hw-w-full hw-relative hw-flex-auto">
									<pre className="hw-flex hw-min-h-full hw-text-sm hw-leading-6">
										<code className="hw-flex-auto hw-relative hw-block hw-text-slate-50 hw-pt-4 hw-pb-4 hw-px-4 hw-overflow-auto">
											<SyntaxHighlighter language="html" style={atomDark} customStyle={{margin: "0", borderRadius: "0", backgroundColor: 'transparent'}} showLineNumbers>
												{code}
											</SyntaxHighlighter>
										</code>
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export const ElementDemo = () => {
    const parentRef = useRef<HTMLDivElement>(null);
    const child1Ref = useRef<HTMLDivElement>(null);
    const child2Ref = useRef<HTMLDivElement>(null);
    const child3Ref = useRef<HTMLDivElement>(null);

    const parentStyle = useWatchElementStyles(parentRef);//, {'padding-left': '200px', 'padding-right': '200px', 'padding-top': '50px', 'padding-bottom': '50px'});
    const child1Style = useWatchElementStyles(child1Ref);
    const child2Style = useWatchElementStyles(child2Ref);
    const child3Style = useWatchElementStyles(child3Ref);

    const code = `<div className="px-[200px] py-[50px] border" 
style="${parentStyle}">
    <div className="w-[50px] h-[50px] bg-primary" 
    style="${child1Style}">
    </div>
    <div className="w-[50px] h-[50px] bg-primary" 
    style="${child2Style}">
    </div>
    <div className="w-[50px] h-[50px] bg-primary" 
    style="${child3Style}">
    </div>
</div>`;
    return <DragDemo code={code}>
        <div className="hw-ml-[200px] hw-w-[400px]">
        <div className="hw-w-fit hw-py-[50px] hw-border" ref={parentRef}>
            <div className="hw-w-[50px] hw-h-[50px] hw-bg-primary hw-border" ref={child1Ref} id="child-1"></div>
            <div className="hw-w-[50px] hw-h-[50px] hw-bg-primary hw-border" ref={child2Ref} id="child-2"></div>
            <div className="hw-w-[50px] hw-h-[50px] hw-bg-primary hw-border" ref={child3Ref} id="child-3"></div>
        </div>
        </div>
    </DragDemo>
}

interface DragDemoProps {
    children: React.ReactNode;
    code: string;
    
}
const DragDemo: React.FunctionComponent<DragDemoProps>  = ({children, code}) => {
    return (
        <div className="hw-flex">
			<div>
                {children}
                {/* <Button onClick={() => setIsLooping(!isLooping)}>Try Me</Button> */}
			</div>

			<div>
				<div className="hw-relative hw-overflow-hidden hw-shadow-xl hw-flex hw-bg-slate-800 hw-h-[31.625rem] hw-max-h-[60vh] sm:hw-max-h-[none] sm:hw-rounded-xl lg:hw-h-[34.6875rem] xl:hw-h-[31.625rem] dark:hw-bg-slate-900/70 dark:hw-backdrop-blur dark:hw-ring-1 dark:hw-ring-inset dark:hw-ring-white/10 !hw-h-auto hw-max-h-[none]">
					<div className="hw-relative hw-w-full hw-flex hw-flex-col">
						<div className="hw-flex-none hw-border-b hw-border-slate-500/30">
							<div className="hw-flex hw-items-center hw-h-8 hw-space-x-1.5 hw-px-3">
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
								<div className="hw-w-2.5 hw-h-2.5 hw-bg-slate-600 hw-rounded-full"></div>
							</div>
						</div>
						<div className="hw-relative hw-min-h-0 hw-flex-auto hw-flex hw-flex-col">
							<div className="hw-w-full hw-flex-auto hw-flex hw-min-h-0 hw-overflow-auto">
								<div className="hw-w-full hw-relative hw-flex-auto">
									<pre className="hw-flex hw-min-h-full hw-text-sm hw-leading-6">
										<code className="hw-flex-auto hw-relative hw-block hw-text-slate-50 hw-pt-4 hw-pb-4 hw-px-4 hw-overflow-auto">
											<SyntaxHighlighter language="html" style={atomDark} customStyle={{margin: "0", borderRadius: "0", backgroundColor: 'transparent'}} showLineNumbers>
												{code}
											</SyntaxHighlighter>
										</code>
									</pre>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
    )
}
const keys = ['justify-content', 'align-items', 'gap', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'margin-left', 'margin-right','margin-top', 'margin-bottom'] as const;
const useWatchElementStyles = (ref: React.RefObject<HTMLElement>, initialValue?: Record<typeof keys[number], string>) => {
    const [style, setStyle] = useState('');

    useEffect(() => {
        if (ref.current) {
            const observer = new MutationObserver((mutations) => {
                let str = '';
                let numKeys = 0;
                keys.forEach((key) => {
                    const value = ref.current!.style[key as unknown as number];
                    if (value && parseFloat(value) !== 0 && (!initialValue || value !== initialValue[key])) {
                        str += `${key}: ${value}; `;
                        numKeys++;
                        if (numKeys % 2 === 0) {
                            str += '\n';
                        }
                    }
                })
                setStyle(str)
            });

            observer.observe(ref.current, {
                attributes: true,
            });
        }
    }, [ref]);

    return style;
}