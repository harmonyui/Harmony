import { create } from "zustand";
import type { ProjectInfoState} from "./project-info";
import { createProjectInfoSlice } from "./project-info";
import type { ComponentErrorState} from "./component-error";
import { createComponentErrorsSlice } from "./component-error";
import type { HarmonyComponentsState } from "./harmony-components";
import { createHarmonyComponentSlice } from "./harmony-components";
import { createPullRequestSlice } from "./pull-request";
import { createComponentUpdateSlice } from "./component-update";

type StoreState = ProjectInfoState & ComponentErrorState & HarmonyComponentsState;

export const useHarmonyStore = create<StoreState>()((...a) => ({
    ...createProjectInfoSlice(...a),
    ...createComponentErrorsSlice(...a),
    ...createHarmonyComponentSlice(...a),
    ...createPullRequestSlice(...a),
    ...createComponentUpdateSlice(...a)
}));