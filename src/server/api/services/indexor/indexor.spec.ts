import { beforeEach, describe, it, expect } from "vitest"
import { getCodeInfoAndNormalizeFromFiles, getCodeInfoFromFile } from "./indexor";
import { ComponentElement, HarmonyComponent } from "@harmony/ui/src/types/component";

describe("indexor", () => {
    describe("getCodeInfoFromFile", () => {
        it("Should index dynamic text with multiple children properly", () => {
            const componentElements: ComponentElement[] = [];
            const componentDefinitions: Record<string, HarmonyComponent> = {};
            const file: TestFile = 'app/SummaryMetadata.tsx';
            const content = testCases[file];

            const result = getCodeInfoFromFile(file, content, componentDefinitions, componentElements, {});
            expect(result).toBeTruthy();
        });
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

            const parentIds = ["YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NDI6ODo0NzoxMA==", 'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NDg6ODo1MzoxMA==', 'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6NTQ6ODo1OToxMA=='];

            const pTags = result.filter(r => r.id === 'YXBwL1N1bW1hcnlNZXRhZGF0YS50c3g6MjY6NDozMTo4');
            expect(pTags.length).toBe(parentIds.length);
            for (let i = 0; i < parentIds.length; i++) {
                const parentId = parentIds[i];
                const pTag = pTags[i];
                expect(pTag.parentId).toBe(parentId);
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
                expect(textAttribute.reference.parentId).toBe(parent.parentId);         
            }
        })
    });
});

type TestFile = 'app/SummaryMetadata.tsx';
const testCases: Record<TestFile, string> = {
    'app/SummaryMetadata.tsx': `import React from "react";

import { cn } from "@formbricks/lib/cn";
import { TSurveySummary } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys";

interface SummaryMetadataProps {
    survey: TSurvey;
    setShowDropOffs: React.Dispatch<React.SetStateAction<boolean>>;
    showDropOffs: boolean;
    surveySummary: TSurveySummary["meta"];
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
    `
}