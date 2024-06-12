import { Button } from "@harmony/ui/src/components/core/button";
import { Popup } from "@harmony/ui/src/components/core/popup";
import { ComponentUpdate } from "@harmony/util/src/types/component";
import { useState, useEffect, useMemo } from "react";
import { findSameElementsFromId } from "../harmony-provider";
import { useHarmonyStore } from "../hooks/state";

interface GlobalUpdatePopupProps {
    onUndo: () => void;
    executeCommand: (update: ComponentUpdate[], execute?: boolean) => void
}
export const GlobalUpdatePopup: React.FunctionComponent<GlobalUpdatePopupProps> = ({ onUndo, executeCommand }) => {
    const updates = useHarmonyStore(state => state.globalUpdate);
    const [show, setShow] = useState(Boolean(updates));
    const onApplyGlobal = useHarmonyStore(state => state.onApplyGlobal);

    useEffect(() => {
        if (updates && !show) {
            setShow(true);
        }
    }, [show, updates]);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                setShow(false);
                onApplyGlobal(undefined);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [show, updates])

    const allInstances = useMemo<number>(() => {
        if (updates) {
            const ids = updates[0].componentId.split('#');
            const baseId = ids[ids.length - 1];

            const instances = findSameElementsFromId(baseId);

            return instances.length;
        }

        return 0;
    }, [updates]);

    return (
        <Popup show={show && allInstances > 1} onClose={() => { setShow(false); onApplyGlobal(undefined) }}>
            <div className="hw-flex hw-justify-between hw-items-center hw-gap-4 hw-mx-4">
                <div>You have unlinked this property</div>
                {updates && (
                    <>
                        <Button onClick={() => { onUndo(); onApplyGlobal(undefined); setShow(false) }}>Undo</Button>
                        <Button onClick={() => { onUndo(); executeCommand(updates.map(update => ({ ...update, isGlobal: true })), true);; onApplyGlobal(undefined); setShow(false) }}>Apply All</Button>
                    </>
                )}
            </div>
        </Popup>
    )
}