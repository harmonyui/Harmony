'use client';
import { Button } from "@harmony/ui/src/components/core/button";
import { changeByAmount } from "harmony-ai-editor/src/components/inspector/inspector";
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
    const [style, setStyle] = useState('');
    const [isLooping, setIsLooping] = useState(false);
    const [timeout, setTheTimeout] = useState<NodeJS.Timeout>();

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
    }, [isLooping, timeout])

    useEffect(() => {
        if (ref.current) {
            const observer = new MutationObserver((mutations) => {
                let str = '';
                let numKeys = 0;
                ['justify-content', 'align-items', 'gap', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'].forEach((key) => {
                    const value = ref.current!.style[key as unknown as number];
                    if (value && parseFloat(value) !== 0) {
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

            if (isLooping) {
                loop(0);
            }
        }
    }, [ref, isLooping]);
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