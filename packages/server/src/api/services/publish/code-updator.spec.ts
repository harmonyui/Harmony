/* eslint-disable @typescript-eslint/dot-notation -- ok*/
/* eslint-disable @typescript-eslint/require-await -- ok*/
import { describe, expect, it } from "vitest";
import type { Repository } from "@harmony/util/src/types/branch";
import type { GitRepository } from "../../repository/git/types";
import type { HarmonyComponentWithNode } from "../indexor/indexor";
import { getCodeInfoFromFile } from "../indexor/indexor";
import type { UpdateInfo } from "./code-updator";
import { CodeUpdator } from "./code-updator";

describe("code-updator", () => {
    const expectLocationOfString = (file: TestFile, actualLocation: {start: number, end: number}, expectedString: string): void => {
        const content = testFiles[file];
        const substr = content.substring(actualLocation.start, actualLocation.end);
        expect(substr).toBe(expectedString);
    }

    const setupGitRepo = (testFile: TestFile, tailwindPrefix?: string) => {
        const repository: Repository = {
            id: '',
            name: 'Repo',
            branch: 'MyBranch',
            owner: '',
            ref: 'oldRef',
            installationId: 123,
            cssFramework: 'tailwind',
            defaultUrl: '',
            tailwindPrefix
        }
        const gitRepository: GitRepository = {
            async getBranchRef() {
                return ''
            },
            async getCommits() {
                return [];
            }, 
            async getContent(file) {
                return (testFiles as Record<string, string>)[file];
            },
            async getContentOrDirectory() {
                return []
            },
            async getUpdatedFiles() {
                return []
            },
            async createBranch() {
                return undefined;
            },
            async createPullRequest() {
                return '';
            },
            async updateFilesAndCommit() {
                return undefined;
            },
            async diffFiles() {
                return [];
            },
            repository
        }

        const content = testFiles[testFile];
        const elementInstances: HarmonyComponentWithNode[] = [];
        const result = getCodeInfoFromFile(testFile, content, {}, elementInstances, {});
        expect(result).toBeTruthy();

        const codeUpdator = new CodeUpdator(gitRepository);
        return {codeUpdator, elementInstances};
    }
    describe("getChangeAndLocation", () => {
        it("Should add on tailwind prefix correctly", async () => {
            const file: TestFile = 'tailwindPrefix';
            const {codeUpdator, elementInstances} = setupGitRepo(file, 'hw-');
            const updateInfos: UpdateInfo[] = [
                {
                    component: elementInstances[0],
                    attributes: elementInstances[0].props,
                    value: 'margin-right:10px;margin-left:10px;display:block;',
                    oldValue: '',
                    type: 'className',
                    name: '',
                    componentId: elementInstances[0].id
                },
                {
                    component: elementInstances[1],
                    attributes: elementInstances[1].props,
                    value: 'flex-direction:row;padding-left:10px;',
                    oldValue: '',
                    type: 'className',
                    name: '',
                    componentId: elementInstances[1].id
                },
            ]

            const changes = (await Promise.all(updateInfos.map(updateInfo => codeUpdator['getChangeAndLocation'](updateInfo, 'master')))).flat();

            expect(changes.length).toBe(2);
            expect(changes[0].updatedCode).toBe('hw-group hw-py-2 hw-block hw-mx-2.5')
            expectLocationOfString(file, changes[0].location, 'hw-group hw-flex hw-py-2');

            expect(changes[1].updatedCode).toBe('hw-flex hw-flex-row hw-pl-2.5')
            expectLocationOfString(file, changes[1].location, 'hw-flex hw-flex-col');
        })

        it("Should handle non tailwind classes", async () => {
            const file: TestFile = 'nonTailwindClass';
            const {codeUpdator, elementInstances} = setupGitRepo(file);
            const updateInfos: UpdateInfo[] = [
                {
                    component: elementInstances[0],
                    attributes: elementInstances[0].props,
                    value: 'margin-left:3px;',
                    oldValue: '',
                    type: 'className',
                    name: '',
                    componentId: elementInstances[0].id
                },
            ]

            const changes = (await Promise.all(updateInfos.map(updateInfo => codeUpdator['getChangeAndLocation'](updateInfo, 'master')))).flat();

            expect(changes.length).toBe(1);
            expect(changes[0].updatedCode).toBe('flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm ml-[3px]')
            expectLocationOfString(file, changes[0].location, 'flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm');
        })
    })
})

type TestFile = keyof typeof testFiles;
const testFiles = {
    'tailwindPrefix': `
        const TailwindComponent = () => {
            return (
                <div className="hw-group hw-flex hw-py-2">
                    <h1 className="hw-flex hw-flex-col">Hello there</h1>
                </div>
            )
        }
    `,
    'nonTailwindClass': `
        const NonTailwindClass = () => {
            return (
                <div className="flex cursor-default flex-col items-start justify-between space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
                    Bob
                </div>
            )
        }
    `
}