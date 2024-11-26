# Editor

The editor is where all of the meat of the app lies. It is in charge of putting an app into an editor with the appropriate
editing tools, saving, loading, and publishing those changes to Github.

Here we have two parts: `HarmonySetup` and `HarmonyProvider`.

Harmony setup is the npm package that users install in their app. It gets things ready for the app to be put inside of `HarmonyProvider`, which is where all the editor code lives.

`HarmonyProvider` is contained in an external bundle script deployed on fly.io. The editor code lives in this external script so that we can setup CI/CD without having to make our users update npm everytime something changes to the editor.

This means that all api calls in the editor are made to this fly.io deployment.

## Component Updating

**Steps for making new update functionality (everything but CSS updates (see below))**

1. Create the UX experience that will be getting the needed user input to update the component
2. Create a `ComponentUpdateWithoutGlobal` object with the componentId of the element being updated, type of update (text, component, etc.), the name (additional identifying information about this update), the oldValue (the component's current value) and the value (the new value)
3. Pass this object into the `onAttributeChanges` function from `useHarmonyContext`
4. Add in logic in `makeUpdates` in `harmony-provider.tsx` that takes in the update object and actually makes a change to the DOM given the update type and value.

**Steps to update CSS (type className)**

Toolbar Item

1. Add a name describing the property/properties you are changing to the arrays correlating to which element type this toolbar item will show up for in `toolbar-panel.tsx`. For example, if you are adding a border popup toolbar item that allows the user to edit various border properties, and this toolbar item should show up when selecting a button element, add `borderAttrs` to the `buttonTools` array.
2. Add the necessary component that changes this attribute to the `commonTools` in `useToolbarTools`.
3. Do step 1. for adding a new Attribute Item

Attribute Item

1. Add the names of the all the styles affected by this new attribute in the `attributeTools` array in `attribute-panel.tsx`. Put any color related attributes in the `colorTools` array. For adding a border attribute, you would put `borderWidth`, `borderRadius` in the `attributeTools` array and `borderColor` in the `colorTools` array.
2. Add the attribute field in the `ComponentAttributePanel` component. You can use any of the helper components.
3. Make sure and use the `onAttributeChange` and `getAttribute` functions from `useComponentAttribute`. This will allow you to get the correct value and update it properly.

Under the hood, `onAttributeChange` takes the name and value of the attribute being changed and creates a `ComponentUpdate` object to send to the component updater, like in the above steps for making new update functionality.

## Panels

The harmony panels live in the `panel` folder. Each panel has its own folder with a common folder for common components.

Panel structure:

- `DraggablePanel` component root with a `title` and `id` for the panel.

- `Panels.{id}`: A unique id for the panel

### DraggablePanel

All panels use the `DraggablePanel` component and put in `HarmonyPanel`.

The `DraggablePanel` component registers a panel based on the id passed in using the `useRegisterHarmonyPanel` hook. This hook adds the panel to the `panels` context state in the `HarmonyPanelProvider`. This state holds information about if the panel is showing and its position on the screen.

Showing and hiding the panel is set in the `show` and `setShow` methods of `useHarmonyPanel`.

It also uses the `useDraggable` hook for the drag and drop experience. This hook is a dependency-less hook used in the drag and drop snapping experience for tracking the dragging, position, snap points, and restrictions of a draggable item.

### Panels.{id}

Each panel has a unique id as defined in the `Panels` enum.

### HarmonyPanelProvider

The `HarmonyPanelProvider` context provider holds all of the state for each of the panels.

The current state that it holds is `active: boolean` and `pos: {x: number, y: number}`.

It provides functions to register a new panel given a panel id and a way to toggle the active for all the panels.

`toggleAllActive` will turn off all the panels, but keep a copy of the state for how it was before the panels were turned off, so that when it is turned on again, it can go back to this state.

### Design Panel

The design panel is made of of design sections, different based on the `ComponentType` enum.

Each section is inside of the `sections` subfolder with a `Section` component as the root.

Each section is registered in the `register-panel.tsx` file where the section is put in a list corresponding to the component type.

#### Updating Attributes

Each section can manipulate the selected component's attribute. This is done using the `useComponentAttribute` hook, which has `getAttribute` and `onAttributeChange` methods.

To get the current attribute value, call `getAttribute` with the value that you want, for example `'color'`.

To then change that attribute value, call `onAttributeChange` with `{name: {attribute}, value: {value}}`.

The attributes that are accessible for editing live in the `attributeTools` array in `panel/design/types.ts`. Adding to this array the css property you want to edit will make it accessible for editing. Don't put color types in this array--see below.

##### Color Attributes

Color attributes show up as `rgb` in the DOM, but need to be `#{string}` in the color picker. This conversion is done automatically by putting the color attribute in the `colorTools` array instead of `attributeTools`.
