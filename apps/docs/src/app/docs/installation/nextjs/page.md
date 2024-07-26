---
title: NextJS
nextjs:
  metadata:
    title: Installation NextJS
    description: Install NextJS in a few simple steps.
---

Add Harmony to any project running the latest version of NextJS.

---

## 1. Install Harmony Editor

```npm
npm install harmony-ai-editor
```

Next, import the HarmonySetup tag.

#### App Router

Put this in your `layout.tsx` file.

```jsx
import { HarmonySetup } from "harmony-ai-editor";

//...Other content
<html>
  <body>
    {/** Other content */}
    <HarmonySetup repositoryId="<YOUR_REPO_ID>" />
  </body>
</html>;
```

#### Pages Router

Put this in your **\_app.tsx** file.

```jsx
import { HarmonySetup } from "harmony-ai-editor";

//...Other content
<>
  {/** Other content */}
  <HarmonySetup repositoryId="<YOUR_REPO_ID>" />
</>;
```

## 2. Install Harmony Plugin

```npm
npm install harmony-ai-plugin
```

{% callout type="note" title="Harmony only supports the latest version of NextJS" %}
The Harmony SWC plugin only is compatible with the latest version of NextJS, which is of this writing `v14.2.5`.
Update your NextJS application by running `npm install next@14.2.5`
{% /callout %}

### create-next-app

Next, make a `next.config.js` file in the root if it does not already exist.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  //...Other config properties
  experimental: {
    swcPlugins: [["harmony-ai-plugin", { rootDir: __dirname }]],
  },
};

module.exports = nextConfig;
```

If you have a `next.config.mjs` file, then do the following.

```js
/** @type {import('next').NextConfig} */
export const nextConfig = {
  //...Other config properties
  experimental: {
    swcPlugins: [
      [
        "harmony-ai-plugin",
        { rootDir: new URL(".", import.meta.url).pathname },
      ],
    ],
  },
};
```

### Monorepos

The rootDir property should point to the root of the project. In monorepos, you may need to manipulate the directory to achieve this

#### next.config.js

```js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  //...Other config properties
  experimental: {
    swcPlugins: [["harmony-ai-plugin", { rootDir: path("../..", __dirname) }]],
  },
};

module.exports = nextConfig;
```

#### next.config.mjs

```js
import path from "path";

/** @type {import('next').NextConfig} */
export const nextConfig = {
  //...Other config properties
  experimental: {
    swcPlugins: [
      [
        "harmony-ai-plugin",
        { rootDir: path("../..", new URL(".", import.meta.url).pathname) },
      ],
    ],
  },
};
```

Adjust the path property as needed to go up to the correct root directory.
