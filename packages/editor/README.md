# Editor

## Panels

The harmony panels live in the `panel` folder. Each panel has its own folder with a common folder for common components.

Panel structure:

- `DraggablePanel` component root with a `title` and `id` for the panel.

- `Panels.{id}`: A unique id for the panel

### DraggablePanel

The `DraggablePanel` component registers a panel based on the id passed in using the `useRegisterHarmonyPanel` hook. This hook adds the panel to the `panels` context state in the `HarmonyPanelProvider`. This state holds information about if the panel is showing and its position on the screen.

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
