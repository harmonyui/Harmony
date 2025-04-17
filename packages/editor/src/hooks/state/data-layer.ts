import { z } from 'zod'
import type {
  LoadRequest,
  LoadResponse,
  UpdateRequest,
  UpdateResponse,
  PublishRequest,
  PublishResponse,
  IndexComponentsRequest,
  IndexComponentsResponse,
  CreateUpdateFromTextRequest,
  CreateUpdateFromTextResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  CreateChatBubbleRequest,
  CreateChatBubbleResponse,
  CreateCommentInput,
  DeleteChatBubbleRequest,
  DeleteChatBubbleResponse,
} from '@harmony/util/src/types/network'
import {
  loadResponseSchema,
  updateResponseSchema,
  publishResponseSchema,
  indexComponentsResponseSchema,
  createUpdateFromTextResponseSchema,
  createProjectResponseSchema,
  createChatBubbleResponseSchema,
  deleteChatBubbleResponseSchema,
} from '@harmony/util/src/types/network'
import type { Environment } from '@harmony/util/src/utils/component'
import { createClient } from '../../trpc'
import { createHarmonySlice } from './factory'
import { jsonSchema } from '@harmony/util/src/updates/component'
import {
  ComponentUpdate,
  updateSchema,
} from '@harmony/util/src/types/component'
import { ChatBubble } from '@harmony/util/src/types/branch'

const dataFetch =
  <Request, Response>(
    func: (args: Request) => Promise<Response>,
    responseSchema: z.ZodType<Response>,
  ): ((args: Request) => Promise<Response>) =>
  async (args) => {
    return responseSchema.parse(await func(args))
  }

export interface DataLayerState {
  initializeDataLayer: (
    environment: Environment,
    getToken: () => Promise<string>,
    isLocal: boolean,
    repositoryId: string,
  ) => void
  loadProject: (args: LoadRequest) => Promise<LoadResponse>
  saveProject: (args: UpdateRequest) => Promise<UpdateResponse>
  publishProject: (args: PublishRequest) => Promise<PublishResponse>
  indexComponents: (
    args: IndexComponentsRequest,
  ) => Promise<IndexComponentsResponse>
  createUpdateFromText: (
    args: CreateUpdateFromTextRequest,
  ) => Promise<CreateUpdateFromTextResponse>
  createProject: (args: CreateProjectRequest) => Promise<CreateProjectResponse>
  createComment: (args: CreateCommentInput) => Promise<ChatBubble>
  deleteComment: (
    args: DeleteChatBubbleRequest,
  ) => Promise<DeleteChatBubbleResponse>
  client: ReturnType<typeof createClient> | undefined
  environment: Environment
  isLocal: boolean
  getToken: () => Promise<string>
}
export const createDataLayerSlice = createHarmonySlice<DataLayerState>(
  (set, get) => ({
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
    createUpdateFromText() {
      throw new Error('Data layer not initialized')
    },
    createProject() {
      throw new Error('Data layer not initialized')
    },
    createComment() {
      throw new Error('Data layer not initialized')
    },
    deleteComment() {
      throw new Error('Data layer not initialized')
    },
    getToken() {
      throw new Error('Data layer not initialized')
    },
    client: undefined,
    environment: 'production',
    isLocal:
      typeof window !== 'undefined'
        ? window.location.hostname === 'localhost'
        : false,
    initializeDataLayer(
      environment: Environment,
      getToken: () => Promise<string>,
      isLocal,
      repositoryId,
    ) {
      const client = createClient({
        environment,
        getToken,
        isLocal,
        repositoryId,
      })
      set({
        environment,
        isLocal,
        client,
        getToken,
        async loadProject(props) {
          const response = await dataFetch<LoadRequest, LoadResponse>(
            client.editor.loadProject.query,
            loadResponseSchema,
          )(props)

          if (!props.branchId) {
            const items = jsonSchema
              .pipe(z.array(updateSchema))
              .parse(sessionStorage.getItem('updates') ?? JSON.stringify([]))
            response.updates = items
          } else {
            sessionStorage.removeItem('updates')
          }

          return response
        },
        saveProject(props) {
          const response = dataFetch<UpdateRequest, UpdateResponse>(
            client.editor.saveProject.mutate,
            updateResponseSchema,
          )(props)

          if (!props.branchId) {
            sessionStorage.setItem(
              'updates',
              JSON.stringify(
                props.values.flatMap(
                  ({ update }) => update,
                ) satisfies ComponentUpdate[],
              ),
            )
          }

          return response
        },
        publishProject: dataFetch<PublishRequest, PublishResponse>(
          client.editor.publishProject.mutate,
          publishResponseSchema,
        ),
        indexComponents: dataFetch<
          IndexComponentsRequest,
          IndexComponentsResponse
        >(client.editor.indexComponents.mutate, indexComponentsResponseSchema),
        createUpdateFromText: dataFetch<
          CreateUpdateFromTextRequest,
          CreateUpdateFromTextResponse
        >(
          client.editor.createUpdatesFromText.mutate,
          createUpdateFromTextResponseSchema,
        ),
        createProject: dataFetch<CreateProjectRequest, CreateProjectResponse>(
          client.editor.createProject.mutate,
          createProjectResponseSchema,
        ),
        createComment: dataFetch<
          CreateChatBubbleRequest,
          CreateChatBubbleResponse
        >(
          client.editor.createChatBubble.mutate,
          createChatBubbleResponseSchema,
        ),
        deleteComment: dataFetch<
          DeleteChatBubbleRequest,
          DeleteChatBubbleResponse
        >(
          client.editor.deleteChatBubble.mutate,
          deleteChatBubbleResponseSchema,
        ),
      })
    },
    config: {
      production: '',
      staging: '',
      development: '',
    },
  }),
)
