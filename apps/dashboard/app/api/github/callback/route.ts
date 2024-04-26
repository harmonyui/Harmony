const CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_APP_CLIENT_SECRET || '';

export async function GET(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const callback = url.searchParams.get('state');
    if (!code || !callback) {
        return new Response(JSON.stringify({message: "Invalid body parameters"}), {
            status: 400
        })
    }

    const exchangeURL = new URL("login/oauth/access_token", "https://github.com");
    exchangeURL.searchParams.set("client_id", CLIENT_ID);
    exchangeURL.searchParams.set("client_secret", CLIENT_SECRET);
    exchangeURL.searchParams.set("code", code);

    const response = await fetch(exchangeURL.toString(), {
        method: 'POST',
        headers: {
            Accept: "application/json",
        },
    });

    const { access_token } = await response.json() as {access_token: string};

    const redirect = new URL(callback);
    redirect.searchParams.append('access_token', access_token);

    return new Response(null, {
        status: 302,
        headers: {
            Location: redirect.href 
        }
    })
}