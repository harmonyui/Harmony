import path from 'node:path'
import { transformSync } from '@babel/core'
import { describe, expect, it } from 'vitest'
import babelPlugin from './babel-plugin'

function runPlugin(
  code: string,
  keepTranspiledCode: boolean,
  repositoryId?: string,
) {
  const res = transformSync(code, {
    babelrc: false,
    filename: 'test.tsx',
    sourceType: 'module',
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
    plugins: [
      [
        babelPlugin,
        {
          rootDir: path.join(__dirname, '../../../..'),
          keepTranspiledCode,
          repositoryId,
        },
      ],
    ],
  })

  if (!res) {
    throw new Error('plugin failed')
  }

  return res
}

describe('babel-plugin', () => {
  describe('transform', () => {
    it('Should add harmony data tags to arrow and function components', () => {
      const code = testCases['test.ts']
      const res = runPlugin(code, false)
      expect(res.code).toMatchSnapshot()
    })

    it('Should not visit multiple jsx when nested function calls', () => {
      const code = testCases['nested.ts']
      const res = runPlugin(code, false)
      expect(res.code).toMatchSnapshot()
    })

    it('Should not visit higher order components yet', () => {
      const code = testCases['generater.ts']
      const res = runPlugin(code, false)
      expect(res.code).toMatchSnapshot()
    })

    it('Should handle jsx fragment and variants', () => {
      const code = testCases['fragment.ts']
      const res = runPlugin(code, false)
      expect(res.code).toMatchSnapshot()
    })

    it('Should refector function with multiple arguments', () => {
      const code = `function Home({className, label}, ref) {
                return <div>
                    <h1>Hello there</h1>
                </div>
            }`
      const res = runPlugin(code, false)
      expect(res.code).toMatchSnapshot()
    })

    it('Should add repositoryId to the body tag', () => {
      const code = testCases['repository.ts']
      const res = runPlugin(code, false, '1234')
      expect(res.code).toMatchSnapshot()
    })
  })
})

