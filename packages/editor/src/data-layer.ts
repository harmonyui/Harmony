import type {
  IndexComponentsRequest,
  IndexComponentsResponse,
  LoadRequest,
  LoadResponse,
  PublishRequest,
  PublishResponse,
  UpdateRequest,
  UpdateResponse} from '@harmony/util/src/types/network';
import {
  indexComponentsResponseSchema,
  loadResponseSchema,
  publishResponseSchema,
  updateResponseSchema,
} from '@harmony/util/src/types/network'
import type { z } from 'zod'
import { client } from './trpc'

const dataFetch =
  <Request, Response>(
    func: (args: Request) => Promise<Response>,
    responseSchema: z.ZodType<Response>,
  ): ((args: Request) => Promise<Response>) =>
  async (args) => {
    return responseSchema.parse(await func(args))
  }

export const loadProject = dataFetch<LoadRequest, LoadResponse>(
  client.editor.loadProject.query,
  loadResponseSchema,
)

export const saveProject = dataFetch<UpdateRequest, UpdateResponse>(
  client.editor.saveProject.mutate,
  updateResponseSchema,
)

export const publishProject = dataFetch<PublishRequest, PublishResponse>(
  client.editor.publishProject.mutate,
  publishResponseSchema,
)

export const indexComponents = dataFetch<
  IndexComponentsRequest,
  IndexComponentsResponse
>(client.editor.indexComponents.mutate, indexComponentsResponseSchema)
