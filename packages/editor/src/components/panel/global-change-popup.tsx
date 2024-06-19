import { Button } from "@harmony/ui/src/components/core/button";
import { Popup } from "@harmony/ui/src/components/core/popup";
import { ComponentUpdate } from "@harmony/util/src/types/component";
import { useState, useEffect, useMemo } from "react";
import { useHarmonyStore } from "../hooks/state";
import { findSameElementsFromId } from "../../utils/element-utils";

interface GlobalUpdatePopupProps {
    onUndo: () => void;
    executeCommand: (update: ComponentUpdate[], execute?: boolean) => void
}
export const GlobalUpdatePopup: React.FunctionComponent<GlobalUpdatePopupProps> = ({ onUndo, executeCommand }) => {
    const updates = useHarmonyStore(state => state.globalUpdate);
    const onApplyGlobal = useHarmonyStore(state => state.onApplyGlobal);

    useEffect(() => {
        if (updates) {
            const timer = setTimeout(() => {
                onApplyGlobal(undefined);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [updates])

    const allInstances = useMemo<number>(() => {
        if (updates) {
            const ids = updates[0].componentId.split('#');
            const baseId = ids[ids.length - 1];

            const instances = findSameElementsFromId(baseId);

            return instances.length;
        }

        return 0;
    }, [updates]);

    const handleUndo = () => {
        onUndo();
        onApplyGlobal(undefined);
    }

    const handleApplyAll = () => {
        if (!updates) return;
        onUndo();
        executeCommand(updates.map(update => ({ ...update, isGlobal: true })), true);
        onApplyGlobal(undefined);
    }

    return (
        <Popup show={updates != undefined && allInstances > 1} onClose={() => { onApplyGlobal(undefined) }}>
            <div className="hw-flex hw-justify-between hw-items-center hw-gap-4 hw-mx-4">
                <div>You have unlinked this property</div>
                <Button onClick={handleUndo}>Undo</Button>
                <Button onClick={handleApplyAll}>Apply All</Button>
            </div>
        </Popup>
    )
}