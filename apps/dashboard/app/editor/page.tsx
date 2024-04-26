import { EditorDisplay } from "@harmony/ui/src/components/features/editor";
import {HarmonyProvider} from "harmony-ai-editor/src/components/harmony-provider"
import { prisma } from "../../../../src/server/db";

const EditorPage = async () => {
    const branch = await prisma.branch.findFirst();
    return <EditorDisplay branchId={branch?.id || ''}/>
}

export default EditorPage;