import { describe, it, expect } from "vitest"
import type { ComponentElement, HarmonyComponent } from "@harmony/util/src/types/component";
import { getCodeInfoAndNormalizeFromFiles, getCodeInfoFromFile } from "./indexor";

describe("indexor", () => {
    describe("getCodeInfoFromFile", () => {
        const expectLocationOfString = (file: TestFile, actualLocation: {start: number, end: number}, expectedString: string): void => {
            const content = testCases[file];
            const substr = content.substring(actualLocation.start, actualLocation.end);
            expect(substr).toBe(expectedString);
        }
        it("Should index dynamic text with multiple children properly", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(23);
            expect(componentElements[1].name).toBe('p');

            const textAttributes = componentElements[1].attributes.filter(a => a.type === 'text');
            expect(textAttributes.length).toBe(2);
            expect(textAttributes[0].name).toBe('property');
            expect(textAttributes[0].value).toBe('label');
            expectLocationOfString(file, textAttributes[0].location, 'label')
            expect(textAttributes[1].name).toBe('property');
            expect(textAttributes[1].value).toBe('undefined');
        });

        it("Should index attributes properly", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(23);
            expect(componentElements[5].name).toBe('StatCard');
            expect(componentElements[5].attributes.length).toBe(5);

            //static classes look like this (StatCard #1)
            expect(componentElements[5].attributes[0].type).toBe('className');
            expect(componentElements[5].attributes[0].name).toBe('string');
            expect(componentElements[5].attributes[0].value).toBe('bg-gray-50');
            expectLocationOfString(file, componentElements[5].attributes[0].location, '"bg-gray-50"');
            
            expect(componentElements[11].attributes.length).toBe(8);
            expect(componentElements[11].attributes[0].type).toBe('className');
            expect(componentElements[11].attributes[0].name).toBe('string');
            expect(componentElements[11].attributes[0].value).toBe('text-sm');
            expectLocationOfString(file, componentElements[11].attributes[0].location, '"text-sm"');

            expect(componentElements[11].attributes[1].type).toBe('className');
            expect(componentElements[11].attributes[1].name).toBe('string');
            expect(componentElements[11].attributes[1].value).toBe('bg-blue-50');
            expectLocationOfString(file, componentElements[11].attributes[1].location, '"bg-blue-50"');

            expect(componentElements[11].attributes[2].type).toBe('className');
            expect(componentElements[11].attributes[2].name).toBe('string');
            expect(componentElements[11].attributes[2].value).toBe('flex');
            expectLocationOfString(file, componentElements[11].attributes[2].location, '"flex"');

            //Dynamic classes look like this (div)
            expect(componentElements[4].attributes[1].type).toBe('className');
            expect(componentElements[4].attributes[1].name).toBe('property');
            expect(componentElements[4].attributes[1].value).toBe('className:className');
            expectLocationOfString(file, componentElements[4].attributes[1].location, 'className');

            //static properties have value propName:propValue
            expect(componentElements[5].attributes[1].type).toBe('property');
            expect(componentElements[5].attributes[1].name).toBe('string');
            expect(componentElements[5].attributes[1].value).toBe('label:Displays');
            expectLocationOfString(file, componentElements[5].attributes[1].location, '"Displays"');

            //dynamic properties look like this
            expect(componentElements[5].attributes[3].type).toBe('property');
            expect(componentElements[5].attributes[3].name).toBe('property');
            expect(componentElements[5].attributes[3].value).toBe('value:undefined');
            expectLocationOfString(file, componentElements[5].attributes[3].location, 'displayCount === 0 ? <span>-</span> : displayCount');
        });

        it("Should index strings in containers", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(23);
            expect(componentElements[17].name).toBe('StatCard');
            expect(componentElements[17].attributes.length).toBe(5);

            //(StatCard #3)
            expect(componentElements[17].attributes[0].type).toBe('property');
            expect(componentElements[17].attributes[0].name).toBe('string');
            expect(componentElements[17].attributes[0].value).toBe('label:Responses');
            expectLocationOfString(file, componentElements[17].attributes[0].location, '"Responses"');
        });

        it("Can find the property in a call and template literal expression", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/harderDyanmic.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(2);
            expect(componentElements[0].name).toBe('div');
            expect(componentElements[0].attributes.length).toBe(2);
            expect(componentElements[1].name).toBe('Button');
            expect(componentElements[1].attributes.length).toBe(3);

            //div #1
            expect(componentElements[0].attributes[0].type).toBe('className');
            expect(componentElements[0].attributes[0].name).toBe('string');
            expect(componentElements[0].attributes[0].value).toBe('flex');
            expectLocationOfString(file, componentElements[0].attributes[0].location, '"flex"');

            expect(componentElements[0].attributes[1].type).toBe('className');
            expect(componentElements[0].attributes[1].name).toBe('property');
            expect(componentElements[0].attributes[1].value).toBe('className:className');
            expectLocationOfString(file, componentElements[0].attributes[1].location, 'className');

            //div #2
            expect(componentElements[1].attributes[0].type).toBe('className');
            expect(componentElements[1].attributes[0].name).toBe('string');
            expect(componentElements[1].attributes[0].value).toBe('bg-gray-900 ');
            expectLocationOfString(file, componentElements[1].attributes[0].location, 'bg-gray-900 ');

            expect(componentElements[1].attributes[1].type).toBe('className');
            expect(componentElements[1].attributes[1].name).toBe('string');
            expect(componentElements[1].attributes[1].value).toBe('text-sm');
            expectLocationOfString(file, componentElements[1].attributes[1].location, '"text-sm"');
        })

        it("Should index compoennt with multiple text broken up", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/text_stuff.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(10);
            expect(componentElements[3].attributes.length).toBe(4);
            const textAttributes = componentElements[3].attributes.filter(attr => attr.type === 'text');
            expect(textAttributes.length).toBe(3);
            // expect(textAttributes[0].name).toBe('string');
            // expect(textAttributes[0].value).toBe('The ALS Crowd')
            // expectLocationOfString(file, textAttributes[0].location, 'The ALS Crowd');
            expect(textAttributes[1].name).toBe('string');
            expect(textAttributes[1].value).toBe('Community')
            expectLocationOfString(file, textAttributes[1].location, 'Community');
            // expect(textAttributes[2].name).toBe('string');
            // expect(textAttributes[2].value).toBe('Directory')
            // expectLocationOfString(file, textAttributes[2].location, 'Directory');
        })

        it("Should connect to correct parent attributes", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements[6].attributes.length).toBe(2);
            expect(componentElements[6].getParent()).toBe(componentElements[5])
            expect(componentElements[6].attributes[0].type).toBe('className');
            expect(componentElements[6].attributes[0].name).toBe('string');
            expect(componentElements[6].attributes[0].value).toBe('flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm');
            expectLocationOfString(file, componentElements[6].attributes[0].location, '"flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"');

            expect(componentElements[6].attributes[1].type).toBe('className');
            expect(componentElements[6].attributes[1].name).toBe('string');
            expect(componentElements[6].attributes[1].value).toBe('bg-gray-50');
            expectLocationOfString(file, componentElements[6].attributes[1].location, '"bg-gray-50"');

            expect(componentElements[7].attributes.length).toBe(3);
            expect(componentElements[7].getParent()).toBe(componentElements[5])
            expect(componentElements[7].attributes[0].type).toBe('text');
            expect(componentElements[7].attributes[0].name).toBe('string');
            expect(componentElements[7].attributes[0].value).toBe('Displays');
            expectLocationOfString(file, componentElements[7].attributes[0].location, '"Displays"');

            expect(componentElements[12].attributes.length).toBe(4);
            expect(componentElements[12].getParent()).toBe(componentElements[11])
            expect(componentElements[12].attributes[1].type).toBe('className');
            expect(componentElements[12].attributes[1].name).toBe('string');
            expect(componentElements[12].attributes[1].value).toBe('text-sm');
            expectLocationOfString(file, componentElements[12].attributes[1].location, '"text-sm"');

            expect(componentElements[12].attributes.length).toBe(4);
            expect(componentElements[12].attributes[2].type).toBe('className');
            expect(componentElements[12].attributes[2].name).toBe('string');
            expect(componentElements[12].attributes[2].value).toBe('bg-blue-50');
            expectLocationOfString(file, componentElements[12].attributes[2].location, '"bg-blue-50"');

            expect(componentElements[12].attributes.length).toBe(4);
            expect(componentElements[12].attributes[3].type).toBe('className');
            expect(componentElements[12].attributes[3].name).toBe('string');
            expect(componentElements[12].attributes[3].value).toBe('flex');
            expectLocationOfString(file, componentElements[12].attributes[3].location, '"flex"');
        })

        it("Should handle multiple layers of parents", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/multipleLayers1.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            expect(componentElements.length).toBe(9);

            //Layer 1
            expect(componentElements[0].attributes.length).toBe(2);
            expect(componentElements[0].attributes[0].type).toBe('className');
            expect(componentElements[0].attributes[0].name).toBe('property');
            expect(componentElements[0].attributes[0].value).toBe('className:className');
            expectLocationOfString(file, componentElements[0].attributes[0].location, 'className');
            
            expect(componentElements[1].attributes.length).toBe(1);
            expect(componentElements[1].attributes[0].type).toBe('text');
            expect(componentElements[1].attributes[0].name).toBe('property');
            expect(componentElements[1].attributes[0].value).toBe('label');
            expectLocationOfString(file, componentElements[1].attributes[0].location, 'label');

            //Layer 2
            expect(componentElements[3].attributes.length).toBe(3);
            expect(componentElements[3].attributes[0].type).toBe('className');
            expect(componentElements[3].attributes[0].name).toBe('string');
            expect(componentElements[3].attributes[0].value).toBe('m-2');
            expectLocationOfString(file, componentElements[3].attributes[0].location, '"m-2"');

            expect(componentElements[3].attributes.length).toBe(3);
            expect(componentElements[3].attributes[1].type).toBe('className');
            expect(componentElements[3].attributes[1].name).toBe('property');
            expect(componentElements[3].attributes[1].value).toBe('className:className');
            expectLocationOfString(file, componentElements[3].attributes[1].location, 'className');

            expect(componentElements[3].attributes.length).toBe(3);
            expect(componentElements[3].attributes[2].type).toBe('className');
            expect(componentElements[3].attributes[2].name).toBe('string');
            expect(componentElements[3].attributes[2].value).toBe('bg-blue-50 flex flex-col');
            expectLocationOfString(file, componentElements[3].attributes[2].location, '"bg-blue-50 flex flex-col"');

            expect(componentElements[4].attributes.length).toBe(1);
            expect(componentElements[4].attributes[0].type).toBe('text');
            expect(componentElements[4].attributes[0].name).toBe('property');
            expect(componentElements[4].attributes[0].value).toBe('name');
            expectLocationOfString(file, componentElements[4].attributes[0].location, 'name');

            //Layer 3
            //Component1 --> Should keep property name, but get value of parent
            expect(componentElements[6].attributes.length).toBe(3);
            expect(componentElements[6].attributes[2].type).toBe('property');
            expect(componentElements[6].attributes[2].name).toBe('string');
            expect(componentElements[6].attributes[2].value).toBe('label:Hello there');
            expectLocationOfString(file, componentElements[6].attributes[2].location, '"Hello there"');

            //div
            expect(componentElements[7].attributes.length).toBe(3);
            expect(componentElements[7].attributes[0].type).toBe('className');
            expect(componentElements[7].attributes[0].name).toBe('string');
            expect(componentElements[7].attributes[0].value).toBe('m-2');
            expectLocationOfString(file, componentElements[7].attributes[0].location, '"m-2"');

            //h1
            expect(componentElements[7].attributes.length).toBe(3);
            expect(componentElements[7].attributes[1].type).toBe('className');
            expect(componentElements[7].attributes[1].name).toBe('string');
            expect(componentElements[7].attributes[1].value).toBe('p-3');
            expectLocationOfString(file, componentElements[7].attributes[1].location, 'p-3');

            expect(componentElements[7].attributes.length).toBe(3);
            expect(componentElements[7].attributes[2].type).toBe('className');
            expect(componentElements[7].attributes[2].name).toBe('string');
            expect(componentElements[7].attributes[2].value).toBe('bg-blue-50 flex flex-col');
            expectLocationOfString(file, componentElements[7].attributes[2].location, '"bg-blue-50 flex flex-col"');

            expect(componentElements[8].attributes.length).toBe(1);
            expect(componentElements[8].attributes[0].type).toBe('text');
            expect(componentElements[8].attributes[0].name).toBe('string');
            expect(componentElements[8].attributes[0].value).toBe('Hello there');
            expectLocationOfString(file, componentElements[8].attributes[0].location, '"Hello there"');
        })
    })

    describe("getCodeInfoAndNormalizeFromFiles", () => {
        it("Should index dynamic text with multiple children properly", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoAndNormalizeFromFiles([{file, content}], componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
            if (!result) return;

            const parentIds = ["YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NDU6ODo1MToxMA==", 'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NTI6ODo1ODoxMA==', 'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NTk6ODo2NDoxMA=='];

            const pTags = result.filter(r => r.id.includes('YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6Mjc6NDozMjo4'));
            expect(pTags.length).toBe(parentIds.length);
            for (let i = 0; i < parentIds.length; i++) {
                const parentId = parentIds[i];
                const pTag = pTags[i];
                const pTagParentId = pTag.id.split('#')[0];
                expect(pTagParentId).toBe(parentId);
                const parents = result.filter(r => r.id === parentId);
                expect(parents.length).toBe(1);
                const parent = parents[0];

                const textAttributes = pTag.attributes.filter(attr => attr.type === 'text');
                expect(textAttributes.length).toBe(1);
                const textAttribute = textAttributes[0];

                expect(textAttribute.name).toBe('string');   
                expect("id" in textAttribute.reference).toBe(true);
                if (!("id" in textAttribute.reference)) return;
                expect(textAttribute.reference.id).toBe(parent.id);
                //expect(textAttribute.reference.parentId).toBe(parent.parentId);         
            }
        })
    });
});

const testCases = {
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
        const App = ({className}) => {
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
    const Component1 = ({className, label}) => {
        return (
            <div className={cn(className, "bg-blue-50 flex flex-col")}>
                <h1>{label}</h1>
            </div>
        )
    } 

    const Component2 = ({className, name}) => {
        const bob = name;
        return (
            <Component1 className={cn("m-2", className)} label={bob}/>
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
    import MainComponent from './app/multipleLayers2.tsx';

    const App = () => {
        return (
            <MainComponent className="bg-white" name="A Name"/>
        )
    }
    `
} as const;

type TestFile = keyof typeof testCases;