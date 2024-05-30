import { getWebUrl, environment } from "./utils/component";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- When the editor is bundled, proces is undefined
export const WEB_URL = getWebUrl(environment);

export const DEFAULT_WIDTH = 1960;
export const DEFAULT_HEIGHT = 1080;
export const INDEXING_VERSION = '0.0.3';
