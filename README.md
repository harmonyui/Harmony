# Harmony

## Editor

The editor is where all of the meat of the app lies. It is in charge of putting an app into an editor with the appropriate
editing tools, saving, loading, and publishing those changes to Github.

### Front-end

The front end part of the editor is in the editor package. There you have two parts: `HarmonySetup` and `HarmonyProvider`.
Harmony setup is the npm package that users install in their app. It gets things ready for the app to be put inside of `HarmonyProvider`, which is where all the editor code lives.

`HarmonyProvider` is contained in an external bundle script deployed on fly.io. The editor code lives in this external script so that we can setup CI/CD without having to make our users update npm everytime something changes to the editor.

This means that all api calls in the editor are made to this fly.io deployment.

#### HarmonyProvider

This is where brain of the editor is. It is the source of state and logic. Any state/logic that is shared between either the Inspector or panel should live here.

#### Inspector

This is where the functionality for any direct DOM manipulation lives. That means hovering over a component, selecting, changing text, drag and drop, etc.

#### HarmonyPanel

This is the source of the toolbar/side-panel.

#### ComponentUpdater

Every DOM manipulation is abstracted into a "command", which is a `ComponentUpdate` object. This allows DOM manipulation to have a single dependency and thus easier to manage.

#### Components

Core components are contained in `packages/ui/src/core`.

### Backend

Api calls are done through a TRPC client. This allows typesaftey from the frontend to backend. The only route that is currently hit from the editor is the "editor" route inside `packages/server/src/api/routers/editor.ts`. That means all saving, loading, and publishing actions are inside this route.

## Dev Setup

### Environment Variables

First run
`cp .env.example .env`

Then talk to Braydon to get the necessary variables.

### Postgres Database

Run `pnpm run compose` to setup a local docker Postgres server.

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
