import { Environment } from ".";
import { getWebUrl } from ".";

export const WEB_URL = getWebUrl(process.env.ENV as Environment || 'production');