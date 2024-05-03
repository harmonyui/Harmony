import { LoadRequest, LoadResponse, loadResponseSchema, PublishRequest, PublishResponse, publishResponseSchema, UpdateRequest, UpdateResponse, updateResponseSchema } from "@harmony/util/src/types/network";
import { client } from "./trpc";
import { z } from "zod";

const dataFetch = <Request, Response>(func: (args: Request) => Promise<Response>, responseSchema: z.ZodType<Response>): (args: Request) => Promise<Response> => async (args) => {
    return responseSchema.parse(await func(args));
}

export const loadProject = dataFetch<LoadRequest, LoadResponse>(client.editor.loadProject.query, loadResponseSchema);

export const saveProject = dataFetch<UpdateRequest, UpdateResponse>(client.editor.saveProject.mutate, updateResponseSchema);

export const publishProject = dataFetch<PublishRequest, PublishResponse>(client.editor.publishProject.mutate, publishResponseSchema);