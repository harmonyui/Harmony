import { Environment } from ".";
import { getWebUrl } from ".";

export const WEB_URL = getWebUrl(typeof process !== 'undefined' && process.env.ENV as Environment || 'production');

export const DEFAULT_WIDTH = 1960;
export const DEFAULT_HEIGHT = 1080;