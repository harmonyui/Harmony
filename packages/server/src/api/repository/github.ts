/* eslint-disable no-await-in-loop -- ok*/
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
import { Octokit, App } from "octokit";
import fs from 'node:fs';
import crypto from 'node:crypto';
import { CommitItem, Repository } from "@harmony/util/src/types/branch";
import { replaceByIndex } from "@harmony/util/src/utils/common";
import {Change, diffLines} from 'diff';
import { getFileContentsFromCache, setFileCache } from "./cache";

const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const privateKeyRaw = privateKeyPath ? fs.readFileSync(privateKeyPath) : atob(process.env.PRIVATE_KEY || '');
const appId = process.env.GITHUB_APP_ID || '';

const privateKey = crypto.createPrivateKey(privateKeyRaw).export({
    type: "pkcs8",
    format: "pem"
}) as string;

const app = new App({
    appId,
    privateKey: privateKey,
});

export const appOctokit: Octokit = app.octokit;

export class GithubRepository {
    private octokit: Octokit | undefined;
    private diffedFiles: Record<string, Change[]> = {};

    private async getOctokit(): Promise<Octokit> {
        if (this.octokit === undefined) {
            this.octokit = await app.getInstallationOctokit(this.repository.installationId);
        }

        return this.octokit;
    }
    
    constructor(public repository: Repository) {
    }

    public async getContentOrDirectory(filePath: string, branchName?: string) {
        const octokit = await this.getOctokit();
        const { data: fileInfo } = await octokit.rest.repos.getContent({
            owner: this.repository.owner,
            repo: this.repository.name,
            path: filePath,
            ref: branchName || this.repository.branch,
        });

        return fileInfo;
    }

    public async createBranch(newBranch: string) {
        const octokit = await this.getOctokit();
        // Get the latest commit SHA from the base branch
        const { data: baseBranchInfo } = await octokit.rest.repos.getBranch({
            owner: this.repository.owner,
            repo: this.repository.name,
            branch: this.repository.branch,
        });
    
        // Create a new branch based on the latest commit SHA
        await octokit.rest.git.createRef({
            owner: this.repository.owner,
            repo: this.repository.name,
            ref: `refs/heads/${newBranch}`,
            sha: baseBranchInfo.commit.sha,
        });
    }

    public async getBranchRef(branch: string): Promise<string> {
        const octokit = await this.getOctokit();
        const {data: refInfo} = await octokit.rest.git.getRef({
            ref: `heads/${branch}`,
            owner: this.repository.owner,
            repo: this.repository.name
        });

        return refInfo.object.sha;
    }

    public async diffFiles(branch: string, oldRef: string, file: string) {
        const hash = `${branch}:${oldRef}:${file}`;
        const oldDiffs = this.diffedFiles[hash];
        if (oldDiffs) {
            return oldDiffs;
        }

        const oldContent = await this.getContent(file, oldRef);
        const newContent = await this.getContent(file, branch);

        const diffs = diffLines(oldContent, newContent);

        this.diffedFiles[hash] = diffs;

        return diffs;
    }

