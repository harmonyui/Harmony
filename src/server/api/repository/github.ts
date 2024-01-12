import { Octokit, App } from "octokit";
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Repository } from "@harmony/types/branch";

const privateKey = crypto.createPrivateKey(fs.readFileSync(process.env.PRIVATE_KEY_PATH)).export({
    type: "pkcs8",
    format: "pem"
})

const app = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: privateKey,
});

export const appOctokit = app.octokit;

export class GithubRepository {
    private octokit: Octokit;
    
    constructor(oauthToken: string, private repository: Repository) {
        this.octokit = new Octokit({
            auth: oauthToken
        })
    }

    public async getContent(filePath: string) {
        const { data: fileInfo } = await this.octokit.rest.repos.getContent({
            owner: this.repository.owner,
            repo: this.repository.name,
            path: filePath,
            ref: this.repository.branch,
        });

        return fileInfo;
    }

    public async createBranch(newBranch: string) {
        // Get the latest commit SHA from the base branch
        const { data: baseBranchInfo } = await this.octokit.rest.repos.getBranch({
            owner: this.repository.owner,
            repo: this.repository.name,
            branch: this.repository.branch,
        });
    
        // Create a new branch based on the latest commit SHA
        await this.octokit.rest.git.createRef({
            owner: this.repository.owner,
            repo: this.repository.name,
            ref: `refs/heads/${newBranch}`,
            sha: baseBranchInfo.commit.sha,
        });
    }

    public async updateFileAndCommit(branch: string, filePath: string, snippet: string, start: number, end: number) {
        // Get the latest commit SHA from the branch
    const { data: branchInfo } = await this.octokit.rest.repos.getBranch({
        owner: this.repository.owner,
        repo: this.repository.name,
        branch,
      });
  
      // Get the tree SHA associated with the latest commit
      const { data: commitInfo } = await this.octokit.rest.git.getCommit({
        owner: this.repository.owner,
        repo: this.repository.name,
        commit_sha: branchInfo.commit.sha,
      });
  
      // Get the content SHA of the existing file
      const { data: fileInfo } = await this.octokit.rest.repos.getContent({
        owner: this.repository.owner,
        repo: this.repository.name,
        path: filePath,
        ref: branch,
      });
  
          if (Array.isArray(fileInfo)) {
              throw new Error('The given file path is a directory');
          }
  
          if (!('content' in fileInfo)) {
              throw new Error('File info does not have content');
          }
  
          const contentText = atob(fileInfo.content);
          const newContent = contentText.replaceByIndex(snippet, start, end);
  
      // Update the content of the existing file
      const {data: updatedFileInfo} = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.repository.owner,
        repo: this.repository.name,
        path: filePath,
        message: 'Update file content',
        content: Buffer.from(newContent).toString('base64'),
        branch,
        sha: fileInfo.sha,
      });
          
      // Create a new commit with the updated file
      await this.octokit.rest.git.createCommit({
        owner: this.repository.owner,
        repo: this.repository.name,
        message: 'Update file content',
        tree: commitInfo.tree.sha,
        parents: [commitInfo.sha],
        committer: {
          name: 'Your Name',
          email: 'your.email@example.com',
        },
        author: { ...commitInfo.author },
      });
  
      // Update the branch reference to point to the new commit
      await this.octokit.rest.git.updateRef({
        owner: this.repository.owner,
        repo: this.repository.name,
        ref: `heads/${branch}`,
        sha: updatedFileInfo.commit.sha || ''
      });
    }
}