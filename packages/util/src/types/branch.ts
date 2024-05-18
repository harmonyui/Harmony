import { z } from "zod";
import { emailSchema } from "./utils";

export const commitSchema = z.object({
	author: z.string(),
	message: z.string(),
	date: z.date()
});

export type CommitItem = z.infer<typeof commitSchema>;

export const FileDifferenceSchema = z.object({
		sha: z.string(),
		filename: z.string(),
		status: z.enum(["added" , "removed" , "modified" , "renamed" , "copied" , "changed" , "unchanged"]),
		additions: z.number(),
		deletions: z.number(),
		changes: z.number(),
		blob_url: z.string(),
		raw_url: z.string(),
		contents_url: z.string(),
		patch: z.optional(z.string()),
		previous_filename: z.optional(z.string())
})

export type FileDifference = z.infer<typeof FileDifferenceSchema>;


export const branchItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	label: z.string(),
	url: z.string(),
	commits: z.array(commitSchema),
	pullRequestUrl: z.optional(z.string()),
	lastUpdated: z.date(),
})

export type BranchItem = z.infer<typeof branchItemSchema>;

export const pullRequestSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	url: z.string(),
})

export type PullRequest = z.infer<typeof pullRequestSchema>;

export const repositorySchema = z.object({
	id: z.string(),
	name: z.string(),
	owner: z.string(),
	branch: z.string(),
	ref: z.string(),
	installationId: z.number(),
	cssFramework: z.string(),
	tailwindPrefix: z.optional(z.string()),
	defaultUrl: z.string()
})

export type Repository = z.infer<typeof repositorySchema>;

export const teamMemberSchema = z.object({
	id: z.string(),
	name: z.string(),
	role: z.string(),
	contact: emailSchema
});

export type TeamMember = z.infer<typeof teamMemberSchema>;