import { z } from 'zod'
import { registryItemSchema } from '../harmonycn/types'
import { emailSchema } from './utils'

export const commitSchema = z.object({
  author: z.string(),
  message: z.string(),
  date: z.date(),
})

export type CommitItem = z.infer<typeof commitSchema>

export const branchItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  url: z.string(),
  commits: z.array(commitSchema),
  pullRequestUrl: z.optional(z.string()),
  lastUpdated: z.date(),
})

export type BranchItem = z.infer<typeof branchItemSchema>

export const pullRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  url: z.string(),
})

export type PullRequest = z.infer<typeof pullRequestSchema>

export const repositoryConfigSchema = z.object({
  tailwindPath: z.string(),
  packageResolution: z.record(z.string(), z.string()),
})

export const repositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  branch: z.string(),
  ref: z.string(),
  installationId: z.number(),
  cssFramework: z.string(),
  tailwindPrefix: z.optional(z.string()),
  tailwindConfig: z.string(),
  prettierConfig: z.string(),
  defaultUrl: z.string(),
  registry: z.record(z.string(), registryItemSchema),
  config: repositoryConfigSchema,
})

export type Repository = z.infer<typeof repositorySchema>

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  contact: emailSchema,
})

export type TeamMember = z.infer<typeof teamMemberSchema>
