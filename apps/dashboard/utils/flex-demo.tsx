'use client'
import { Button } from '@harmony/ui/src/components/core/button'
import { capitalizeFirstLetter, getClass } from '@harmony/util/src/utils/common'
import { changeByAmount } from 'harmony-ai-editor/src/components/snapping/snapping'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
// Choose the theme you prefer
const positions = [
  { x: 15, y: 0, element: 1 },
  { x: 15, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 5, y: 0, element: 1 },
  { x: 20, y: 0, element: 2, timeout: 1000 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },

  { x: 15, y: 0, element: 2, timeout: 1000 },
  { x: 15, y: 0, element: 2, timeout: 1000 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },
  { x: 5, y: 0, element: 2 },

  { x: 0, y: 15, element: 2, timeout: 1000 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },
  { x: 0, y: 5, element: 2 },

  { x: 20, y: 0, element: 0, timeout: 1000 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },

  { x: 20, y: 0, element: 0, timeout: 1000 },
  { x: 5, y: 0, element: 0 },
  { x: 20, y: 0, element: 0, timeout: 1000 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },

  { x: 15, y: 0, element: 0, timeout: 1000 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },
  { x: 5, y: 0, element: 0 },

  { x: 0, y: 15, element: 0, timeout: 1000 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
  { x: 0, y: 5, element: 0 },
]

export const FlexBoxDemo: React.FunctionComponent<{ stretch: boolean }> = ({
  stretch,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const refChild1 = useRef<HTMLDivElement>(null)
  const refChild2 = useRef<HTMLDivElement>(null)
  const refChild3 = useRef<HTMLDivElement>(null)
  const [isLooping] = useState(false)
  const [timeout, setTheTimeout] = useState<NodeJS.Timeout>()
  const style = useWatchElementStyles(ref)
  const styleChild1 = useWatchElementStyles(refChild1)
  const styleChild2 = useWatchElementStyles(refChild2)
  const styleChild3 = useWatchElementStyles(refChild3)

  const loop = useCallback(
    (_index: number) => {
      let index = _index
      if (!ref.current) return
      if (index >= positions.length) {
        setTheTimeout(
          setTimeout(() => {
            ;[
              'justify-content',
              'align-items',
              'gap',
              'padding-top',
              'padding-bottom',
              'padding-left',
              'padding-right',
            ].forEach((key) => {
              if (ref.current) ref.current.style[key as unknown as number] = ''
            })
            loop(0)
          }, 1000),
        )
        return
      }

      const position = positions[index]

      const element = ref.current.children[position.element] as HTMLElement
      const rect = element.getBoundingClientRect()
      const _timeout = position.timeout || 50
      setTheTimeout(
        setTimeout(() => {
          changeByAmount(element, {
            left: rect.left + position.x,
            top: rect.top + position.y,
            width: rect.width,
            height: rect.height,
          })
          loop(++index)
        }, _timeout),
      )
    },
    [ref],
  )

  useEffect(() => {
    if (!isLooping) {
      clearTimeout(timeout)
    }
  }, [isLooping, timeout])

  useEffect(() => {
    if (ref.current) {
      if (isLooping) {
        loop(0)
      }
    }
  }, [ref, isLooping, loop])

  const code = `<div className="flex w-1/2 h-[400px] border space-x-1" 
style="${style}">
	<div className="w-[50px] h-[50px] bg-primary"
style="${styleChild1}"></div>
	<div className="w-[50px] h-[50px] bg-primary"
style="${styleChild2}"></div>
	<div className="w-[50px] h-[50px] bg-primary"
style="${styleChild3}"></div>
</div>`
  return (
    <div className='flex mt-4'>
      <div className='flex flex-col'>
        <div
          className='flex px-10 w-[400px] h-[400px] space-x-1 gap-2 '
          ref={ref}
        >
          {/* {[1, 2, 3].map((i) => <div key={i} className="w-[50px] h-[50px] bg-primary"></div>)} */}
          <div
            ref={refChild1}
            className={getClass(
              'bg-primary h-[50px]',
              stretch ? '' : 'w-[50px]',
            )}
          ></div>
          <div
            ref={refChild2}
            className={getClass(
              'bg-primary h-[50px]',
              stretch ? '' : 'w-[50px]',
            )}
          ></div>
          <div
            ref={refChild3}
            className={getClass(
              'bg-primary h-[50px]',
              stretch ? '' : 'w-[50px]',
            )}
          ></div>
          {/* <div className={getClass('bg-primary h-[50px]', stretch ? '' : 'w-[50px]')}></div> */}
          {/* <div className={getClass('bg-primary h-[50px]', stretch ? '' : 'w-[50px]')}></div> */}
        </div>
        {/* <Button onClick={() => setIsLooping(!isLooping)}>Try Me</Button> */}
      </div>

      <div>
        <div className='relative overflow-hidden shadow-xl flex bg-slate-800 h-[31.625rem] max-h-[60vh] sm:max-h-[none] sm:rounded-xl lg:h-[34.6875rem] xl:h-[31.625rem] dark:bg-slate-900/70 dark:backdrop-blur dark:ring-1 dark:ring-inset dark:ring-white/10 !h-auto max-h-[none]'>
          <div className='relative w-full flex flex-col'>
            <div className='flex-none border-b border-slate-500/30'>
              <div className='flex items-center h-8 space-x-1.5 px-3'>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
              </div>
            </div>
            <div className='relative min-h-0 flex-auto flex flex-col'>
              <div className='w-full flex-auto flex min-h-0 overflow-auto'>
                <div className='w-full relative flex-auto'>
                  <pre className='flex min-h-full text-sm leading-6'>
                    <code className='flex-auto relative block text-slate-50 pt-4 pb-4 px-4 overflow-auto'>
                      <SyntaxHighlighter
                        language='html'
                        style={atomDark}
                        customStyle={{
                          margin: '0',
                          borderRadius: '0',
                          backgroundColor: 'transparent',
                        }}
                        showLineNumbers
                      >
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

export const ElementDemo: React.FunctionComponent<{ stretch: boolean }> = ({
  stretch,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const child1Ref = useRef<HTMLDivElement>(null)
  const child2Ref = useRef<HTMLDivElement>(null)
  const child3Ref = useRef<HTMLDivElement>(null)

  const parentStyle = useWatchElementStyles(parentRef) //, {'padding-left': '200px', 'padding-right': '200px', 'padding-top': '50px', 'padding-bottom': '50px'});
  const child1Style = useWatchElementStyles(child1Ref)
  const child2Style = useWatchElementStyles(child2Ref)
  const child3Style = useWatchElementStyles(child3Ref)

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
</div>`
  return (
    <DragDemo code={code}>
      <div className='ml-[200px] w-[400px]'>
        <div className='py-[50px] w-[200px]' ref={parentRef}>
          <div
            className={getClass(
              'h-[50px] bg-primary border',
              stretch ? '' : 'w-[50px]',
            )}
            ref={child1Ref}
            id='child-1'
          ></div>
          <div
            className={getClass(
              'h-[50px] bg-primary border',
              stretch ? '' : 'w-[50px]',
            )}
            ref={child2Ref}
            id='child-2'
          ></div>
          <div
            className={getClass(
              'h-[50px] bg-primary border',
              stretch ? '' : 'w-[50px]',
            )}
            ref={child3Ref}
            id='child-3'
          ></div>
        </div>
      </div>
    </DragDemo>
  )
}

interface DragDemoProps {
  children: React.ReactNode
  code: string
}
const DragDemo: React.FunctionComponent<DragDemoProps> = ({
  children,
  code,
}) => {
  return (
    <div className='flex'>
      <div className='flex flex-col'>
        {children}
        {/* <Button onClick={() => setIsLooping(!isLooping)}>Try Me</Button> */}
      </div>

      <div>
        <div className='relative overflow-hidden shadow-xl flex bg-slate-800 h-[31.625rem] max-h-[60vh] sm:max-h-[none] sm:rounded-xl lg:h-[34.6875rem] xl:h-[31.625rem] dark:bg-slate-900/70 dark:backdrop-blur dark:ring-1 dark:ring-inset dark:ring-white/10 !h-auto max-h-[none]'>
          <div className='relative w-full flex flex-col'>
            <div className='flex-none border-b border-slate-500/30'>
              <div className='flex items-center h-8 space-x-1.5 px-3'>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
                <div className='w-2.5 h-2.5 bg-slate-600 rounded-full'></div>
              </div>
            </div>
            <div className='relative min-h-0 flex-auto flex flex-col'>
              <div className='w-full flex-auto flex min-h-0 overflow-auto'>
                <div className='w-full relative flex-auto'>
                  <pre className='flex min-h-full text-sm leading-6'>
                    <code className='flex-auto relative block text-slate-50 pt-4 pb-4 px-4 overflow-auto'>
                      <SyntaxHighlighter
                        language='html'
                        style={atomDark}
                        customStyle={{
                          margin: '0',
                          borderRadius: '0',
                          backgroundColor: 'transparent',
                        }}
                        showLineNumbers
                      >
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
const keys = [
  'justify-content',
  'align-items',
  'gap',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'margin-left',
  'margin-right',
  'margin-top',
  'margin-bottom',
  'height',
  'width',
] as const
const useWatchElementStyles = (
  ref: React.RefObject<HTMLElement | null>,
  initialValue?: Record<(typeof keys)[number], string>,
) => {
  const [style, setStyle] = useState('')

  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(() => {
        let str = ''
        let numKeys = 0
        keys.forEach((key) => {
          if (!ref.current) return
          const value = ref.current.style[key as unknown as number]
          if (
            value &&
            parseFloat(value) !== 0 &&
            (!initialValue || value !== initialValue[key])
          ) {
            str += `${key}: ${value}; `
            numKeys++
            if (numKeys % 2 === 0) {
              str += '\n'
            }
          }
        })
        setStyle(str)
      })

      observer.observe(ref.current, {
        attributes: true,
      })
    }
  }, [ref])

  return style
}

const demos = ['Element', 'Element Stretch', 'Flex', 'Flex Stretch'] as const
const demoComps = [
  <ElementDemo stretch={false} />,
  <ElementDemo stretch={true} />,
  <FlexBoxDemo stretch={false} />,
  <FlexBoxDemo stretch={true} />,
]
export const SnappingDemo = () => {
  const [currDemo, setCurrDemo] = useState(2)

  const currComponent = useMemo(() => {
    return demoComps[currDemo]
  }, [currDemo])

  return (
    <div>
      <div className='flex'>
        {demos.map((demo) => (
          <Button
            key={demo}
            onClick={() => {
              setCurrDemo(demos.indexOf(demo))
            }}
          >
            {capitalizeFirstLetter(demo)}
          </Button>
        ))}
      </div>
      {currComponent}
    </div>
  )
}