const testCases = {
  'test.ts': `import React from "react";

import { cn } from "@formbricks/lib/cn";
import { TSurveySummary } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";


const StatCard: React.FunctionComponent<{
    label: string;
    percentage: string;
    value: React.ReactNode;
    tooltipText: string;
    className?: string;
}> = ({ label, percentage, value, className }) => (
    <div className={cn(
        "flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm",
        className
    )}>
    <p className="flex text-sm text-slate-600">
        {label}
        {percentage && percentage !== "NaN%" && (
        <span className="ml-1 rounded-xl bg-slate-100 px-2 py-1 text-xs">{percentage}</span>
        )}
    </p>
    <p className="px-0.5 text-2xl font-bold text-slate-800">{value}</p>
    </div>
)

export default function SummaryMetadata({ surveySummary }: SummaryMetadataProps) {
    const { completedPercentage, completedResponses, displayCount, startsPercentage, totalResponses } =
    surveySummary;

    return (
    <div className="flex flex-col-reverse gap-y-2 py-4 lg:flex-row lg:gap-x-2">
        <StatCard
        label="Displays"
        percentage="100%"
        value={displayCount === 0 ? <span>-</span> : displayCount}
        tooltipText="Number of times the survey has been viewed."
        />
        <StatCard
        label="Starts"
        percentage={\`\${Math.round(startsPercentage)}%\`}
        value={totalResponses === 0 ? <span>-</span> : totalResponses}
        tooltipText="Number of times the survey has been started."
        />
        <StatCard
        label="Responses"
        percentage={\`\${Math.round(completedPercentage)}%\`}
        value={completedResponses === 0 ? <span>-</span> : completedResponses}
        tooltipText="Number of times the survey has been completed."
        />
    </div>
    );
}
    `,
  'nested.ts': `const App = ({map}: {map: string[]}) => {
        return <div>
            <h1>Hello world</h1>
            {map.map(str => <div key={str}>{str}</div>)}
        </div>
    }`,
  'generater.ts': `const generatorWithReturn = (args, Component) => {
        const id = args.id;
        return ({map}: {map: string[]}) => {
            return <div>
                <h1>{id}</h1>
                <Component label="hello"/>
                {map.map(str => <div key={str}>{str}</div>)}
            </div>
        }
    }
    
    const generatorArrowExpression = (args) => {
        const id = args.id;
        return ({map}: {map: string[]}) => <div>
            <h1>{id}</h1>
            {map.map(str => <div key={str}>{str}</div>)}
        </div>
    }
    
    const MyComponent = generatorWithReturn({id: '1'}, ({label}) => {
        const items = [
            {
                label: 'Yes'
            }
        ]
        return (<div>
            <h1>This is it</h1>
            <p>{label}</p>
            <div>
                {items.map(item => <div>{item.label}</div>)}
            </div>
        </div>)
    })
    `,
  'fragment.ts': `
    import { AuthForm } from './components/auth-form'
    import { BrandMessage } from './components/brand-message'
    import { LogoHintible } from '@/components/logos/logo-hintible'
    import { Toaster } from '@/components/ui/sonner'
    
    export default function Fragment() {
      return (
        <>
          <div className="relative grid flex-col h-full lg:grid-cols-2">
            <div className="relative items-end justify-center hidden bg-gradient-to-b from-red-500 to-red-600 lg:flex">
              {/* <img
                src="/images/people-montage-1.jpeg"
                className="absolute top-0 left-0 right-0 object-cover h-full opacity-10 pointer-events-none"
              /> */}
              <BrandMessage />
            </div>
            <div className="flex flex-col justify-center w-full max-w-sm p-8 m-auto space-y-6">
              <div className="flex flex-col space-y-2 text-center">
                <LogoHintible className="w-auto h-8 mx-auto mb-10" />
              </div>
              <AuthForm type="login" />
            </div>
          </div>
          <Toaster richColors theme="light" />
        </>
      )
    }    

    function MemberThing() {
        return (<Toaster.Thing>
            This is a toaster thing
        </Toaster.Thing>)
    }
    `,
  'bindings.ts': `
        import { GitBranchIcon, GitPullRequestIcon, UserGroupIcon } from "@harmony/ui/src/components/core/icons"
        export interface SidePanelItems {
            label: string;
            icon?: IconComponent | React.ReactNode;
            href: string;
            current: boolean;
        }

        const SideNav: React.FunctionComponent = () => {
            const items: SidePanelItems[] = [
                {
                    label: 'Projects',
                    href: '/projects',
                    current: true,
                    icon: GitBranchIcon
                },
                {
                    label: 'Publish Requests',
                    href: '/pull-requests',
                    current: false,
                    icon: GitPullRequestIcon
                },
                {
                    label: 'My Team',
                    href: '/team',
                    current: false,
                    icon: UserGroupIcon
                }
            ]

            return <SidePanel items={items}/>
        }

        const SidePanel: React.FunctionComponent<{items: SidePanelItems[]}> = ({items}) => {
            return <div>
                {items.map(item => <SidePanelItem item={item}/>)}
            </div>
        }

        const SidePanelItem: React.FunctionComponent<{item: SidePanelItems, className?: string}> = ({item, className}) => {
            return (
                <li key={item.label} className={getClass(className)}>
                    <a
                        className={getClass(
                            item.current
                                ? 'hw-text-[#11283B]'
                                : 'hw-text-[#88939D] hover:hw-text-[#11283B]',
                            'hw-group hw-flex hw-gap-x-3 hw-rounded-md hw-p-2 hw-text-lg hw-leading-6 hw-pl-12'
                        )}
                        href={item.href}
                    >
                        {item.icon ? typeof item.icon === 'function' ? <ToggleIcon className="d" icon={item.icon} selected={item.current}/> : item.icon : null}
                        {item.label}
                    </a>
                </li>
            ) 
        }
    `,
  'repository.ts': `
        export const App = () => {
            return <html>
                <body>
                    <h1>Hello world</h1>
                </body>
            </html>
        }
    `,
}
