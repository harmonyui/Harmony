/* eslint-disable @typescript-eslint/no-non-null-assertion -- ok*/
import type { ComponentElement } from "@harmony/util/src/types/component"
import { useMemo } from "react"
import { useHarmonyContext } from "../harmony-context"
import { componentIdentifier, isSelectable } from "../inspector/inspector"
import type { TreeViewItem} from "./tree-view";
import { TreeView } from "./tree-view"

export const ComponentLayoutPanel: React.FunctionComponent<ComponentTreeViewProps> = ({selectedComponent}) => {
    return (
        <div className="hw-max-w-[300px] hw-p-2">
            <ComponentTreeView selectedComponent={selectedComponent}/>
        </div>
    )
}

export const useComponentTreeItems = (root: ComponentElement | undefined, selectedComponent: HTMLElement | undefined): TreeViewItem<ComponentElement>[] => {
	const {scale} = useHarmonyContext();
    const getTreeItems = (children: ComponentElement[]): TreeViewItem<ComponentElement>[] => {
		return children.filter(child => isSelectable(child.element!, scale)).map<TreeViewItem<ComponentElement>>(child => ({
			id: child,
			content: child.name,
			items: getTreeItems(child.children),
			selected: selectedComponent === child.element
		}))
	}
	const treeItems: TreeViewItem<ComponentElement>[] = root ? getTreeItems([root]) : [];

	return treeItems;
}
interface ComponentTreeViewProps {
	selectedComponent: ComponentElement | undefined;
}
const ComponentTreeView: React.FunctionComponent<ComponentTreeViewProps> = () => {
	const {onComponentHover, onComponentSelect, selectedComponent} = useHarmonyContext();

	const rootElement = useMemo(() => {
		const section = document.getElementById('harmony-section');
		if (!section) {
			throw new Error("Cannot find harmony section");
		}

        let element: HTMLElement = section;
        //A little bit hard coded for mounting on the root (vanilla react)
        const root = document.getElementById('root');
        if (root) {
            element = root.children[0] as HTMLElement | null || element;
        } else {
            element.dataset.harmonyId = document.body.dataset.harmonyId;
        }

        const componentElement = componentIdentifier.getComponentFromElement(element);
		if (!componentElement) {
			throw new Error("Cannot get component element from harmony section");
		}

		return componentElement;
	}, []);

	const treeItems = useComponentTreeItems(rootElement, selectedComponent);

	return (
		<TreeView items={treeItems} expand={true} onClick={(item) => {onComponentSelect(item.id.element!)}} onHover={(item) => {onComponentHover(item.id.element!)}}/>
	)
}