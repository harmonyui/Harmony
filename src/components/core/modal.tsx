'use client';
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePrevious } from "../../hooks/previous";
import { ReplaceWithName } from "../../../src/types/utils";
import { createPortal } from "react-dom";

interface ModalContextType {
	addModal: (newModal: React.ReactNode) => void,
	removeModal: (toRemoveId: number) => void,
	nextId: number,
	container: HTMLElement | undefined
}
const ModalContext = createContext<ModalContextType>({addModal: () => undefined, removeModal: () => undefined, nextId: -1, container: undefined});
export const ModalProvider: React.FunctionComponent<React.PropsWithChildren> = ({children}) => {
	const [modals, setModals] = useState<React.ReactNode[]>([]);
	const [container, setContainer] = useState<HTMLElement>();

	useEffect(() => {
		setContainer(document.body);
	}, [])

	const addModal = useCallback((newModal: React.ReactNode): void => {
		const copy = modals.slice();
		copy.push(newModal);
		setModals(copy);
		if (container)
			container.style.overflow = 'hidden';
	}, [modals]);

	const removeModal = useCallback((toRemove: number): void => {
		const copy = modals.slice();
		const index = toRemove;
		if (index < 0) throw new Error('Cannot remove modal');

		copy.splice(index);

		if (copy.length === 0 && container) {
			container.style.overflow = 'auto';
		}
			
		setModals(copy);
	}, [modals]);

	return (
		<ModalContext.Provider value={{addModal, removeModal, nextId: modals.length, container}}>
			{children}
			{modals.length > 0 ? <div className="fixed top-0 left-0 w-full z-50 bg-gray-500/90 h-screen overflow-auto">
				{modals}
			</div> : null}
		</ModalContext.Provider>
	)
}

export const ModalPortal: React.FunctionComponent<{children: React.ReactNode, show: boolean}> = ({children, show}) => {
	// const {addModal, removeModal} = useModal();
	// const prevShow = usePrevious(show);
	
	// useEffect(() => {
	// 	if (prevShow !== show) {
	// 		if (show) {
	// 			addModal(children);
	// 		} else {
	// 			removeModal();
	// 		}
	// 	}
	// }, [show, prevShow]);

	return <>
	{createPortal(show ? <div className="fixed top-0 left-0 w-full z-50 bg-gray-500/90 h-screen overflow-auto">
		{children}
	</div> : null, document.body)}
	</>
}

export const useModal = (): ReplaceWithName<ModalContextType, 'nextId' | 'removeModal', {removeModal: () => void}> => {
	const {nextId, removeModal, ...rest} = useContext(ModalContext);
	const [id] = useState(nextId);
	const remove = (): void => {
		removeModal(id);
	}

	return {...rest, removeModal: remove};
}