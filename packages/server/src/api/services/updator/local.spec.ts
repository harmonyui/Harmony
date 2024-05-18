/* eslint-disable @typescript-eslint/no-unsafe-argument -- ok*/
/* eslint-disable @typescript-eslint/no-unsafe-call -- ok*/
/* eslint-disable @typescript-eslint/require-await -- ok*/
import { getLocationFromContent, testCases } from "@harmony/util/src/utils/component.spec";
import { describe, it, expect } from "vitest";
<<<<<<< Updated upstream:packages/server/src/api/services/updator/local.spec.ts
import { ComponentIdUpdator, FileContentRetriever } from "./local";
import { getLocationFromComponentId, hashComponentId } from "@harmony/util/src/utils/component";
=======
import { ComponentIdUpdator, FileContentRetriever, updateComponentIdsFromUpdates } from './local';
import { getLocationFromComponentId, hashComponentId } from "@harmony/util/src";
import { GithubRepository } from '../../repository/github';
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Repository } from "@harmony/ui/src/types/branch";
>>>>>>> Stashed changes:src/server/api/services/updator/local.spec.ts

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
        const componentIds: {id: string, location: ComponentLocation} [] = [];
        for (const target of targets) {
            const p = getLocationFromContent(testCases[name].oldContent, target.replaceAll('    ', '\t'));
            componentIds.push({id: hashComponentId(p), location: p});
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
            const location = getLocationFromComponentId(mapping.newId);

            expect(location.startColumn).toBe(expection.startColumn);
            expect(location.endColumn).toBe(expection.endColumn);
            expect(location.startLine).toBe(expection.startLine);
            expect(location.endLine).toBe(expection.endLine);
        }

    }) 
})

describe("find differences from commits", () => {
    const setup = (name: keyof (typeof testCases)) => {
        const fileRetriever: FileContentRetriever = {
            async getNewFileContent() {
                return testCases[name].newContent;
            },
            async getOldFileContent() {
                return testCases[name].oldContent;
            }
        }
        const componentIdUpdator = new ComponentIdUpdator(fileRetriever);


        return {componentIdUpdator}
    }

    it("Should successfully update component ids", async () => {

        // const {ComponentIdUpdator} = setup('add-to-top-file');
        const oldCommit = "8b99fe9103a158bec4acca3e9e5b550988ec97a8";
        const newCommit = "74a0707a078c5e4c295d4261ff11b707f3eaa9b2";
        const respository:Repository  = {
            id: "c8dfd3ac-d901-43ac-b22e-0e995b4c6d5c",
            branch: "master",
            name: "saas-starter-next",
            owner: "ReSzuJan",
            ref: oldCommit,
            installationId: 49011005,
            cssFramework: "none",
            defaultUrl: "localhost:4001"
        }
        const githubRepo = new GithubRepository(respository);
        const diffFiles = await updateComponentIdsFromUpdates([], newCommit, githubRepo);
        // console.log(diffFiles);
    })
})

// describe("update ComponentIds from commit", () => {
//     /** should update the component from github commit if there is a difference */

// })