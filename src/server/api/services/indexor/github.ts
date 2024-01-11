import { ComponentLocation } from "@harmony/types/component";
import { octokit } from "../updator/github";
import { ReadFiles } from "./indexor";

export const fromGithub: (owner: string, repo: string, branch: string) => ReadFiles = (owner, repo, branch) => async (startPath, filter, callback) => {
	const { data: fileInfo } = await octokit.rest.repos.getContent({
		owner,
		repo,
		path: startPath,
		ref: branch,
	});

	if (Array.isArray(fileInfo)) {
		for (const info of fileInfo) {
			if (info.type === 'dir' || filter.test(info.path)) {
				await fromGithub(owner, repo, branch)(info.path, filter, callback);
			}
		}
	} else if ('content' in fileInfo && filter.test(fileInfo.path)) {
		callback(fileInfo.path, atob(fileInfo.content));
	}
}

export const getCodeSnippet = (owner: string, repo: string, branch: string) => async ({file, start, end}: ComponentLocation): Promise<string> => {
	const { data: fileInfo } = await octokit.rest.repos.getContent({
		owner,
		repo,
		path: file,
		ref: branch,
	});

	if (Array.isArray(fileInfo) || !('content' in fileInfo)) {
		throw new Error("Invalid path name");
	}

	const fileContent = atob(fileInfo.content);
	return fileContent.substring(start, end);
}