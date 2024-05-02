import { Environment, getWebUrl } from "./utils/component";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- When the editor is bundled, proces is undefined
export const WEB_URL = getWebUrl(typeof process !== 'undefined' && process.env.ENV as Environment || 'production');

export const DEFAULT_WIDTH = 1960;
export const DEFAULT_HEIGHT = 1080;
