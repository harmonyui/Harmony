<h3 align="center">Harmony UI</h3>
<p align="center">
    Make no-code edits directly to your deployed React application.
</p>
<div align="center">
  <a href="https://github.com/harmonyui/harmony/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/harmonyui/harmony"></a>
</div>

## Authors

<a href="https://github.com/harmonyui/harmony/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=harmonyui/harmony" />
</a>

## Summary

Harmony is a design suite that allows designers to change the UI of their custom React app using no-code tools with the resulting changes contributing directly to the codebase.

## Contributing

To contribute, make sure to fork the repository and clone the repo locally. Then follow the following steps to get things setup locally:

### Environment Variables

First run
`cp .env.example .env`

Then email Braydon at [braydon.jones28@gmail.com](mailto:braydon.jones28@gmail.com) to get the necessary variables.

### Postgres Database

Run `pnpm run compose` to setup a local docker Postgres and Redis server.

### Run

Run `pnpm run dev`. This will start both the dashboard front-end on port 3000 and the editor on port 4200.

### Setup Account

Sign in with your gmail, then you should see the setup page. Fill that out and copy and paste the link it gives in a new tab. When you authenticate with Github and see the repositories to import, you should see Harmony as an option. Import that, then skip through the rest of the flow.

The last step will be to make sure the database repository id matches the repository id that is currently installed in the `HarmonySetup` component in the codebase. The way I do that is by running `pnpm run db:studio`, which will allow you to edit entries in the database. Go to the `Repository` table and change the `id` to `fbefdac4-8370-4d6d-b440-0307882f0102`.

You should now be able to create a project and use the Harmony Editor on the Harmony dashboard.

### Configuring Other Projects

In order to setup personal projects with Harmony, go to `/mirror/new`. This will allow you to create a new account (because currently there is only one repository per account). Go through the flow again, this time paying attention to the Developer Setup page and following the setups it says on the screen.

The next thing you will have to do is make a change the Accounts table. Make sure you have Prisma studio running (`pnpm run db:studio`). Go to the Accounts table and change the `userId` field of the account you just created to something `user_(whatever)`. This will allow you to mirror between accounts properly by going to `/mirror`.

### Debugging

A VSCode debugger is setup with this project if you would rather use that than `pnpm run dev`. The NextJS server side one will run and debug the harmony dashboard. `Editor` is for debugging anything in the editor. Once you run these two things, you can set break points that will be hit on the server.

#### Debugging Harmony on Deployed Projects

If you would like to debug the editor on a project using its deployed URL instead of a local instance, tack on the query parameter `harmony-environment=development` to the URL. This will have the project target your locally running editor instead of the typical production editor. You will have free reign to debug how the editor behaves on this application.

## Structure

Harmony's structure is a monorepo with apps, packages, and tooling. Anything that is deployed will be an app in the apps folder. Any group of code that is shared among different apps lives in the packages folders. The tailwind, eslint, typescript, and prettier tooling lives in the tooling folder.

## Technologies Used

- NextJS
- Typescript
- Prisma w/ postgres
- TRPC
- TailwindCSS
- Zod

### Apps

Apps are anything that is deployed and accessible through the internet. Any NextJS app will be in the apps folder. Apps use a variety of different packages from the packages folder.

#### Chrome

The chrome extension allows users to use Harmony to edit any website. In order to publish the changes, users still need to install the harmony plugin.

- React
- Typescript

#### Dashboard

The dashboard is how users can sign up for a Harmony account and connect their codebase to Github. They can also manage active projects, teams, and settings.

- NextJS
- Typescript
- Prisma w/ postgres
- TRPC

#### Docs

The docs app is an in depth onboarding guide on how to install Harmony into your codebase based on different frontend frameworks. This includes various React frameworks like NextJS, Vite, and vanilla React.

- NextJS
- Typescript

#### Landing Page

This application is the Harmony landing page with marketing content, pricing, and blog information.

- NextJS
- Typescript
- Sanity (for the blogs)

### Packages

Packages have stand alone groups of code that is reused throughout different apps

#### Babel Plugin

This is the base Harmony plugin using the babel transpiler. Any React framework that is based in babel will use this plugin in some way. For example, the vite-plugin package is just a wrapper over this babel plugin.

- Typescript
- Babel compiler

#### Db

This package is in charge of the database schema, connections, and types. The database is Postgres with a Prisma connector.

- Prisma
- postgres

#### Editor

The [editor](/packages/editor/README.md) is part of the meat of Harmony (the other part is the server package). All the code for the Harmony Editor is in this package. This is the code used in both the chrome extension and npm package.

- React
- Typescript
- TRPC

#### Server

This is the other meat of Harmony. This package handles everything server side (right now the server is made up of just one package, but that could change).

The things the server includes:

- Database CRUD operations
- Editor operations like loading, saving, and publishing projects
- Indexing the codebase
- Publishing code changes and pushing to Github

Api calls are done through a TRPC client. This allows type saftey from the frontend to backend. The only route that is currently hit from the editor is the "editor" route inside `packages/server/src/api/routers/editor.ts`. That means all saving, loading, and publishing actions are inside this route.

Technologies:

- Typescript
- Prisma w/ postgres
- Babel compiler

#### SWC Plugin

This plugin is the Rust based Speedy Web Compiler plugin that is necessary for NextJS applications. It is essentially the same thing as the Babel plugin, just in Rust.

- Rust
- SWC compiler

#### UI

This package has all of the core React components that are used throughout different apps.

- React
- Typescript
- TailwindCSS

#### Util

This package has generic utility functions that are common among apps. It also contains the common types shared across apps.

- Typescript

#### Vite Plugin

This package is just a wrapper over the Babel plugin package making things compatible with Vite.
