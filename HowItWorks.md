# How Harmony Works

![image](/Harmony%20System%20Diagram.png)

Under the hood, Harmony maps DOM elements as displayed on the client to where the appropriate update needs to happen in the code. This is done in a few steps with the help of different services:

- Plugin: Assign each JSX element a unique id at compile time. This id holds information about where it and its parents are defined in the code.
- Editor: Edit DOM elements in a no code way. Using the unique id, send those updates to the server to have them saved.
- Indexer: Figure out where changes need to be made in a highly dynamic codebase.
- Github: The Harmony Github app needs to be installed in the repo where the changes are going to be made.
- Publisher: Using the indexer, figure out where changes need to be made, make the changes, and publish to Github.

## Plugin

(Defined in [packages/swc-plugin](/packages/swc-plugin/README.md), [packages/babel-plugin](/packages/babel-plugin/README.md), [packages/vite-plugin](/packages/vite-plugin/README.md)).

One trick to Harmony is being able to map a DOM element to its definition in the code base. This is done through the Harmony Plugin, which is either babel based or Speedy Web Compiler (SWC) based.

When the app is being compiled, Harmony acts as a transformer that visits each JSXElement node and adds a data-harmony-id tag. The format of this tag looks like this: `file:lineStart:columnStart:lineEnd:columnEnd`. This sequence is repeated multiple times for each element, element's parent component, element's parent's parent component, etc. all the way up to root. This sequence is this base64 encoded and joined with `#`.

Here is an example data id from our staging dashboard app:
`YXBwcy9kYXNoYm9hcmQvYXBwLyhhcHBsaWNhdGlvbikvbGF5b3V0LnRzeDo0Ojk6NDozOA==#YXBwcy9kYXNoYm9hcmQvdXRpbHMvc2lkZS1uYXYudHN4OjQ1OjQ6NTU6MTY=#cGFja2FnZXMvdWkvc3JjL2NvbXBvbmVudHMvY29yZS9zaWRlLXBhbmVsLnRzeDo0OTo2OjI5MDoxMg==`

If you run this code in your browser, you can get all the information about this html element plus its parent React components up to root:
`'YXBwcy9kYXNoYm9hcmQvYXBwLyhhcHBsaWNhdGlvbikvbGF5b3V0LnRzeDo0Ojk6NDozOA==#YXBwcy9kYXNoYm9hcmQvdXRpbHMvc2lkZS1uYXYudHN4OjQ1OjQ6NTU6MTY=#cGFja2FnZXMvdWkvc3JjL2NvbXBvbmVudHMvY29yZS9zaWRlLXBhbmVsLnRzeDo0OTo2OjI5MDoxMg=='.split('#').map(a => atob(a))`.

This outputs the following array:
`["apps/dashboard/app/(application)/layout.tsx:4:9:4:38"
"apps/dashboard/utils/side-nav.tsx:45:4:55:16"
"packages/ui/src/components/core/side-panel.tsx:49:6:290:12"]`

Go and figure out which element and React components this is referring to!

This id acts as an (almost) unique id for each DOM element (There are a few exceptions to this).

## Editor

(Defined in [packages/editor](/packages/editor/README.md))

The editor is the React code that overlays on top of your deployed app and allows you to make no code elements to the DOM. The editor can be installed in two ways:

- Through npm (`<HarmonySetup/>` tag)
- Through the Harmony UI chrome extension

Go to the [editor](/packages/editor/README.md) for details on how this code works.

### Making Updates

At a high level, each no code update exists as a [`ComponentUpdate`](/packages/util/src/types/component.ts) object, which holds information about the element being updated (id, childIndex, updateType, newValue, oldValue, etc.).

Using the [component updater](/packages/editor/src/components/hooks/component-updater.ts), these update commands are applied to the DOM. They are also saved to the backend using the [saveProject](/packages/server/src/api/routers/editor.ts) TRPC route and stored as `ComponentUpdate` records in the database. This means that when the page is refreshed, these commands sent through the component updater like before and the DOM is updated.

### Publishing

When it is time to publish, the [publish](/packages/server/src/api/routers/editor.ts) TRPC route is called. This takes the saved `ComponentUpdate`'s and calls the publisher.

## Indexer

(Defined in [packages/server/src/api/services/indexor](/packages/server/src/api/services/indexor/README.md))

The indexer is the heart of Harmony. It is the 'secret sauce'.

Knowing where an element is defined in the code using the plugin is not enough to know where to make the updates in a highly dynamic codebase. Let's say that we are wanting to change the text of a button in one of our apps. But this button is defined as a dynamic core component used in hundreds of other places. It would not make sense to make the update right where the `<button>` html element is defined. We will have to see where the `<Button>` React component is being used. But maybe this `<Button>` component is being used in a `<Card>` component that is inside of a `<UserProfileCard>` component. Not only that, but the actual text does not show up statically as a prop like `<UserProfileCard buttonText="I want to change this"/>`. It looks like this `<UserProfileCard buttonText={cardInfo.buttonText}>` where `cardInfo` is defined as an object like `const cardInfo = {buttonText: 'I want to change this'}`.

This is where the indexer comes into play. It is able to start at the base `<button` element, see the dynamic `children` property be passed in, and trace it all the way up to the `buttonText` property of the `cardInfo` object. So now it knows 'Whenever we need to make a change to this button's text, let's make that change at this line number/column number (where the `buttonText` property is defined)'

This is done through what's called the Abstract Syntax Tree. Go read more about that is you do not know what that is :)

The Indexer essentially takes each property of a JSXElement and traces it back to its source. Most of the time the source ends up being static at some point, but sometimes in the case of data being fetched from a database, it is always dynamic. In this case, the indexer flags these properties, which allows the Editor to alert the user that these properties are not editable.

## Publish

(Defined in [packages/server/src/api/services/publish](/packages/server/src/api/services/publish/README.md))

Using the saved `ComponentUpdates` from the Editor and the `HarmonyComponent` information from the Indexer, we are now ready to actually make updates to the code.

Publishing the code happens in two steps:

- CodeUpdater: Gets information about where and what in each file needs to be changed
- Publisher: Takes these file updates and creates a pull request with them through Github

The code updater takes the updates and creates `CodeUpdateInfo` objects from them. This is done using the `HarmonyComponent` objects from the Indexer.

Using the `CodeUpdateInfo` objects, which has the edited AST node and the location of where it is defined, `FileUpdateInfo` objects are created. These objects have information about the file, location, and new snippet for each change.

Using the `FileUpdateInfo` objects, the publisher creates the new files with the edits. Then with the new files, it creates a pull request and sends it to Github.

## Github

In order to make pull requests, users need to install the Harmony Github App on the repo where they want to make updates. This installation flow happens when users create an account.

All the methods needed for interacting with Github are in the [`GithubRepository`](/packages/server/src/api/repository/git/github.ts`) class.
