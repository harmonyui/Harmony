import type { z } from 'zod'
import type {
  LoadRequest,
  LoadResponse,
  UpdateRequest,
  UpdateResponse,
  PublishRequest,
  PublishResponse,
  IndexComponentsRequest,
  IndexComponentsResponse,
} from '@harmony/util/src/types/network'
import {
  loadResponseSchema,
  updateResponseSchema,
  publishResponseSchema,
  indexComponentsResponseSchema,
} from '@harmony/util/src/types/network'
import type { Environment } from '@harmony/util/src/utils/component'
import { createClient } from '../../../trpc'
import { createHarmonySlice } from './factory'

const dataFetch =
  <Request, Response>(
    func: (args: Request) => Promise<Response>,
    responseSchema: z.ZodType<Response>,
  ): ((args: Request) => Promise<Response>) =>
  async (args) => {
    return responseSchema.parse(await func(args))
  }

export interface DataLayerState {
  initializeDataLayer: (environment: Environment) => void
  loadProject: (args: LoadRequest) => Promise<LoadResponse>
  saveProject: (args: UpdateRequest) => Promise<UpdateResponse>
  publishProject: (args: PublishRequest) => Promise<PublishResponse>
  indexComponents: (
    args: IndexComponentsRequest,
  ) => Promise<IndexComponentsResponse>
}
export const createDataLayerSlice = createHarmonySlice<DataLayerState>(
  (set) => ({
    loadProject() {
      throw new Error('Data layer not initialized')
    },
    saveProject() {
      throw new Error('Data layer not initialized')
    },
    publishProject() {
      throw new Error('Data layer not initialized')
    },
    indexComponents() {
      throw new Error('Data layer not initialized')
    },
    initializeDataLayer(environment: Environment) {
      const client = createClient(environment)
      set({
        loadProject: dataFetch<LoadRequest, LoadResponse>(
          client.editor.loadProject.query,
          loadResponseSchema,
        ),
        saveProject: dataFetch<UpdateRequest, UpdateResponse>(
          client.editor.saveProject.mutate,
          updateResponseSchema,
        ),
        publishProject: dataFetch<PublishRequest, PublishResponse>(
          client.editor.publishProject.mutate,
          publishResponseSchema,
        ),
        indexComponents: dataFetch<
          IndexComponentsRequest,
          IndexComponentsResponse
        >(client.editor.indexComponents.mutate, indexComponentsResponseSchema),
      })
    },
    config: {
      production: '',
      staging: '',
      development: '',
    },
  }),
)
