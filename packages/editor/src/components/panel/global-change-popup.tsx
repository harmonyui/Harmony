import { Button } from "@harmony/ui/src/components/core/button";
import { Popup } from "@harmony/ui/src/components/core/popup";
import { ComponentUpdate } from "@harmony/util/src/types/component";
import { useState, useEffect, useMemo } from "react";
import { findSameElementsFromId } from "../harmony-provider";

interface GlobalUpdatePopupProps {
	update: ComponentUpdate | undefined;
	onApplyGlobal: (update: ComponentUpdate) => void;
}
export const GlobalUpdatePopup: React.FunctionComponent<GlobalUpdatePopupProps> = ({update, onApplyGlobal}) => {
	const [show, setShow] = useState(Boolean(update));

	useEffect(() => {
		if (update && !show) {
			setShow(true);
		}
	}, [show, update]);

	const allInstances = useMemo(() => {
		if (update) {
			const ids = update.componentId.split('#');
			const baseId = ids[ids.length - 1];

			const instances = findSameElementsFromId(baseId);

			return instances.length;
		}

		return 0;
	}, [update]);
	
	return (
		<Popup show={show && allInstances > 1} onClose={() => {setShow(false)}}>
			<div className="hw-flex hw-justify-between hw-items-center hw-gap-4 hw-mx-4">
				<div>Would you like to make changes to all {allInstances} instances?</div>
				<Button onClick={() => {update && onApplyGlobal(update)}}>Yes</Button>
			</div>
		</Popup>
	)
}