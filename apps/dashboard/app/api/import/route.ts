// import { repositorySchema } from "@harmony/util/src/types/branch";
// import { z } from "zod";
// import { getServerAuthSession } from "../../../../../src/server/auth";
// import { GithubRepository } from "../../../../../src/server/api/repository/github";
// import { fromGithub } from "../../../../../src/server/api/services/indexor/github";
// import { indexCodebase } from "../../../../../src/server/api/services/indexor/indexor";

//export const runtime = 'edge'; // 'nodejs' is the default
//export const dynamic = 'force-dynamic'; // static by default, unless reading the request
//export const maxDuration = 300;

export function POST(_req: Request): Promise<Response> {
  throw new Error("This is not implemented");
  // const session = await getServerAuthSession();
  // if (session === undefined || session.account === undefined) {
  //     return new Response(null, {
  //         status: 401
  //     })
  // }

  // const result = z.object({repository: repositorySchema}).safeParse(await req.json());
  // if (result.success === false) {
  //     return new Response(null, {
  // 		status: 400
  // 	});
  // }

  // const {repository} = result.data;
  // const githubRepository = new GithubRepository(repository);

  // const encoder = new TextEncoder();
  // const stream = new ReadableStream({
  //     async start(controller) {
  //         const onProgress = (progress: number) => {
  //             controller.enqueue(encoder.encode(String(progress)));
  //         }
  //         await indexCodebase('', fromGithub(githubRepository), repository.id, onProgress);
  //         controller.close()
  //     }
  // })

  // return new Response(stream, {
  //     status: 200,
  //     headers: { "Content-Type": "text/plain; charset=utf-8" },
  // });
}
