import { NextRequest } from "next/server";
import { URL } from "url";

export async function GET(req: NextRequest): Promise<Response> {
    const reqUrl = new URL(req.url);
    const url = reqUrl.searchParams.get('url');
    if (url === null) {
        return new Response(null, {
            status: 400
        });
    }

    const response = await fetch(url, req);
    const responseUrl = new URL(url);


    // const matches = Array.from(content.matchAll(/\/([^"<>\s\\]+)\/([^\/<>\s\\]+\.[^"<>\s\\]+)/g));
    // for (const match of matches) {
    //     content = content.replace(match[0], `http://localhost:3001/api/proxy?url=${responseUrl.origin}${match[0]}`);
    // }

    let content;
    if (response.headers.get('Content-Type')?.includes('text') || response.headers.get('Content-Type')?.includes('javascript')) {
        content = await response.text();
        let match: RegExpExecArray | null;
        while (match = /"(\/([^"<>\s\\]+)([^\/<>\s\\"]+))/g.exec(content)) {
            content = content.replace(match[0], `"http://localhost:3001/api/proxy?url=${responseUrl.origin}${match[1]}`);
        }
        // while (match = /href="\/((?:(?!http:\/\/localhost:3001)[^"])*)"/.exec(content)) {
        //     content = content.replace(match[0], `href="http://localhost:3001/api/proxy?url=${responseUrl.origin}/${match[1]}"`);
        // }
    } else {
        content = response.body;
    }

    const headers = new Headers();
    response.headers.forEach((key, value) => value !== "content-encoding" && headers.append(value, key));

    console.log(response.status);
    const res = new Response(content, {
		status: response.status === 304 ? 200 : response.status,
        headers: headers
	});

    return res;
}