    public async getContent(file: string, ref?: string) {
        const octokit = await this.getOctokit();

        const cleanFile = file.startsWith('/') ? file.substring(1) : file;

        const refKey = ref ? ref : await this.getBranchRef(this.repository.branch);
        const cacheKey = {repo: this.repository.name, path: cleanFile, ref: refKey}
        
        const cachedFile = await getFileContentsFromCache(cacheKey);
        if (cachedFile) {
            return cachedFile;
        }

        const { data: fileInfo } = await octokit.rest.repos.getContent({
            owner: this.repository.owner,
            repo: this.repository.name,
            path: cleanFile,
            ref: ref,
        });

        if (Array.isArray(fileInfo)) {
            throw new Error('The given file path is a directory');
        }

        if (!('content' in fileInfo)) {
            throw new Error('File info does not have content');
        }

        //We have to do this fancy decoding because some special characters do not decode right 
        //with atob
        const contentText = decodeURIComponent(atob(fileInfo.content).split('').map(function map(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        await setFileCache(cacheKey, contentText);

        return contentText;
    }

    public async updateFilesAndCommit(branch: string, changes: { filePath: string, locations: {snippet: string, start: number, end: number }[]}[]) {
        const octokit = await this.getOctokit();
    
        // Get the latest commit SHA from the branch
        const { data: branchInfo } = await octokit.rest.repos.getBranch({
            owner: this.repository.owner,
            repo: this.repository.name,
            branch,
        });
    
        // Get the tree SHA associated with the latest commit
        const { data: commitInfo } = await octokit.rest.git.getCommit({
            owner: this.repository.owner,
            repo: this.repository.name,
            commit_sha: branchInfo.commit.sha,
        });
    
        // Create an array to store changes
        const treeChanges: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
    
        // Iterate through each change and update the files
        for (const change of changes) {
            // Get the content SHA of the existing file
            let contentText = await this.getContent(change.filePath, branch);

            for (const location of change.locations) {
                contentText = replaceByIndex(contentText, location.snippet, location.start, location.end);
            }
            
            const {data: updatedFileInfo } = await octokit.rest.git.createBlob({
                owner: this.repository.owner,
                repo: this.repository.name,
                content: contentText,//Buffer.from(newContent).toString('base64'),
                encoding: 'utf-8'
            })
    
            // Update the content of the existing file
            // const { data: updatedFileInfo } = await octokit.rest.repos.createOrUpdateFileContents({
            //     owner: this.repository.owner,
            //     repo: this.repository.name,
            //     path: change.filePath,
            //     message: 'Update file content',
            //     content: Buffer.from(newContent).toString('base64'),
            //     branch,
            //     sha: fileInfo.sha,
            // });
    
            // Push changes to the array
            treeChanges.push({
                path: change.filePath,
                mode: '100644', // File mode
                type: 'blob',
                sha: updatedFileInfo.sha,
            });
        }
    
        // Create a new tree with all the changes
        const { data: newTree } = await octokit.rest.git.createTree({
            owner: this.repository.owner,
            repo: this.repository.name,
            base_tree: commitInfo.tree.sha,
            tree: treeChanges,
        });
    
        // Create a new commit with the updated files
        const commit = await octokit.rest.git.createCommit({
            owner: this.repository.owner,
            repo: this.repository.name,
            message: 'Update files content',
            tree: newTree.sha,
            parents: [commitInfo.sha],
            committer: {
                name: 'Your Name',
                email: 'your.email@example.com',
            },
            author: { ...commitInfo.author },
        });
    
        // Update the branch reference to point to the new commit
        await octokit.rest.git.updateRef({
            owner: this.repository.owner,
            repo: this.repository.name,
            ref: `heads/${branch}`,
            sha: commit.data.sha,
        });
    }
    

    public async getCommits(branch: string): Promise<CommitItem[]> {
        const octokit = await this.getOctokit();
        // Get the latest commit SHA of the master branch
        const masterBranch = 'master';
        const masterBranchResponse = await octokit.rest.repos.getBranch({
            owner: this.repository.owner,
            repo: this.repository.name,
            branch: masterBranch,
        });
        const masterCommitSha = masterBranchResponse.data.commit.sha;

        // Get the latest commit SHA of the specified branch
        const branchResponse = await octokit.rest.repos.getBranch({
            owner: this.repository.owner,
            repo: this.repository.name,
            branch,
        });
        const branchCommitSha = branchResponse.data.commit.sha;

        // Compare the two commits to get the list of commits in the branch that are ahead of master
        const comparisonResponse = await octokit.rest.repos.compareCommits({
            owner: this.repository.owner,
            repo: this.repository.name,
            base: masterCommitSha,
            head: branchCommitSha,
        });

        //return comparisonResponse.data.commits;

        const aheadCommits = comparisonResponse.data.commits.map<CommitItem>((commit) => ({message: commit.commit.message, author: commit.commit.author?.name || '', date: new Date(commit.commit.author?.date || '')}));

        return aheadCommits;
    }

    public async createPullRequest(branch: string, title: string, body: string) {
        const octokit = await this.getOctokit();
        const response = await octokit.rest.pulls.create({
            owner: this.repository.owner,
            repo: this.repository.name,
            title,
            body,
            base: this.repository.branch,
            head: branch,
        });

        return response.data.html_url;
    }
}