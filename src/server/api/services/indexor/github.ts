import { ComponentLocation } from "../../../../../packages/ui/src/types/component";
import { ReadFiles } from "./indexor";
import { GithubRepository } from "../../repository/github";

export const fromGithub: (githubRepository: GithubRepository) => ReadFiles = (githubRepository) => async (startPath, filter, callback) => {
	const files = await githubRepository.getContent(startPath);

	if (Array.isArray(files)) {
		for (const info of files) {
			if (info.type === 'dir' || filter.test(info.path)) {
				await fromGithub(githubRepository)(info.path, filter, callback);
			}
		}
	} else if ('content' in files && filter.test(files.path)) {
		callback(files.path, atob(files.content));
	}
}

export const getFileContent = async (githubRepository: GithubRepository, file: string, branch: string) => {
	const fileInfo = await githubRepository.getContent(file, branch);

	if (Array.isArray(fileInfo) || !('content' in fileInfo)) {
		throw new Error("Invalid path name");
	}

	const fileContent = atob(fileInfo.content);

	return fileContent;
}

export const getCodeSnippet = (githubRepository: GithubRepository) => async ({file, start, end}: ComponentLocation, branch: string): Promise<string> => {
	const fileContent = await getFileContent(githubRepository, file, branch);
	return fileContent.substring(start, end);
}