import { describe, expect, it } from 'vitest'

describe('test file', () => {
  it('should work', () => {
    expect(1).toBe(1)
  })
})

export const testCases = {
  'app/SummaryMetadata.tsx': `import React from "react";

import { cn } from "@formbricks/lib/cn";
import { TSurveySummary } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";

interface SummaryMetadataProps {
    survey: TSurvey;
    setShowDropOffs: React.Dispatch<React.SetStateAction<boolean>>;
    showDropOffs: boolean;
    surveySummary: TSurveySummary["meta"];
    className?: string;
}

const StatCard: React.FunctionComponent<{
    label: string;
    percentage: string;
    value: React.ReactNode;
    tooltipText: string;
    className?: string;
}> = ({ label, percentage, value, className }) => (
    <div
    className={cn(
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
);

export default function SummaryMetadata({ surveySummary, className }: SummaryMetadataProps) {
    const { completedPercentage, completedResponses, displayCount, startsPercentage, totalResponses } =
    surveySummary;

    const variant = "bg-blue-50";
    const otherThing = "flex";
    return (
    <div className={cn("flex flex-col-reverse gap-y-2 py-4 lg:flex-row lg:gap-x-2", className)}>
        <StatCard
        className="bg-gray-50"
        label="Displays"
        percentage="100%"
        value={displayCount === 0 ? <span>-</span> : displayCount}
        tooltipText="Number of times the survey has been viewed."
        />
        <StatCard
        className={cn("text-sm", variant, otherThing)}
        label="Starts"
        percentage={\`\${Math.round(startsPercentage)}%\`}
        value={totalResponses === 0 ? <span>-</span> : totalResponses}
        tooltipText="Number of times the survey has been started."
        />
        <StatCard
        label={"Responses"}
        percentage={\`\${Math.round(completedPercentage)}%\`}
        value={completedResponses === 0 ? <span>-</span> : completedResponses}
        tooltipText="Number of times the survey has been completed."
        />
    </div>
    );
}
    `,
  'app/harderDyanmic.tsx': `
        const App = () => {
            const className = "bg-blue-40";
            const variant = "text-sm";
            return (
                <div className={cn("flex", className)}>
                    <Button className={\`bg-gray-900 \${variant}\`} children="Hello there"/>
                </div>
            )
        }
    `,
  'app/text_stuff.tsx': `
    import HomepageMap from "@/components/shared/HomepageMap";

    export default function HomepageSaasLanding() {
        return (
            <div className="max-w-[95%] mx-auto">
                <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 pl-4 md:pl-16">
                        <div className="text-5xl md:text-7xl !important leading-[1.15] text-center md:text-left">
                            The ALSCrowd<br />Community<br />Directory
                        </div>
                        <div className="text-xl md:text-4xl leading-[1.15] mt-4 md:mt-8 text-center md:text-left">
                            A central directory for the ALS community.
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 mt-8 md:mt-0 ml-auto mr-auto flex justify-center">
                        <HomepageMap />
                    </div>
                </div>
                <div className="text-2xl md:text-4xl leading-[1.15] mt-12 md:mt-20 text-center">
                    Find, compare, and connect with organizations, clinics, and resources near you!
                </div>
            </div>
    
        );
    
    }`,
  'app/multipleLayers1.tsx': `
    const Component2 = ({className, name}) => {
        const bob = name;
        return (<>
            <Component1 className={cn("m-2", className)} label={bob}/>
            <Component1 className="m-3" label="bob"/>
        </>)
    }

    function Component1({className, label}) {
        const thisMightMessThingsUp = () => true;
        return (
            <div className={cn(className, "bg-blue-50 flex flex-col")}>
                <h1>{label}</h1>
            </div>
        )
    } 

    const Component3 = () => {
        const anotherOne = "Hello there";
        return (
            <Component2 className={\`p-3\`} name={\`\${anotherOne}\`}/>
        )
    }

    export default Component2
    `,
  'app/multipleLayers2.tsx': `
    import Component2 from './multipleLayers1';

    const App = () => {
        return (
            <Component2 className="bg-white" name="A Name"/>
        )
    }

    const App2 = () => {
        return (
            <Component3 />
        )
    }
    `,
  'app/innerClassName.tsx': `
    const InnerComponent = ({className, buttonClassName}) => {
        return <div className={\`flex flex-col bg-white \${className}\`}>
            <button className={buttonClassName}>Hello</button>
        </div>
    }

    const InnerComponent2 = ({innerClass}) => {
        return <InnerComponent className={"text-sm"} buttonClassName={innerClass}/>
    }

    const MainComponent = () => {
        return <InnerComponent2 innerClass={"bg-primary"}/>
    }
    `,
  'app/objectProperties.tsx': `
    const JourneyCard = (props) => {
        const {className, other} = props;
        const container = "this might mess things up";
        const classesActual = {
            header: "text-lg",
            container: "bg-white",
            otherClass: "flex",
            idThing: 'header',
        }
        const classes = {
            header: classesActual.header,
            container: classesActual.container
        }
        const {otherClass} = classesActual;
        const headerId = classesActual.idThing;
        const labelId = "label";
        const {[labelId]: anotherLabel} = {
            label: "Yes"
        }
        return <div className={cn("flex", classes.container, buttonVariants({className}))}>
            <h1 className={classes[headerId]}>{props.label}</h1>
            <h2 className={otherClass}>{anotherLabel}</h2>
        </div>
    }

    const App = () => {
        return (
            <JourneyCard className="bg-blue-50" label="Hello there"/>
        )
    }
    `,
  'app/complexDynamicCases.tsx': `
    import * as React from "react"
    import { Slot } from "@radix-ui/react-slot"
    import { cva, type VariantProps } from "class-variance-authority"
    import styles from './scroll-view.module.css'

    import { cn } from "@/lib/utils"

    const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:!shadow-none",
    {
        variants: {
        variant: {
            default:
            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
            destructive:
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
            outline:
            "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
            secondary:
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-10 rounded-md px-8",
            xl: "h-12 text-md rounded-md px-8",
            icon: "h-9 w-9",
        },
        },
        defaultVariants: {
        variant: "default",
        size: "default",
        },
    }
    )

    export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
    }

    const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        const _className = className;
        return (
        <Comp
            className={cn(buttonVariants({ variant, size, _className }))}
            ref={ref}
            {...props}
        />
        )
    }
    )
    Button.displayName = "Button"

    export { Button, buttonVariants }

    const ButtonInstance = () => {
        return (<Button className="bg-sky-50" variant="outline">This is a child</Button>)
    }

    type Props = {
        className?: string
        contentClass?: string
        children: React.ReactNode
    }

    export function ScrollView({ children, className, contentClass }: Props) {
        const classStyles = \`\${styles.ScrollView} \${className ?? "dark:hover:text-sm"}\`
        const contentStyles = \`\${styles.Content} \${contentClass ?? ''}\`

        return (
            <div className={classStyles}>
                <div className={contentStyles}>{children}</div>
            </div>
        )
    }

    const ScrollViewInstance = ({params: _params}) => {
        const child = "Hello"
        const id = _params.id;
        const params = 'hello';
        return (
            <ScrollView className="flex" contentClass={"styles"} id={_params.id}>{child}</ScrollView>
        )
    }

    const App = () => {
        return <ScrollViewInstance params={{id: "object id"}}/>
    }

    `,
  'app/classNameTests.tsx': `
    import {cva} from 'class-variant-authority';
    import {cn} from 'merger';

    const buttonVariants = cva(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:!shadow-none",
        {
          variants: {
            variant: {
              default:
                "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              destructive:
                "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
              outline:
                "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
              secondary:
                "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
              ghost: "hover:bg-accent hover:text-accent-foreground",
              link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
              default: "h-9 px-4 py-2",
              sm: "h-8 rounded-md px-3 text-xs",
              lg: "h-10 rounded-md px-8",
              xl: "h-12 text-md rounded-md px-8",
              icon: "h-9 w-9",
            },
          },
          defaultVariants: {
            variant: "default",
            size: "default",
          },
        }
      )

    const Button = ({ buttonClass, variant, size, asChild = false, ...props }) => {
        const Comp = asChild ? Slot : "button"
        return (
          <Comp
            className={cn(buttonVariants({ variant, size, buttonClass }))}
            {...props}
          />
        )
      }


    const App = () => {
        return (
            <div>
                <h1>This is some html</h1>
                <Button variant="secondary" size="sm" buttonClass="border">
                    Thank you
                </Button>
                <Button size="lg">
                    <Icon/> You're welcome
                </Button>
            </div>
        )
    }
    `,
  'app/complexText.tsx': `
    const Component = ({children}) => {
        return (
            <div>{children}</div>
        )
    }

    const SpreadComponent = ({label, ...rest}) => {
        return <h1 {...rest}>{label}</h1>
    }

   const App = () => {
        const spreadLabel = "This is a spread: label::";
        const messMeUp = React.useCallback(() => {
            return api?.messMeUp()
        }, [api])

        return (<>
            <Component objectStuff={{messMeUp}}><Icon/> Filter</Component>
            <ComponentComplex noValue><Icon/> Hello</ComponentComplex>
            <SpreadComponent label="Thank you friend" />
            <SpreadComponent label={spreadLabel} className="border-1"/>
        </>)
    }

    const ComponentComplex = ({children}) => {
        return (
            <div><Icon/> {children}</div>
        )
    }

    const RecursiveComponent = ({label}) => {
        const newLabel = label + 'bob';
        return (
            <div>
                <RecursiveComponent label={newLabel}/>
            </div>
        )
    }
    `,
  'app/arrayStuff.tsx': `
        const ComponentArrays = ({array1, array2}) => {
        const [first, second] = array2;
            return <div>
                <h1 className={first.start}>{array1[0]}</h1>
                <h2 className={second.end}>{array1[1]}</h2>
            </div>
        }
        const ComponentMapping = ({categories}) => {
            return <div>
                {categories.map((category) => {
                    return <h1>{category.name}</h1>
                })}
            </div>
        }

        const App = () => {
            const categories = [{name: "Hello sir"}, {name: "There sir"}];
            const classes = [{start: "bg-blue-50"}, {end: "text-white"}];
            return <>
                <ComponentArrays array1={["Hello", "There"]} array2={classes}/>
                <ComponentMapping categories={categories}/>
            </>
        }
    `,
  'app/errorComponents.tsx': `
    const Component = ({children, navigation, opts}) => {
        const [carouselRef, api] = useEmblaCarousel({...opts})
        return (<>
            <div className={inter.className}>{children}</div>
            <div value={{carouselRef, api: api}}>{navigation.pages.map(page => <a>{page}</a>)}</div>
        </>
        )
    }
    `,

  'app/importedComponents1.tsx': `
    import DifferentName, {Button} from 'app/importedComponents2';

    const App = () => {
        return <div>
            <Button>Click me</Button>
            <DifferentName label="Change me"/>
        </div>
    }
    `,
  'app/importedComponents2.tsx': `
        export const Button = ({children}) => {
            return <button className="flex rounded-full">{children}</button>
        }

        function DefaultExportComponent({label}) {
            return <div>{label}</div>
        }

        export default DefaultExportComponent
    `,
  'app/complexElementNames.tsx': `
        const Component = ({children}) => {
            return (
                <div>{children}</div>
            )
        }

        const COMPONENT_NAME = "Component"

        const AnotherComponent = createComponentThatIsntComponent(COMPONENT_NAME)

        const App = () => {
            return <Component><AnotherComponent/></Component>
        }
    `,
  'app/complexJSXElements.tsx': `
    const Component = () => {
        const urls = ["https://google.com", "https://bing.com"];
        return <div>
            <SideNav
                title={<div>{urls.map(url => <div>{url}</div>)}</div>}
            />
            {urls.length > 0 ? <div>{urls.map(url => <div>{url}</div>)}</div> : <div>No urls</div>}
        </div>
    }
  `,
  'app/ConditionalJSX.tsx': `
    const Button = forwardRef(function Button({className, ...props}) {
        const classes = clsx("flex", className);
        return 'href' in props ? <a className={classes} {...props}/> : <button className={classes} {...props}/>
    })

    export const App = () => {
        return <Button className="bg-blue-50" />
    }
  `,
  'packages/ui/src/Dialog.tsx': `
    export const DialogButton = ({children, className}) => {
        return <button className={className}>{children}</button>
    }

    export const DialogText = ({children}) => {
        return <p>{children}</p>
    }
  `,
  'app/complexImports.tsx': `
    import {DialogButton, DialogText} from 'ui/src/Dialog'

    export const App = () => {
        return <div>
            <DialogButton className="bg-blue-50">Hello there</DialogButton>
            <DialogText>Thank you</DialogText>
        </div>
    }
  `,
} as const

export type TestFile = keyof typeof testCases
