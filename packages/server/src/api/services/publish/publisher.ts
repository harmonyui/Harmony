import type { ComponentUpdate } from "@harmony/util/src/types/component";
import { translateUpdatesToCss } from "@harmony/util/src/utils/component";
import type { BranchItem, PullRequest } from "@harmony/util/src/types/branch";
import type { GitRepository } from "../../repository/git/types";
import { createPullRequest } from "../../repository/database/pull-request";
import { CodeUpdator } from "./code-updator";

export type ComponentUpdateWithDate = ComponentUpdate & {dateModified: Date};

export class Publisher {
    constructor(private gitRepository: GitRepository) {}

    public async publishChanges(updatesRaw: ComponentUpdateWithDate[], branch: BranchItem, pullRequest: {title: string, body: string}): Promise<PullRequest> {
        const updates = prepareUpdatesForGenerator(updatesRaw);

        const codeUpdator = new CodeUpdator(this.gitRepository);
        const fileUpdates = await codeUpdator.updateFiles(updates);

        await this.gitRepository.createBranch(branch.name);
        await this.gitRepository.updateFilesAndCommit(branch.name, Object.values(fileUpdates));

        const newPullRequest = await createPullRequest({ branch, pullRequest, gitRepository: this.gitRepository });

        return newPullRequest;
    }
}

export function prepareUpdatesForGenerator(updatesRaw: ComponentUpdateWithDate[]): ComponentUpdate[] {
    const updates = normalizeRecentUpdates(updatesRaw);
        
    //TODO: old value is not updated properly for size and spacing
    const updatesTranslated = translateUpdatesToCss(updates);

    return updatesTranslated;
}

export function normalizeRecentUpdates(updates: ComponentUpdateWithDate[]): ComponentUpdateWithDate[] {
    return updates.reduce<ComponentUpdateWithDate[]>((prev, curr) => {
        const prevUpdateIndex = prev.findIndex(p => p.type === curr.type && p.name === curr.name && p.componentId === curr.componentId);
        const prevUpdate = prev[prevUpdateIndex];
        //If there isn't a similar update, add this to the list
        if (prevUpdateIndex < 0) {
            prev.push(curr);
        //If the similar update has the same date modified, then we want to take the newer one (curr)
        } else if (prevUpdate.dateModified.getTime() === curr.dateModified.getTime()) {
            prev[prevUpdateIndex] = curr;
        }
        //Otherwise, do not add the update because we already have it
        
        return prev;
    }, []);
}

