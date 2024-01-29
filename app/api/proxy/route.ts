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

    req.headers.set('host', url);
    req.headers.delete('referer')
    const reqHeaders = new Headers();
    req.headers.forEach((value, key) => {
        if (['cookie', 'accept', 'user-agent'].includes(key)) {
            reqHeaders.append(key, value);
        }
    })

    let response = await fetch(url, {method: 'GET', headers: reqHeaders, redirect: 'manual'}
    //     {
    //     method: 'GET',
    //     headers: {
    //         'accept': '*/*',
    //         //'host': 'sandbox-project-livid.vercel.app'
    //     },
    //     redirect: 'manual',
    // }
    );
    let responseUrl = new URL(url);

    if (response.status === 307) {
        const location = response.headers.get('location');
        if (location === null) {
            throw new Error('No location header in redirect url');
        }

        response = await fetch(location, {
            method: 'GET'
        })
        responseUrl = new URL(location);
    }


    // const matches = Array.from(content.matchAll(/\/([^"<>\s\\]+)\/([^\/<>\s\\]+\.[^"<>\s\\]+)/g));
    // for (const match of matches) {
    //     content = content.replace(match[0], `http://localhost:3001/api/proxy?url=${responseUrl.origin}${match[0]}`);
    // }

    let content;
    if ((response.headers.get('Content-Type')?.includes('text') || response.headers.get('Content-Type')?.includes('application'))) {
        content = await response.text();
        let match: RegExpExecArray | null;
        let index = 0;
        const allMatches = //Array.from(content.matchAll(/"(\/([^"<>\s\\,]+)([^\/<>\s\\,"]+))/g));
        Array.from(content.matchAll(/"(\/([^"<>\s\\,]+)([^\/<>\s\\,"]+\.[^\/<>\s\\,"]+))/g));
        for (const match of allMatches) {
            if (!match[0].includes('clerk')) {
                content = content.replace(match[0], `"http://localhost:3001/api/proxy?url=${responseUrl.origin}${match[1]}`);
            }
        }
        // while (match = /"(\/([^"<>\s\\,]+)([^\/<>\s\\,"]+))/g.exec(content)) {
        //     if (!match[0].includes('clerk')) {
        //         content = content.replace(match[0], `"http://localhost:3001/api/proxy?url=${responseUrl.origin}${match[1]}`);
        //     }
        // }
        // while (match = /href="\/((?:(?!http:\/\/localhost:3001)[^"])*)"/.exec(content)) {
        //     content = content.replace(match[0], `href="http://localhost:3001/api/proxy?url=${responseUrl.origin}/${match[1]}"`);
        // }
    } else {
        content = response.body;
    }

    const headers = new Headers();
    response.headers.forEach((key, value) => value !== "content-encoding" && value !== 'x-frame-options' && headers.append(value, key));
    
    console.log(response.status);
    const res = new Response(content, {
		status: response.status === 304 ? 200 : response.status,
        headers: headers
	});

    return res;
}