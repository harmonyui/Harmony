/* eslint-disable @typescript-eslint/no-unsafe-argument -- ok*/
/* eslint-disable @typescript-eslint/no-unsafe-call -- ok*/
/* eslint-disable @typescript-eslint/require-await -- ok*/
import { getLocationFromContent, testCases } from "@harmony/util/src/utils/component.spec";
import { describe, it, expect } from "vitest";
import { ComponentIdUpdator, FileContentRetriever } from "./local";
import { getLocationsFromComponentId, hashComponentId } from "@harmony/util/src/utils/component";

describe("Component Id Updator", () => {
    const setup = (name: keyof (typeof testCases), targets: string[]) => {
        const fileRetriever: FileContentRetriever = {
            async getNewFileContent() {
                return testCases[name].newContent;
            },
            async getOldFileContent() {
                return testCases[name].oldContent;
            }
        }
        const componentIdUpdator = new ComponentIdUpdator(fileRetriever);
        const componentIds: string[] = [];
        for (const target of targets) {
            const p = getLocationFromContent(testCases[name].oldContent, target.replaceAll('    ', '\t'));
            componentIds.push(hashComponentId([p]));
        }

        return {componentIdUpdator, componentIds}
    }
    it("Should successfully update component ids", async () => {
        const targets = [
            `<Button className="hw-w-fit hw-ml-auto" onClick={() => setShowNewProject(true)}>Create New Project</Button>`,
            `<div className="hw-flex hw-gap-2 hw-items-center">
                <GitBranchIcon className="hw-w-6 hw-h-6"/>
                <Header level={3}>Create a Project</Header>
            </div>`,
            `<span>{item.label}</span>`
        ]; 
        const expections = [
            {startLine: 33, startColumn: 4, endLine: 33, endColumn: 111},
            {startLine: 71, startColumn: 3, endLine: 74, endColumn: 9},
            {startLine: 129, startColumn: 20, endLine: 129, endColumn: 45},
        ]
        
        const {componentIdUpdator, componentIds} = setup('add-to-top-file', targets);

        const mappings = await componentIdUpdator.getNewIdsForComponentsFromFile('', componentIds);
        expect(mappings.length).toBe(targets.length);

        for (let i = 0; i < mappings.length; i++) {
            const componentId = componentIds[i];
            const mapping = mappings[i];
            const expection = expections[i];
            expect(mapping.oldId).toBe(componentId);
            const [location] = getLocationsFromComponentId(mapping.newId);

            expect(location.startColumn).toBe(expection.startColumn);
            expect(location.endColumn).toBe(expection.endColumn);
            expect(location.startLine).toBe(expection.startLine);
            expect(location.endLine).toBe(expection.endLine);
        }

    }) 
})